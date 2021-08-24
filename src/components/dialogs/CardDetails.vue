<template lang="pug">
dialog.card-details(v-if="visible" :open="visible" ref="dialog" @click.left="closeDialogs" @keyup.stop.backspace="removeCard" :style="styles")
  .opening-frame(v-if="isOpening" :style="openingFrameStyle")
  section
    .textarea-wrap
      textarea.name(
        :disabled="!canEditCard"
        ref="name"
        rows="1"
        placeholder="Type text here, or paste a URL"
        v-model="name"
        @keydown.prevent.enter.exact

        @compositionend="updateCompositionEventEndTime"
        @keyup.enter.exact="closeCard"
        @keyup.stop.esc
        @keydown.esc="closeCardAndFocus"

        @keyup.stop.backspace="checkIfShouldShowPicker"
        @keyup.stop.up="checkIfShouldHidePicker"
        @keyup.stop.down="checkIfShouldHidePicker"
        @keyup.stop.left="checkIfShouldHidePicker"
        @keyup.stop.right="checkIfShouldHidePicker"

        data-type="name"
        :maxlength="maxCardLength"
        @click.left="clickName"
        @blur="triggerUpdatePositionInVisualViewport"
        @paste="updatePastedName"

        @keyup.alt.enter.exact.stop
        @keyup.ctrl.enter.exact.stop
        @keydown.alt.enter.exact.stop="insertLineBreak"
        @keydown.ctrl.enter.exact.stop="insertLineBreak"

        @keyup="updatePickerSearch(null)"

        @keydown="updatePicker"
        @keydown.down="triggerPickerNavigation"
        @keydown.up="triggerPickerNavigation"
        @keydown.enter="triggerPickerSelectItem"
        @keydown.tab="triggerPickerSelectItem"
        @keydown.221="triggerPickerSelectItem"
        @keydown.bracket-right="triggerPickerSelectItem"
        @keydown.57="triggerCommentAddClosingBrackets"

        @focus="resetPinchCounterZoomDecimal"
      )
      TagPicker(
        :visible="tag.pickerIsVisible"
        :cursorPosition="cursorPosition"
        :position="tag.pickerPosition"
        :search="tag.pickerSearch"
        @closeDialog="hideTagPicker"
        @selectTag="updateTagBracketsWithTag"
      )
      SpacePicker(
        :visible="space.pickerIsVisible"
        :parentIsCardDetails="true"
        :cursorPosition="cursorPosition"
        :position="space.pickerPosition"
        :search="space.pickerSearch"
        :shouldExcludeCurrentSpace="true"
        @closeDialog="hideSpacePicker"
        @selectSpace="replaceSlashCommandWithSpaceUrl"
      )
      .inline-button-wrap(v-if="showCardTips" @click.left.stop="toggleCardTipsIsVisible" :class="{ active: cardTipsIsVisible }")
        button.inline-button(tabindex="-1" :class="{ active: cardTipsIsVisible }")
          span ?
      CardTips(:visible="cardTipsIsVisible" :maxCardLength="maxCardLength")

    .row(v-if="cardPendingUpload")
      .badge.info
        Loader(:visible="true")
        span {{cardPendingUpload.percentComplete}}%

    .row
      //- Remove
      .button-wrap
        button(:disabled="!canEditCard" @click.left="removeCard")
          img.icon(src="@/assets/remove.svg")
          span Remove
      //- [·]
      .button-wrap.cards-checkboxes
        label(v-if="checkbox" :class="{active: checkboxIsChecked, disabled: !canEditCard}" tabindex="0")
          input(type="checkbox" v-model="checkboxIsChecked" tabindex="-1")
        label(v-else @click.left.prevent="addCheckbox" @keydown.stop.enter="addCheckbox" :class="{disabled: !canEditCard}" tabindex="0")
          input.add(type="checkbox" tabindex="-1")
      //- Image
      .button-wrap
        button(:disabled="!canEditCard" @click.left.stop="toggleImagePickerIsVisible" :class="{active : imagePickerIsVisible}")
          img.icon.flower(src="@/assets/flower.svg")
        ImagePicker(:visible="imagePickerIsVisible" :initialSearch="initialSearch" :cardUrl="url" :cardId="card.id" @selectImage="addFile")
      //- Frames
      .button-wrap
        button(:disabled="!canEditCard" @click.left.stop="toggleFramePickerIsVisible" :class="{active : framePickerIsVisible}")
          span Frame
        FramePicker(:visible="framePickerIsVisible" :cards="[card]")
      //- Toggle Collaboration Info
      .button-wrap
        button.toggle-collaboration-info(@click.left.stop="toggleCollaborationInfoIsVisible" :class="{active : collaborationInfoIsVisible}")
          img.down-arrow(src="@/assets/down-arrow.svg")

    CardCollaborationInfo(:visible="collaborationInfoIsVisible" @closeDialogs="closeCardDialogs" :createdByUser="createdByUser" :updatedByUser="updatedByUser" :card="card" :triggerCloseComponent="shouldTriggerCloseChildComponents")

    .row(v-if="nameSplitIntoCardsCount || hasUrls")
      //- Show Url
      .button-wrap(v-if="hasUrls")
        button(:disabled="!canEditCard" @click.left.stop="toggleUrlsIsVisible" :class="{active: urlsIsVisible}")
          img.icon(v-if="urlsIsVisible" src="@/assets/view-hidden.svg")
          img.icon(v-else src="@/assets/view.svg")
          span URL
      //- Split by Line Breaks
      .button-wrap(v-if="nameSplitIntoCardsCount")
        button(:disabled="!canEditCard" @click.left.stop="splitCards")
          img.icon(src="@/assets/split-vertically.svg")
          span Split into {{nameSplitIntoCardsCount}} Cards

    .row.badges-row(v-if="tagsInCard.length || card.linkToSpaceId || nameIsComment || isInSearchResultsCards")
      //- Search result
      span.badge.search(v-if="isInSearchResultsCards")
        img.icon.search(src="@/assets/search.svg")
      //- Tags
      template(v-for="tag in tagsInCard")
        span.badge.button-badge(
          :style="{backgroundColor: tag.color}"
          :class="{ active: currentSelectedTag.name === tag.name }"
          tabindex="0"
          @click.left.stop="showTagDetailsIsVisible($event, tag)"
          @touchend.stop="showTagDetailsIsVisible($event, tag)"
          @keyup.stop.enter="showTagDetailsIsVisible($event, tag)"
        ) {{tag.name}}
      //- Links
      .badge.button-badge.link-badge(
        v-if="card.linkToSpaceId"
        :class="{ active: currentSelectedLinkisActive }"
        @click.left.stop="showLinkDetailsIsVisible($event)"
        @touchend.stop="showLinkDetailsIsVisible($event)"
        @keyup.stop.enter="showLinkDetailsIsVisible($event)"
      )
        User(v-if="linkToSpace" :user="linkToSpace.users[0]" :isClickable="false")
        span {{linkName}}
        img.icon.private(v-if="spaceIsPrivate" src="@/assets/lock.svg")
      //- Comment
      .badge.info(v-if="nameIsComment" :style="{backgroundColor: updatedByUser.color}")
        span ((comment))

    MediaPreview(:visible="cardHasMedia" :card="card" :formats="formats" @removeUrl="removeUrlFromName")
    UrlPreview(:visible="cardUrlPreviewIsVisible" :loading="isLoadingUrlPreview" :card="card" :parentIsCardDetails="true")

    //- Read Only
    p.row.edit-message(v-if="!canEditCard")
      template(v-if="spacePrivacyIsOpen")
        span.badge.info
          img.icon.open(src="@/assets/open.svg")
          span In open spaces, you can only move and edit cards you've made
      template(v-else-if="isInvitedButCannotEditSpace")
        span.badge.info
          img.icon(src="@/assets/unlock.svg")
          span To edit spaces you've been invited to, you'll need to sign up or in
        .row
          .button-wrap
            button(@click.left.stop="triggerSignUpOrInIsVisible") Sign Up or In
      template(v-else-if="spacePrivacyIsClosed")
        span.badge.info
          img.icon(src="@/assets/unlock.svg")
          span To edit closed spaces, you'll need to be invited
    //- Errors
    template(v-if="errorMaxCardLength")
      span.badge.danger
        img.icon.cancel(src="@/assets/add.svg")
        span Max Length
      p To fit small screens, cards can't be longer than {{maxCardLength}} characters
    template(v-if="error.signUpToUpload")
      p
        span To upload files,
        span.badge.info you need to Sign Up or In
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    template(v-if="error.sizeLimit")
      p
        span.badge.danger
          img.icon.cancel(src="@/assets/add.svg")
          span Too Big
      p
        span To upload files over 5mb,
        span.badge.info upgrade for unlimited
      button(@click.left="triggerUpgradeUserIsVisible") Upgrade for Unlimited
    template(v-if="error.unknownUploadError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
</template>

<script>
import FramePicker from '@/components/dialogs/FramePicker.vue'
import ImagePicker from '@/components/dialogs/ImagePicker.vue'
import CardTips from '@/components/dialogs/CardTips.vue'
import TagPicker from '@/components/dialogs/TagPicker.vue'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'
import UrlPreview from '@/components/UrlPreview.vue'
import MediaPreview from '@/components/MediaPreview.vue'
import CardCollaborationInfo from '@/components/CardCollaborationInfo.vue'
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'

import qs from '@aguezz/qs-parse'
import nanoid from 'nanoid'
import debounce from 'lodash-es/debounce'

let previousTags = []
let compositionEventEndTime = 0

const openingPreDuration = 250 // ms
const openingDuration = 250 // ms
let openingAnimationTimer, openingStartTime, shouldCancelOpening

export default {
  name: 'CardDetails',
  components: {
    FramePicker,
    ImagePicker,
    CardTips,
    TagPicker,
    SpacePicker,
    Loader,
    UrlPreview,
    MediaPreview,
    User,
    CardCollaborationInfo
  },
  props: {
    card: Object // name, x, y, z
  },
  data () {
    return {
      framePickerIsVisible: false,
      imagePickerIsVisible: false,
      cardTipsIsVisible: false,
      initialSearch: '',
      pastedName: '',
      wasPasted: false,
      cursorPosition: 0,
      shouldCancelBracketRight: false,
      insertedLineBreak: false,
      error: {
        signUpToUpload: false,
        sizeLimit: false,
        unknownUploadError: false
      },
      tag: {
        pickerIsVisible: false,
        pickerPosition: {},
        pickerSearch: ''
      },
      space: {
        pickerIsVisible: false,
        pickerPosition: {},
        pickerSearch: ''
      },
      notifiedMembers: false,
      formats: {
        image: '',
        video: '',
        audio: '',
        link: '',
        file: ''
      },
      nameSplitIntoCardsCount: 0,
      isOpening: false,
      openingPercent: 0,
      openingAlpha: 0,
      shouldTriggerCloseChildComponents: ''
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.framePickerIsVisible = false
        this.imagePickerIsVisible = false
        this.cardTipsIsVisible = false
        this.hidePickers()
      }
      if (mutation.type === 'triggerUploadComplete') {
        let { cardId, url } = mutation.payload
        if (cardId !== this.card.id) { return }
        this.addFile({ url })
      }
      if (mutation.type === 'triggerUnloadPage' && this.visible) {
        this.$store.dispatch('currentSpace/removeUnusedTagsFromCard', this.card.id)
      }
    })
  },
  updated () {
    this.$nextTick(() => {
      if (this.visible) {
        this.textareaSizes()
      }
    })
  },
  mounted () {
    // for new cards only
    const element = this.$refs.dialog
    if (element) {
      this.scrollIntoViewAndFocus()
      this.$emit('broadcastShowCardDetails')
      this.updatePreviousTags()
      this.updatePinchCounterZoomDecimal()
    }
  },
  computed: {
    visible () { return this.$store.state.cardDetailsIsVisibleForCardId === this.card.id },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    cardIsCreatedByCurrentUser () { return this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](this.card) },
    spacePrivacyIsOpen () { return this.$store.state.currentSpace.privacy === 'open' },
    spacePrivacyIsClosed () { return this.$store.state.currentSpace.privacy === 'closed' },
    isInSearchResultsCards () {
      const results = this.$store.state.searchResultsCards
      if (!results.length) { return }
      return Boolean(results.find(card => this.card.id === card.id))
    },
    spaceIsPrivate () {
      const space = this.linkToSpace
      if (!space) { return }
      return space.privacy === 'private'
    },
    showCardTips () {
      if (this.name) { return }
      return true
    },
    nameIsComment () { return utils.isNameComment(this.name) },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    canEditCard () {
      if (this.isSpaceMember) { return true }
      if (this.canEditSpace && this.cardIsCreatedByCurrentUser) { return true }
      return false
    },
    linkToSpace () {
      const spaceId = this.card.linkToSpaceId
      const space = this.$store.getters.otherSpaceById(spaceId)
      return space
    },
    linkName () {
      const space = this.linkToSpace
      if (space) {
        return space.name
      } else {
        return 'Space is loading or invalid'
      }
    },
    isInvitedButCannotEditSpace () { return this.$store.getters['currentUser/isInvitedButCannotEditSpace']() },
    maxCardLength () { return 300 },
    errorMaxCardLength () {
      if (this.card.name.length >= this.maxCardLength) {
        return true
      } else {
        return false
      }
    },
    tagsInCard () {
      const tagNames = utils.tagsFromStringWithoutBrackets(this.name)
      if (!tagNames) { return [] }
      let tags = []
      tagNames.forEach(name => {
        const tag = this.$store.getters['currentSpace/tagByName'](name)
        tags.push(tag)
      })
      return tags
    },
    currentSelectedTag () { return this.$store.state.currentSelectedTag },
    currentSelectedLink () { return this.$store.state.currentSelectedLink },
    currentSelectedLinkisActive () {
      if (!this.currentSelectedLink.space) { return }
      return this.currentSelectedLink.space.id === this.card.linkToSpaceId
    },
    currentUserIsSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    isFavoriteSpace () { return this.$store.getters['currentSpace/isFavorite'] },
    name: {
      get () {
        return this.card.name
      },
      set (newName) {
        this.updateCardName(newName)
        if (this.wasPasted) {
          this.wasPasted = false
        } else {
          this.pastedName = ''
        }
        this.updateNameSplitIntoCardsCount()
      }
    },
    url () { return utils.urlFromString(this.name) },
    urls () {
      const name = utils.removeMarkdownCodeblocksFromString(this.name)
      const urls = utils.urlsFromString(name, true)
      return urls
    },
    validUrls () {
      if (!this.urls) { return [] }
      return this.urls.filter(url => {
        return utils.urlType(url) === 'link'
      })
    },
    validWebUrls () {
      const urls = this.validUrls.filter(url => {
        const urlHasProtocol = utils.urlHasProtocol(url)
        const isLinode = url.includes('us-east-1.linodeobjects.com')
        const isSpace = utils.urlIsSpace(url)
        return urlHasProtocol && !isLinode && !isSpace
      })
      if (!urls.length && this.card.urlPreviewUrl) {
        this.clearUrlPreview()
      }
      return urls
    },
    hasUrls () {
      return Boolean(this.validUrls.length)
    },
    urlsIsVisible () {
      const urlsVisible = this.validUrls.filter(url => {
        const queryString = utils.queryString(url)
        if (queryString) {
          const queryObject = qs.decode(queryString)
          return queryObject.hidden || queryObject.kinopio
        } else {
          return false
        }
      })
      return urlsVisible.length === this.validUrls.length
    },
    urlIsAudio () { return utils.urlIsAudio(this.url) },
    normalizedName () {
      let name = this.name
      if (this.url) {
        name = name.replace(this.url, '')
      }
      name = name.replace(utils.checkboxFromString(name), '')
      return name.trim()
    },
    checkbox () { return Boolean(utils.checkboxFromString(this.name)) },
    checkboxIsChecked: {
      get () {
        return utils.nameIsChecked(this.name)
      },
      set (value) {
        this.$store.dispatch('currentSpace/toggleCardChecked', { cardId: this.card.id, value })
      }
    },
    cardPendingUpload () {
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => upload.cardId === this.card.id)
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    createdByUser () {
      const userId = this.card.userId
      let user = this.$store.getters['currentSpace/userById'](userId)
      if (user) {
        return user
      } else {
        return {
          name: '',
          color: '#cdcdcd' // secondary-active-background
        }
      }
    },
    updatedByUser () {
      const userId = this.card.nameUpdatedByUserId || this.card.userId
      let user = this.$store.getters['currentSpace/userById'](userId)
      if (user) {
        return user
      } else {
        return {
          name: '',
          color: '#cdcdcd' // secondary-active-background
        }
      }
    },
    spaceCounterZoomDecimal () { return this.$store.getters.spaceCounterZoomDecimal },
    pinchCounterZoomDecimal () { return this.$store.state.pinchCounterZoomDecimal },
    styles () {
      let zoom
      if (utils.isSignificantlyPinchZoomed()) {
        zoom = this.pinchCounterZoomDecimal
      } else {
        zoom = this.spaceCounterZoomDecimal
      }
      return { transform: `scale(${zoom})` }
    },
    cardUrlPreviewIsVisible () {
      const isErrorUrl = this.card.urlPreviewErrorUrl && this.card.urlPreviewUrl === this.card.urlPreviewErrorUrl
      const hasPreview = this.url && (this.isLoadingUrlPreview || this.card.urlPreviewUrl)
      return Boolean(this.card.urlPreviewIsVisible && hasPreview && !isErrorUrl)
    },
    isLoadingUrlPreview () {
      const cardIds = this.$store.state.urlPreviewLoadingForCardIds
      const isLoading = cardIds.find(cardId => cardId === this.card.id)
      return Boolean(isLoading)
    },
    cardHasMedia () { return Boolean(this.formats.image || this.formats.video || this.formats.audio) },
    openingFrameStyle () {
      const initialPadding = 200
      const initialBorderRadius = 60
      const padding = initialPadding * this.openingPercent
      const userColor = this.$store.state.currentUser.color
      const borderRadius = Math.max((this.openingPercent * initialBorderRadius), 5) + 'px'
      const size = `calc(100% + ${padding}px)`
      const position = -(padding / 2) + 'px'
      return {
        width: size,
        height: size,
        left: position,
        top: position,
        background: userColor,
        opacity: this.openingAlpha,
        borderRadius: borderRadius
      }
    },
    collaborationInfoIsVisible () { return this.$store.state.currentUser.shouldShowCardCollaborationInfo }
  },
  methods: {
    cancelOpening () {
      shouldCancelOpening = true
    },
    cancelOpeningAnimationFrame () {
      this.isOpening = false
      this.openingPercent = 0
      this.openingAlpha = 0
      shouldCancelOpening = false
    },
    startOpening () {
      if (this.$store.state.preventCardDetailsOpeningAnimation) {
        this.$store.commit('preventCardDetailsOpeningAnimation', false)
        return
      }
      shouldCancelOpening = false
      setTimeout(() => {
        if (!openingAnimationTimer) {
          this.isOpening = true
          openingAnimationTimer = window.requestAnimationFrame(this.openingAnimationFrame)
        }
      }, openingPreDuration)
    },
    openingAnimationFrame (timestamp) {
      if (!openingStartTime) {
        openingStartTime = timestamp
      }
      const elaspedTime = timestamp - openingStartTime
      const percentComplete = (elaspedTime / openingDuration) // between 0 and 1
      if (shouldCancelOpening) {
        this.cancelOpeningAnimationFrame()
      }
      if (this.isOpening && percentComplete <= 1) {
        const percentRemaining = Math.abs(percentComplete - 1)
        this.openingPercent = percentRemaining
        const alpha = utils.easeOut(percentComplete, elaspedTime, openingDuration)
        this.openingAlpha = alpha
        window.requestAnimationFrame(this.openingAnimationFrame)
      } else if (this.isOpening && percentComplete > 1) {
        console.log('🎴🐢 cardDetails openingAnimationFrame complete')
        openingAnimationTimer = undefined
        openingStartTime = undefined
        this.isOpening = false
      } else {
        window.cancelAnimationFrame(openingAnimationTimer)
        openingAnimationTimer = undefined
        openingStartTime = undefined
        this.cancelOpeningAnimationFrame()
      }
    },
    updateMediaUrls () {
      const urls = utils.urlsFromString(this.card.name, true)
      this.formats.image = ''
      this.formats.video = ''
      this.formats.audio = ''
      this.formats.link = ''
      if (!urls) { return }
      if (!urls.length) { return }
      urls.forEach(url => {
        if (utils.urlIsImage(url)) {
          this.formats.image = url
        } else if (utils.urlIsVideo(url)) {
          this.formats.video = url
        } else if (utils.urlIsAudio(url)) {
          this.formats.audio = url
        } else if (utils.urlIsFile(url)) {
          this.formats.file = url
        } else {
          this.formats.link = url
        }
      })
    },
    updateLink ({ url, newUrl }) {
      url = url.trim()
      const newName = this.name.replace(url, newUrl)
      this.updateCardName(newName)
    },
    removeUrlFromName (url) {
      const newName = this.name.replace(url, '')
      this.updateCardName(newName)
    },
    toggleUrlsIsVisible () {
      const isVisible = !this.urlsIsVisible
      let newUrls = []
      this.urls.forEach(url => {
        url = url.trim()
        const isUrl = utils.urlType(url) === 'link'
        if (!isUrl) { return }
        const queryString = utils.queryString(url)
        const domain = utils.urlWithoutQueryString(url)
        let queryObject
        if (queryString) {
          queryObject = qs.decode(queryString)
        } else {
          queryObject = {}
        }
        if (isVisible) {
          queryObject.hidden = true
          const newUrl = qs.encode(domain, queryObject)
          newUrls.push({
            url,
            newUrl
          })
        } else {
          delete queryObject.hidden
          delete queryObject.kinopio
          const newUrl = qs.encode(domain, queryObject)
          newUrls.push({
            url,
            newUrl
          })
        }
      })
      newUrls.forEach(urls => this.updateLink(urls))
    },
    updateNameSplitIntoCardsCount () {
      const isPreview = true
      const newCards = this.splitCards(null, isPreview)
      const count = newCards.length
      if (count > 1) {
        this.nameSplitIntoCardsCount = count
      } else {
        this.nameSplitIntoCardsCount = 0
      }
    },
    splitBySentences (string) {
      let sentences = string.split('. ')
      sentences = sentences.filter(sentence => Boolean(sentence.length))
      // re-add sentence periods removed by split
      sentences = sentences.map((sentence, index) => {
        if (index < sentences.length - 1) {
          sentence = sentence + '.'
        }
        return sentence
      })
      return sentences
    },
    splitByParagraphs (string) {
      let paragraphs = string.split('\n')
      paragraphs = paragraphs.filter(paragraph => Boolean(paragraph.length))
      paragraphs = paragraphs.map(paragraph => paragraph.trim())
      return paragraphs
    },
    splitCards (event, isPreview) {
      const originalName = (this.pastedName || this.name).trim()
      // split names by paragraph and sentence
      const paragraphs = this.splitByParagraphs(originalName)
      let cardNames = paragraphs.map(paragraph => {
        let sentences
        if (paragraph.length > this.maxCardLength) {
          sentences = this.splitBySentences(paragraph)
        }
        return sentences || paragraph
      })
      cardNames = cardNames.flat()
      // split names longer than max card length
      cardNames = cardNames.map(name => {
        // recursive
        let results = []
        let shouldSplit, nameToSplit
        do {
          shouldSplit = false
          nameToSplit = nameToSplit || name
          results.push(nameToSplit.substring(0, this.maxCardLength))
          const otherSplit = nameToSplit.substring(this.maxCardLength)
          if (otherSplit <= this.maxCardLength) {
            results.push(otherSplit)
          } else {
            nameToSplit = otherSplit
            shouldSplit = true
          }
        } while (shouldSplit)

        if (results.length) { return results }
        return name
      })
      cardNames = cardNames.flat()
      cardNames = cardNames.filter(name => Boolean(name.length))
      let newCards = cardNames.map(cardName => {
        return {
          id: nanoid(),
          name: cardName,
          x: this.card.x,
          y: this.card.y,
          frameId: this.card.frameId
        }
      })
      if (isPreview) { return newCards }
      this.pastedName = ''
      this.updateCardName(newCards[0].name)
      newCards.shift()
      this.addSplitCards(newCards)
    },
    addSplitCards (newCards) {
      const spaceBetweenCards = 12
      let prevCard = utils.clone(this.card)
      this.$store.dispatch('currentSpace/addMultipleCards', newCards)
      this.$nextTick(() => {
        newCards = newCards.map(card => {
          const element = document.querySelector(`article [data-card-id="${prevCard.id}"]`)
          const prevCardRect = element.getBoundingClientRect()
          card.y = prevCard.y + (prevCardRect.height * this.spaceCounterZoomDecimal) + spaceBetweenCards
          prevCard = card
          return card
        })
        newCards.forEach(card => {
          card = utils.updateCardDimentions(card)
          this.$store.dispatch('currentSpace/updateCard', {
            id: card.id,
            y: card.y
          })
        })
        this.$store.dispatch('currentUser/cardsCreatedCountUpdateBy', {
          delta: newCards.length,
          shouldIncrement: true
        }, { root: true })
        this.$store.dispatch('closeAllDialogs', 'CardDetails.addSplitCards')
      })
    },
    async uploadFile (file) {
      if (!this.currentUserIsSignedIn) {
        this.error.signUpToUpload = true
        return
      }
      try {
        await this.$store.dispatch('upload/uploadFile', { file, cardId: this.card.id })
      } catch (error) {
        console.warn('🚒', error)
        if (error.type === 'sizeLimit') {
          this.error.sizeLimit = true
        } else {
          this.error.unknownUploadError = true
        }
      }
    },
    updatePastedName (event) {
      const files = event.clipboardData.files
      if (files.length) {
        this.uploadFile(files[0])
      }
      const text = event.clipboardData.getData('text')
      this.pastedName = text
      this.wasPasted = true
    },
    removeTrackingQueryStrings () {
      this.validUrls.forEach(url => {
        url = url.trim()
        const queryString = utils.queryString(url)
        const domain = utils.urlWithoutQueryString(url)
        if (queryString) {
          let queryObject = qs.decode(queryString)
          let keys = Object.keys(queryObject)
          keys = keys.filter(key => {
            return key.startsWith('utm_') // google analytics
          })
          keys.forEach(key => delete queryObject[key])
          const newUrl = qs.encode(domain, queryObject)
          this.updateLink({
            url,
            newUrl
          })
        }
      })
    },
    triggerUpdatePositionInVisualViewport () {
      this.$store.commit('triggerUpdatePositionInVisualViewport')
    },
    addCheckbox () {
      const update = {
        id: this.card.id,
        name: `[] ${this.card.name}`
      }
      this.$store.dispatch('currentSpace/updateCard', update)
    },
    updateCardName (newName) {
      const userId = this.$store.state.currentUser.id
      const card = {
        name: newName,
        id: this.card.id,
        nameUpdatedAt: new Date(),
        nameUpdatedByUserId: userId
      }
      this.$store.dispatch('currentSpace/updateCard', card)
      this.$nextTick(() => {
        this.$store.dispatch('currentSpace/updateCardConnectionPaths', { cardId: this.card.id, shouldUpdateApi: true })
      })
      this.updateMediaUrls()
      this.updateTags()
      this.updateSpaceLink()
      if (this.notifiedMembers) { return }
      if (this.createdByUser.id !== this.$store.state.currentUser.id) { return }
      this.$store.dispatch('currentSpace/notifyCollaboratorsCardUpdated', { cardId: this.card.id, type: 'updateCard' })
      this.notifiedMembers = true
    },
    updateSpaceLink () {
      let link = this.validUrls.filter(url => utils.urlIsSpace(url))[0]
      const shouldRemoveLink = this.card.linkToSpaceId && !link
      if (shouldRemoveLink) {
        const update = {
          id: this.card.id,
          linkToSpaceId: null
        }
        this.$store.dispatch('currentSpace/updateCard', update)
        return
      }
      if (!link) { return }
      const linkToSpaceId = utils.spaceIdFromUrl(link) || null
      const linkExists = linkToSpaceId === this.card.linkToSpaceId
      if (linkExists) { return }
      const update = {
        id: this.card.id,
        linkToSpaceId
      }
      this.$store.dispatch('currentSpace/updateCard', update)
      this.debouncedSaveOtherSpace(linkToSpaceId)
    },
    debouncedSaveOtherSpace: debounce(async function (linkToSpaceId) {
      this.$store.dispatch('currentSpace/saveOtherSpace', { spaceId: linkToSpaceId })
    }, 250),
    checkIfIsInsertLineBreak (event) {
      const lineBreakInserted = event.ctrlKey || event.altKey
      if (!lineBreakInserted) {
        this.insertedLineBreak = false
      }
    },
    insertLineBreak (event) {
      const position = this.$refs.name.selectionEnd
      const name = this.card.name
      const newName = name.substring(0, position) + '\n' + name.substring(position)
      setTimeout(() => {
        this.$refs.name.setSelectionRange(position + 1, position + 1)
      })
      this.insertedLineBreak = true
      this.updateCardName(newName)
    },
    updateCompositionEventEndTime (event) {
      // for non-latin input
      // https://stackoverflow.com/questions/51226598/what-is-javascripts-compositionevent-please-give-examples
      compositionEventEndTime = event.timeStamp
    },
    closeCard (event) {
      if (this.$store.state.shouldPreventNextEnterKey) {
        event.stopPropagation()
        this.$store.commit('shouldPreventNextEnterKey', false)
        return
      }
      if (this.tag.pickerIsVisible || this.space.pickerIsVisible) {
        this.hidePickers()
        event.stopPropagation()
        return
      }
      if (this.insertedLineBreak) {
        this.insertedLineBreak = false
        event.stopPropagation()
        return
      }
      const isCompositionEvent = Math.abs(event.timeStamp - compositionEventEndTime) < 200
      if (isCompositionEvent) {
        event.stopPropagation()
        return
      }
      this.$store.dispatch('closeAllDialogs', 'CardDetails.closeCard')
    },
    closeCardAndFocus (event) {
      if (this.tag.pickerIsVisible || this.space.pickerIsVisible) {
        this.hidePickers()
        return
      }
      this.closeCard(event)
      document.querySelector(`.card[data-card-id="${this.card.id}"]`).focus()
    },
    removeCard () {
      if (!this.canEditCard) { return }
      this.$store.dispatch('currentSpace/removeCard', this.card)
      this.$store.commit('cardDetailsIsVisibleForCardId', '')
      this.triggerUpdatePositionInVisualViewport()
    },
    textareaSizes () {
      let textareas = document.querySelectorAll('dialog textarea')
      let modifier = 0
      if (this.canEditCard) {
        modifier = 1
      }
      textareas.forEach(textarea => {
        textarea.style.height = textarea.scrollHeight + modifier + 'px'
      })
    },
    cardIsEmpty () {
      return !this.card.name
    },
    toggleFramePickerIsVisible () {
      const isVisible = this.framePickerIsVisible
      this.closeDialogs()
      this.framePickerIsVisible = !isVisible
    },
    toggleCardTipsIsVisible () {
      const isVisible = this.cardTipsIsVisible
      this.closeDialogs()
      this.cardTipsIsVisible = !isVisible
    },
    toggleImagePickerIsVisible () {
      const isVisible = this.imagePickerIsVisible
      this.closeDialogs()
      this.imagePickerIsVisible = !isVisible
      this.initialSearch = this.normalizedName
    },
    toggleCollaborationInfoIsVisible () {
      this.closeDialogs()
      const isVisible = !this.$store.state.currentUser.shouldShowCardCollaborationInfo
      this.$store.dispatch('currentUser/shouldShowCardCollaborationInfo', isVisible)
    },
    focusName (position) {
      const element = this.$refs.name
      const length = this.name.length
      if (!element) { return }
      element.focus()
      if (position && element) {
        element.setSelectionRange(position, position)
      }
      if (length && element) {
        element.setSelectionRange(length, length)
      }
      this.triggerUpdatePositionInVisualViewport()
    },
    scrollIntoView () {
      if (!utils.isSignificantlyPinchZoomed() && utils.isMobile()) { return }
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    },
    scrollIntoViewAndFocus () {
      this.scrollIntoView()
      if (utils.isSignificantlyPinchZoomed()) { return }
      this.focusName()
      this.triggerUpdateMagicPaintPositionOffset()
      this.triggerUpdatePositionInVisualViewport()
    },
    triggerUpdateMagicPaintPositionOffset () {
      this.$store.commit('triggerUpdateMagicPaintPositionOffset')
      this.triggerUpdatePositionInVisualViewport()
    },
    closeDialogs () {
      this.shouldTriggerCloseChildComponents = nanoid()
      this.closeCardDialogs()
    },
    closeCardDialogs () {
      this.framePickerIsVisible = false
      this.imagePickerIsVisible = false
      this.cardTipsIsVisible = false
      this.hidePickers()
      this.hideTagDetailsIsVisible()
      this.hideLinkDetailsIsVisible()
    },
    clickName (event) {
      this.triggerUpdateMagicPaintPositionOffset()
      this.$store.commit('searchIsVisible', false)
      if (this.isCursorInsideTagBrackets()) {
        this.showTagPicker()
        event.stopPropagation()
      } else if (this.isCursorInsideSlashCommand()) {
        this.showSpacePicker()
        this.updateSpacePickerSearch()
        event.stopPropagation()
      }
    },
    hidePickers () {
      this.hideTagPicker()
      this.hideSpacePicker()
    },
    hideTagPicker () {
      this.tag.pickerSearch = ''
      this.tag.pickerIsVisible = false
      this.$store.dispatch('currentSpace/removeUnusedTagsFromCard', this.card.id)
    },
    hideSpacePicker () {
      this.space.pickerSearch = ''
      this.space.pickerIsVisible = false
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    triggerUpgradeUserIsVisible () {
      this.$store.commit('triggerUpgradeUserIsVisible')
    },
    addFile (file) {
      let name = this.card.name
      const url = file.url
      const urlType = utils.urlType(url)
      const checkbox = utils.checkboxFromString(name)
      const previousUrls = utils.urlsFromString(name, true) || []
      let isReplaced
      previousUrls.forEach(previousUrl => {
        if (utils.urlType(previousUrl) === urlType) {
          name = name.replace(previousUrl.trim(), url)
          isReplaced = true
        }
      })
      if (!isReplaced) {
        // prepend url to name
        name = utils.trim(name)
        name = `${url}\n\n${name}`
      }
      // ensure checkbox is first
      if (checkbox) {
        name = name.replace(checkbox, '')
        name = `${checkbox} ${name}`
      }
      this.updateCardName(utils.trim(name))
      this.triggerUpdatePositionInVisualViewport()
    },
    clearErrors () {
      this.error.signUpToUpload = false
      this.error.sizeLimit = false
      this.error.unknownUploadError = false
    },
    checkIfShouldShowPicker () {
      this.checkIfShouldShowTagPicker()
      this.checkIfShouldShowSpacePicker()
    },
    checkIfShouldHidePicker () {
      this.checkIfShouldHideTagPicker()
      this.checkIfShouldHideSpacePicker()
    },

    // Comment

    triggerCommentAddClosingBrackets (event) {
      const cursorPosition = this.$refs.name.selectionStart
      const previousCharacter = this.name[cursorPosition - 1]
      if (previousCharacter === '(') {
        const name = this.name
        const newName = `${name.substring(0, cursorPosition)}))${name.substring(cursorPosition)}`
        this.updateCardName(newName)
        this.$nextTick(() => {
          this.$refs.name.setSelectionRange(cursorPosition, cursorPosition)
        })
      }
    },

    // Pickers

    updatePicker (event) {
      const cursorPosition = this.$refs.name.selectionStart
      const previousCharacter = this.name[cursorPosition - 1]
      const previousCharacterIsBlank = utils.hasBlankCharacters(previousCharacter)
      const key = event.key
      const keyIsLettterOrNumber = key.length === 1
      const isCursorInsideTagBrackets = this.isCursorInsideTagBrackets()
      const isCursorInsideSlashCommand = this.isCursorInsideSlashCommand()
      if (utils.hasBlankCharacters(key)) {
        this.hideSpacePicker()
      } else if (key === '/' && previousCharacterIsBlank) {
        this.showSpacePicker()
      } else if (cursorPosition === 0) {
        return
      } else if (keyIsLettterOrNumber && isCursorInsideSlashCommand) {
        this.showSpacePicker()
      } else if (key === '[' && previousCharacter === '[') {
        this.showTagPicker()
        this.addClosingBrackets()
      } else if (keyIsLettterOrNumber && isCursorInsideTagBrackets) {
        this.showTagPicker()
      }
      this.checkIfIsInsertLineBreak(event)
    },
    triggerPickerNavigation (event) {
      const modifierKey = event.altKey || event.shiftKey || event.ctrlKey || event.metaKey
      const pickerIsVisible = this.tag.pickerIsVisible || this.space.pickerIsVisible
      const shouldTrigger = pickerIsVisible && !modifierKey
      if (shouldTrigger) {
        this.$store.commit('triggerPickerNavigationKey', event.key)
        event.preventDefault()
      }
    },
    triggerPickerSelectItem (event) {
      const modifierKey = event.altKey || event.shiftKey || event.ctrlKey || event.metaKey
      const pickerIsVisible = this.tag.pickerIsVisible || this.space.pickerIsVisible
      const shouldTrigger = pickerIsVisible && !modifierKey
      if (shouldTrigger) {
        this.$store.commit('triggerPickerSelect')
        event.preventDefault()
      }
      // prevent trailing ]
      if (event.key === ']' && this.tag.pickerIsVisible) {
        this.shouldCancelBracketRight = true
        setTimeout(() => {
          this.shouldCancelBracketRight = false
        }, 250)
      }
      if (event.key === ']' && this.shouldCancelBracketRight) {
        event.preventDefault()
      }
      // prevents Enter from creating new card
      if (event.key !== 'Enter') {
        this.hidePickers()
      }
    },
    updatePickerSearch () {
      if (this.tag.pickerIsVisible) {
        this.updateTagPickerSearch()
      } else if (this.space.pickerIsVisible) {
        this.updateSpacePickerSearch()
      }
    },

    // /Space-Links, slash command text

    showSpacePicker () {
      this.closeDialogs()
      const nameRect = this.$refs.name.getBoundingClientRect()
      this.space.pickerPosition = {
        top: nameRect.height - 2
      }
      this.space.pickerIsVisible = true
    },
    slashText () {
      const cursorPosition = this.$refs.name.selectionStart
      const start = this.slashTextToCursor() // /txt|
      let end = this.name.substring(cursorPosition, this.name.length) // |abc xyz
      end = utils.splitByBlankCharacters(end)[0]
      return start + end
    },
    slashTextToCursor () {
      const cursorPosition = this.$refs.name.selectionStart
      const textPosition = this.slashTextPosition()
      const text = this.name.substring(textPosition, cursorPosition)
      return text
    },
    slashTextPosition () {
      const cursorPosition = this.$refs.name.selectionStart
      let text = this.name.substring(0, cursorPosition)
      const textPosition = text.lastIndexOf('/')
      if (textPosition === -1) { return }
      return textPosition
    },
    updateSpacePickerSearch () {
      if (!this.space.pickerIsVisible) { return }
      const text = this.slashText()
      this.space.pickerSearch = text.substring(1, text.length)
    },
    checkIfShouldHideSpacePicker () {
      if (!this.space.pickerIsVisible) { return }
      if (!this.isCursorInsideSlashCommand()) {
        this.hideSpacePicker()
      }
    },
    checkIfShouldShowSpacePicker () {
      if (this.isCursorInsideSlashCommand()) {
        this.showSpacePicker()
      } else {
        this.hideSpacePicker()
      }
    },
    isCursorInsideSlashCommand () {
      const text = this.slashTextToCursor()
      if (utils.hasBlankCharacters(text)) { return }
      const characterBeforeSlash = this.name.charAt(this.slashTextPosition() - 1)
      if (text && !characterBeforeSlash) { return true }
      const characterBeforeSlashIsBlank = utils.hasBlankCharacters(characterBeforeSlash)
      const textIsValid = !utils.hasBlankCharacters(text)
      return textIsValid && characterBeforeSlashIsBlank
    },
    showLinkDetailsIsVisible (event) {
      this.closeDialogs()
      const linkRect = event.target.getBoundingClientRect()
      this.$store.commit('linkDetailsPosition', {
        x: window.scrollX + linkRect.x + 2,
        y: window.scrollY + linkRect.y + linkRect.height - 2
      })
      const link = {
        cardId: this.card.id,
        space: this.linkToSpace
      }
      this.$store.commit('currentSelectedLink', link)
      this.$store.commit('linkDetailsIsVisible', true)
    },
    replaceSlashCommandWithSpaceUrl (space) {
      let name = this.card.name
      let position = this.slashTextPosition()
      const spaceUrl = utils.kinopioDomain() + '/' + space.url + ' '
      const start = name.substring(0, position)
      const end = name.substring(position + this.slashText().length, name.length)
      const newName = start + spaceUrl + end
      this.updateCardName(newName)
      position = position + spaceUrl.length + 1
      this.$nextTick(() => {
        this.focusName(position)
      })
    },

    // [[Tags]]

    showTagPicker () {
      this.closeDialogs()
      const nameRect = this.$refs.name.getBoundingClientRect()
      this.tag.pickerPosition = {
        top: nameRect.height - 2
      }
      this.tag.pickerIsVisible = true
      this.updateTagPickerSearch()
    },
    tagStartText () {
      // ...[[abc
      const cursorPosition = this.$refs.name.selectionStart
      const start = this.name.substring(0, cursorPosition)
      let startPosition = start.lastIndexOf('[[')
      if (startPosition === -1) { return }
      startPosition = startPosition + 2
      return start.substring(startPosition)
    },
    tagEndText () {
      // xyz]]...
      const cursorPosition = this.$refs.name.selectionStart
      const end = this.name.substring(cursorPosition)
      const endPosition = end.indexOf(']]')
      if (endPosition === -1) { return }
      return end.substring(0, endPosition)
    },
    updateTagPickerSearch () {
      if (!this.tag.pickerIsVisible) { return }
      const start = this.tagStartText() || ''
      const end = this.tagEndText() || ''
      this.tag.pickerSearch = start + end
    },
    isCursorInsideTagBrackets () {
      this.cursorPosition = this.$refs.name.selectionStart // for template
      const start = this.tagStartText()
      const end = this.tagEndText()
      if (start === undefined || end === undefined) { return }
      if (!start.includes(']]') && !end.includes('[[')) {
        return true
      }
    },
    checkIfShouldShowTagPicker () {
      const tagPickerIsVisible = this.tag.pickerIsVisible
      const isCursorInsideTagBrackets = this.isCursorInsideTagBrackets()
      if (isCursorInsideTagBrackets && !tagPickerIsVisible) {
        this.showTagPicker()
      } else if (!isCursorInsideTagBrackets && tagPickerIsVisible) {
        this.hideTagPicker()
      }
    },
    checkIfShouldHideTagPicker () {
      const tagPickerIsVisible = this.tag.pickerIsVisible
      const isCursorInsideTagBrackets = this.isCursorInsideTagBrackets()
      if (!isCursorInsideTagBrackets && tagPickerIsVisible) {
        this.hideTagPicker()
      }
    },
    addClosingBrackets () {
      const cursorPosition = this.$refs.name.selectionStart
      const name = this.name
      const newName = `${name.substring(0, cursorPosition)}]]${name.substring(cursorPosition)}`
      this.updateCardName(newName)
      this.$nextTick(() => {
        this.$refs.name.setSelectionRange(cursorPosition, cursorPosition)
      })
    },
    moveCursorPastTagEnd () {
      const cursorPosition = this.$refs.name.selectionStart
      let endText = this.name.substring(cursorPosition)
      let newCursorPosition = endText.indexOf(']]')
      newCursorPosition = cursorPosition + newCursorPosition + 2
      this.$nextTick(() => {
        this.$refs.name.setSelectionRange(newCursorPosition, newCursorPosition)
      })
    },
    updatePreviousTags () {
      const name = this.card.name
      if (!name) {
        previousTags = []
        return
      }
      previousTags = utils.tagsFromStringWithoutBrackets(name) || []
      previousTags = previousTags.map(tag => {
        tag = this.$store.getters['currentSpace/tagByName'](tag)
        return tag
      })
    },
    addNewTags (newTagNames) {
      const previousTagNames = previousTags.map(tag => tag.name)
      const addTagsNames = newTagNames.filter(newTagName => !previousTagNames.includes(newTagName))
      addTagsNames.forEach(tagName => {
        const tag = utils.newTag({
          name: tagName,
          defaultColor: this.$store.state.currentUser.color,
          cardId: this.card.id,
          spaceId: this.$store.state.currentSpace.id
        })
        this.$store.dispatch('currentSpace/addTag', tag)
      })
    },
    updateTags () {
      const name = this.card.name
      if (!name) { return }
      const newTagNames = utils.tagsFromStringWithoutBrackets(name) || []
      this.addNewTags(newTagNames)
      this.updatePreviousTags()
    },
    hideTagDetailsIsVisible () {
      this.$store.commit('currentSelectedTag', {})
      this.$store.commit('tagDetailsIsVisible', false)
    },
    hideLinkDetailsIsVisible () {
      this.$store.commit('currentSelectedLink', {})
      this.$store.commit('linkDetailsIsVisible', false)
    },
    showTagDetailsIsVisible (event, tag) {
      this.closeDialogs()
      const tagRect = event.target.getBoundingClientRect()
      this.$store.commit('tagDetailsPosition', {
        x: window.scrollX + tagRect.x + 2,
        y: window.scrollY + tagRect.y + tagRect.height - 2
      })
      this.$store.commit('currentSelectedTag', tag)
      this.$store.commit('tagDetailsIsVisible', true)
    },
    updateTagBracketsWithTag (tag) {
      this.updatePreviousTags()
      const cursorPosition = this.$refs.name.selectionStart
      const tagStartText = this.tagStartText()
      const tagEndText = this.tagEndText()
      const text = tagStartText + tagEndText
      let newName
      if (text.length) {
        newName = this.name.replace(`[[${text}]]`, `[[${tag.name}]]`)
      } else {
        const startText = this.name.substring(0, cursorPosition)
        const endText = this.name.substring(cursorPosition)
        newName = startText + tag.name + endText
      }
      this.updateCardName(newName)
      this.moveCursorPastTagEnd()
    },
    previewImage (image, width) {
      const minWidth = 200
      if (width < minWidth) { return '' }
      const isTwitterIcon = image.includes('abs.twimg.com/responsive-web/client-web/icon-ios')
      if (isTwitterIcon) { return '' }
      return image
    },
    updateUrlPreviewErrorUrl (url) {
      this.$store.commit('removeUrlPreviewLoadingForCardIds', this.card.id)
      const update = {
        id: this.card.id,
        urlPreviewErrorUrl: url,
        urlPreviewUrl: url
      }
      this.$store.dispatch('currentSpace/updateCard', update)
    },
    debouncedUpdateUrlPreview: debounce(async function (url) {
      try {
        const linkPreviewApiKey = 'a9f249ef6b59cc8ccdd19de6b167bafa'
        const response = await fetch(`https://api.linkpreview.net/?key=${linkPreviewApiKey}&q=${encodeURIComponent(url)}&fields=icon,image_x`)
        const data = await response.json()
        if (response.status !== 200) {
          throw new Error(response.status)
        }
        let cardUrl = this.validWebUrls[0]
        cardUrl = this.removeHiddenQueryString(cardUrl)
        this.$store.commit('removeUrlPreviewLoadingForCardIds', this.card.id)
        if (data.error || url !== cardUrl) {
          throw new Error(response.message)
        }
        console.log('🚗 link preview', data)
        if (!data.title) { return }
        const image = this.previewImage(data.image, data.image_x)
        const update = {
          id: this.card.id,
          urlPreviewUrl: url,
          urlPreviewImage: image,
          urlPreviewTitle: utils.truncated(data.title),
          urlPreviewDescription: utils.truncated(data.description),
          urlPreviewFavicon: data.icon
        }
        const maxImageLength = 350
        if (data.image.length >= maxImageLength) { return }
        this.$store.dispatch('currentSpace/updateCard', update)
      } catch (error) {
        console.warn('🚑', error, url)
        this.updateUrlPreviewErrorUrl(url)
      }
    }, 350),
    clearUrlPreview () {
      const update = {
        id: this.card.id,
        urlPreviewUrl: '',
        urlPreviewImage: '',
        urlPreviewTitle: '',
        urlPreviewDescription: ''
      }
      this.$store.commit('removeUrlPreviewLoadingForCardIds', this.card.id)
      this.$store.dispatch('currentSpace/updateCard', update)
    },
    toggleUrlPreviewIsVisible () {
      const value = !this.card.urlPreviewIsVisible
      const update = {
        id: this.card.id,
        urlPreviewIsVisible: value
      }
      this.$store.dispatch('currentSpace/updateCard', update)
    },
    removeHiddenQueryString (url) {
      if (!url) { return }
      url = url.replace('?hidden=true', '')
      url = url.replace('&hidden=true', '')
      return url
    },
    resetPinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', 1)
    },
    updatePinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', utils.pinchCounterZoomDecimal())
    }
  },
  watch: {
    visible (visible) {
      this.updatePinchCounterZoomDecimal()
      this.$nextTick(() => {
        if (visible) {
          this.clearErrors()
          this.scrollIntoViewAndFocus()
          this.updatePreviousTags()
          this.updateNameSplitIntoCardsCount()
          this.$nextTick(() => {
            this.startOpening()
          })
        } else {
          this.removeTrackingQueryStrings()
          this.cancelOpening()
        }
      })
      if (visible) {
        this.updateMediaUrls()
        const connections = this.$store.getters['currentSpace/cardConnections'](this.card.id)
        this.$store.commit('updateCurrentCardConnections', connections)
      }
      if (!visible) {
        this.$store.dispatch('currentSpace/removeUnusedTagsFromCard', this.card.id)
        this.$store.commit('updateCurrentCardConnections')
        this.$store.commit('triggerUpdatePositionInVisualViewport')
      }
      if (!visible && this.cardIsEmpty()) {
        this.$store.dispatch('currentSpace/removeCard', this.card)
      }
      this.$store.dispatch('updatePageSizes')
    },
    validWebUrls (urls) {
      let url = urls[0]
      if (!url) { return }
      url = this.removeHiddenQueryString(url)
      const previewIsVisible = this.card.urlPreviewIsVisible
      const isNotPreviewUrl = url !== this.card.urlPreviewUrl
      const isNotErrorUrl = url !== this.card.urlPreviewErrorUrl
      const isNotKinopioUrl = !url.startsWith('https://kinopio.club')
      if (previewIsVisible && isNotPreviewUrl && isNotErrorUrl && isNotKinopioUrl) {
        this.$store.commit('addUrlPreviewLoadingForCardIds', this.card.id)
        this.debouncedUpdateUrlPreview(url)
      }
    }
  }
}
</script>

<style lang="stylus">
.card-details
  transform-origin top left
  > section
    background-color var(--secondary-background)
  .textarea-wrap
    position relative
    display flex
    align-items flex-start
  .edit-message
    button
      margin-top 10px
  .cards-checkboxes
    label
      display flex
      align-items center
    input
      margin 0
      vertical-align -1px
  .badges-row
    display flex
    flex-wrap wrap
  .inline-button-wrap
    cursor pointer
    margin-right -8px
    margin-top -8px
    .inline-button
      cursor pointer
      padding 2px 6px
      padding-top 1px
  .media-preview + .url-preview
    margin-top 10px
  .opening-frame
    position absolute
    z-index -1
    pointer-events none
  .toggle-collaboration-info
    .down-arrow
      padding 0
</style>
