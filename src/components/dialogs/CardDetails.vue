<template lang="pug">
dialog.card-details(v-if="visible" :open="visible" ref="dialog" @click.left="closeDialogs" @keyup.stop.backspace="removeCard" :style="styles" :data-card-id="card.id")
  .opening-frame(v-if="isOpening" :style="openingFrameStyle")
  section
    .textarea-wrap
      textarea.name(
        :disabled="!canEditCard"
        ref="name"
        rows="1"
        placeholder="Type here, or paste a URL"
        v-model="name"
        @keydown.prevent.enter.exact

        @compositionend="updateCompositionEventEndTime"
        @keydown.enter.exact="handleEnterKey"
        @keyup.stop.esc
        @keydown.esc="closeCardAndFocus"

        @keyup.stop.backspace="checkIfShouldShowPicker"
        @keydown.stop.up="checkIfShouldHidePicker"
        @keydown.stop.down="checkIfShouldHidePicker"
        @keydown.stop.left="checkIfShouldHidePicker"
        @keydown.stop.right="checkIfShouldHidePicker"

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
        @keydown.down.stop="triggerPickerNavigation"
        @keydown.up.stop="triggerPickerNavigation"

        @keydown.tab.exact="triggerPickerSelectItem"

        @focus="resetPinchCounterZoomDecimal"
      )

      TagPicker(
        :visible="tag.pickerIsVisible"
        :cursorPosition="cursorPosition"
        :position="tag.pickerPosition"
        :search="tag.pickerSearch"
        @closeDialog="hideTagPicker"
        @selectTag="updateTagBracketsWithTag"
        @currentTag="updateCurrentSearchTag"
        @newTagColor="updateNewTagColor"
      )
      SpacePicker(
        :visible="space.pickerIsVisible"
        :parentIsCardDetails="true"
        :cursorPosition="cursorPosition"
        :position="space.pickerPosition"
        :search="space.pickerSearch"
        :shouldExcludeCurrentSpace="true"
        :shouldShowNewSpace="true"
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
      template(v-if="canEditCard")
        //- Remove
        .button-wrap
          button.danger(@click.left="removeCard")
            img.icon.remove(src="@/assets/remove.svg")
            //- span Remove
        //- [·]
        .button-wrap.cards-checkboxes
          label(v-if="checkbox" :class="{active: checkboxIsChecked, disabled: !canEditCard}" tabindex="0")
            input(type="checkbox" v-model="checkboxIsChecked" tabindex="-1")
          label(v-else @click.left.prevent="addCheckbox" @keydown.stop.enter="addCheckbox" :class="{disabled: !canEditCard}" tabindex="0")
            input.add(type="checkbox" tabindex="-1")
        //- Image
        .button-wrap
          button(@click.left.stop="toggleImagePickerIsVisible" :class="{active : imagePickerIsVisible}")
            img.icon.flower(src="@/assets/flower.svg")
          ImagePicker(:visible="imagePickerIsVisible" :initialSearch="initialSearch" :cardUrl="url" :cardId="card.id" @selectImage="addImageOrFile")
        //- Toggle Style Actions
        .button-wrap
          button(@click.left.stop="toggleShouldShowItemActions" :class="{active : shouldShowItemActions}")
            img.icon.down-arrow.button-down-arrow(src="@/assets/down-arrow.svg")
      //- Share
      .button-wrap.share-button-wrap(v-if="isName" @click.left.stop="toggleShareCardIsVisible" )
        button(:class="{active: shareCardIsVisible}")
          span Share
        ShareCard(:visible="shareCardIsVisible" :card="card")

    CardBoxActions(:visible="shouldShowItemActions && canEditCard" :cards="[card]" @closeDialogs="closeDialogs" :class="{ 'last-row': !rowIsBelowItemActions }" :tagsInCard="tagsInCard")
    CardCollaborationInfo(:visible="shouldShowItemActions" :createdByUser="createdByUser" :updatedByUser="updatedByUser" :card="card" :parentElement="parentElement" @closeDialogs="closeDialogs")

    .row(v-if="nameMetaRowIsVisible")
      //- Split by Line Breaks
      .button-wrap(v-if="nameSplitIntoCardsCount && canEditCard")
        button(:disabled="!canEditCard" @click.left.stop="splitCards")
          img.icon(src="@/assets/split.svg")
          span Split Card ({{nameSplitIntoCardsCount}})

    .row.badges-row(v-if="badgesRowIsVisible")
      //- Search result
      span.badge.search(v-if="isInSearchResultsCards")
        img.icon.search(src="@/assets/search.svg")
      //- Tags
      template(v-for="tag in tagsInCard")
        Tag(:tag="tag" :isClickable="true" :isActive="currentSelectedTag.name === tag.name" @clickTag="showTagDetailsIsVisible")
      //- Comment
      .badge.info(v-if="nameIsComment" :style="{backgroundColor: updatedByUser.color}")
        span ((comment))

    MediaPreview(:visible="cardHasMedia" :card="card" :formats="formats")
    UrlPreview(
      :visible="Boolean(card.urlPreviewUrl) || isLoadingUrlPreview"
      :loading="isLoadingUrlPreview"
      :card="card"
      :urlsIsVisibleInName="urlsIsVisible"
      @toggleUrlsIsVisible="toggleUrlsIsVisible"
    )

    //- Read Only
    template(v-if="!canEditCard")
      CardCollaborationInfo(:visible="!shouldShowItemActions" :createdByUser="createdByUser" :updatedByUser="updatedByUser" :card="card" :parentElement="parentElement" @closeDialogs="closeDialogs")
      .row.edit-message
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
            span Read Only

    //- Info
    template(v-if="showCurrentCardLength")
      .row
        span.badge.secondary-on-dark-background
          span {{currentCardLength}} / {{maxCardLength}}

    //- Errors
    template(v-if="errorMaxCardLength")
      .row
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
import CardBoxActions from '@/components/subsections/CardBoxActions.vue'
import ImagePicker from '@/components/dialogs/ImagePicker.vue'
import CardTips from '@/components/dialogs/CardTips.vue'
import TagPicker from '@/components/dialogs/TagPicker.vue'
import Tag from '@/components/Tag.vue'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import Loader from '@/components/Loader.vue'
import UrlPreview from '@/components/UrlPreview.vue'
import MediaPreview from '@/components/MediaPreview.vue'
import CardCollaborationInfo from '@/components/CardCollaborationInfo.vue'
import ShareCard from '@/components/dialogs/ShareCard.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import qs from '@aguezz/qs-parse'
import { nanoid } from 'nanoid'
import { mapState, mapGetters } from 'vuex'

let prevCardId, prevCardName
let previousTags = []
let compositionEventEndTime = 0

const openingPreDuration = 250 // ms
const openingDuration = 250 // ms
let openingAnimationTimer, openingStartTime, shouldCancelOpening

export default {
  name: 'CardDetails',
  components: {
    CardBoxActions,
    ImagePicker,
    CardTips,
    TagPicker,
    Tag,
    SpacePicker,
    Loader,
    UrlPreview,
    MediaPreview,
    UserLabelInline,
    CardCollaborationInfo,
    ShareCard
  },
  data () {
    return {
      lastSelectionStartPosition: 0,
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
      previousSelectedTag: {},
      currentSearchTag: {},
      newTagColor: '',
      shareCardIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUnloadPage' && this.visible) {
        this.closeCard()
      } else if (mutation.type === 'triggerSplitCard' && this.visible) {
        const cardId = mutation.payload
        if (cardId !== this.card.id) { return }
        this.splitCards()
      } else if (mutation.type === 'cardDetailsIsVisibleForCardId') {
        const cardId = mutation.payload
        if (prevCardId) {
          this.updateDimensions(prevCardId)
        }
        if (!cardId) { return }
        prevCardId = cardId
        this.showCard(cardId)
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
  computed: {
    ...mapState([
      'cardDetailsIsVisibleForCardId',
      'currentUser',
      'currentSpace',
      'searchResultsCards',
      'currentSelectedTag',
      'currentSelectedOtherItem',
      'shouldPreventNextEnterKey',
      'upload',
      'pinchCounterZoomDecimal',
      'urlPreviewLoadingForCardIds',
      'preventCardDetailsOpeningAnimation',
      'shouldPreventNextFocusOnName'
    ]),
    ...mapGetters([
      'spaceCounterZoomDecimal',
      'currentCards/byId',
      'currentUser/isSignedIn',
      'currentSpace/userById',
      'currentSpace/tagByName',
      'currentConnections/byCardId',
      'currentUser/isSpaceMember',
      'currentSpace/isFavorite',
      'currentUser/cardIsCreatedByCurrentUser',
      'currentUser/canEditSpace',
      'currentUser/isInvitedButCannotEditSpace'
    ]),
    rowIsBelowItemActions () { return this.nameMetaRowIsVisible || this.badgesRowIsVisible || this.shouldShowItemActions || this.cardHasMedia || this.cardUrlPreviewIsVisible },
    nameMetaRowIsVisible () { return this.nameSplitIntoCardsCount },
    badgesRowIsVisible () { return this.tagsInCard.length || this.nameIsComment || this.isInSearchResultsCards },
    parentElement () { return this.$refs.dialog },
    card () {
      const cardId = this.cardDetailsIsVisibleForCardId
      return this['currentCards/byId'](cardId) || {}
    },
    visible () { return utils.objectHasKeys(this.card) },
    isSpaceMember () { return this['currentUser/isSpaceMember']() },
    cardIsCreatedByCurrentUser () { return this['currentUser/cardIsCreatedByCurrentUser'](this.card) },
    spacePrivacyIsOpen () { return this.currentSpace.privacy === 'open' },
    spacePrivacyIsClosed () { return this.currentSpace.privacy === 'closed' },
    isInSearchResultsCards () {
      const results = this.searchResultsCards
      if (!results.length) { return }
      return Boolean(results.find(card => this.card.id === card.id))
    },
    showCardTips () {
      if (this.name) { return }
      return true
    },
    nameIsComment () { return utils.isNameComment(this.name) },
    canEditSpace () { return this['currentUser/canEditSpace']() },
    canEditCard () {
      if (this.isSpaceMember) { return true }
      if (this.canEditSpace && this.cardIsCreatedByCurrentUser) { return true }
      return false
    },
    isInvitedButCannotEditSpace () { return this['currentUser/isInvitedButCannotEditSpace']() },
    maxCardLength () { return consts.maxCardLength },
    currentCardLength () {
      if (!this.card.name) { return 0 }
      return this.card.name.length
    },
    showCurrentCardLength () {
      const threshold = 50
      if (this.errorMaxCardLength) { return }
      return this.currentCardLength >= this.maxCardLength - threshold
    },
    errorMaxCardLength () {
      if (this.currentCardLength >= this.maxCardLength) {
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
        const tag = this['currentSpace/tagByName'](name)
        tags.push(tag)
      })
      return tags
    },
    currentUserIsSpaceMember () { return this['currentUser/isSpaceMember']() },
    isFavoriteSpace () { return this['currentSpace/isFavorite'] },
    name: {
      get () {
        return this.card.name || ''
      },
      set (newName) {
        if (this.shouldPreventNextEnterKey) {
          this.$store.commit('shouldPreventNextEnterKey', false)
          this.updateCardName(newName.trim())
        } else {
          this.updateCardName(newName)
        }
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
        const isLink = utils.urlType(url) === 'link'
        const isValidTld = utils.urlIsValidTld(url)
        return isLink && isValidTld
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
        this.removeUrlPreview()
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
        if (utils.nameIsChecked(this.name)) {
          this.$store.dispatch('currentCards/removeChecked', this.card.id)
        } else {
          this.$store.dispatch('currentCards/toggleChecked', { cardId: this.card.id, value })
        }
      }
    },
    cardPendingUpload () {
      const pendingUploads = this.upload.pendingUploads
      return pendingUploads.find(upload => upload.cardId === this.card.id)
    },
    currentUserIsSignedIn () { return this['currentUser/isSignedIn'] },
    createdByUser () {
      const userId = this.card.userId
      let user = this['currentSpace/userById'](userId)
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
      let user = this['currentSpace/userById'](userId)
      if (user) {
        return user
      } else {
        return {
          name: '',
          color: '#cdcdcd' // secondary-active-background
        }
      }
    },
    styles () {
      let zoom = this.spaceCounterZoomDecimal
      if (this.$store.state.isTouchDevice) {
        zoom = 1 / utils.visualViewport().scale
      }
      const left = `${this.card.x + 8}px`
      const top = `${this.card.y + 8}px`
      return { transform: `scale(${zoom})`, left, top }
    },
    cardUrlPreviewIsVisible () {
      const isErrorUrl = this.card.urlPreviewErrorUrl && this.card.urlPreviewUrl === this.card.urlPreviewErrorUrl
      const hasPreview = this.url && (this.isLoadingUrlPreview || this.card.urlPreviewUrl)
      return Boolean(this.card.urlPreviewIsVisible && hasPreview && !isErrorUrl)
    },
    isLoadingUrlPreview () {
      const isLoading = this.urlPreviewLoadingForCardIds.find(cardId => cardId === this.card.id)
      return Boolean(isLoading)
    },
    cardHasMedia () { return Boolean(this.formats.image || this.formats.video || this.formats.audio) },
    openingFrameStyle () {
      const initialPadding = 200
      const initialBorderRadius = 60
      const padding = initialPadding * this.openingPercent
      const userColor = this.currentUser.color
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
    isName () { return Boolean(this.name) },
    shouldShowItemActions () { return this.currentUser.shouldShowItemActions }
  },
  methods: {
    broadcastShowCardDetails () {
      const updates = {
        cardId: this.card.id,
        userId: this.currentUser.id
      }
      this.$store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCardDetailsVisible' })
    },
    addImageOrFile (file) {
      const cardId = this.card.id
      const spaceId = this.currentSpace.id
      // remove existing image url
      if (this.formats.image) {
        const newName = this.name.replace(this.formats.image, '')
        this.updateCardName(newName)
      }
      // add new image or file url
      this.$store.commit('triggerUploadComplete', {
        cardId,
        spaceId,
        url: file.url
      })
      this.$nextTick(() => {
        this.updateMediaUrls()
      })
    },
    selectionStartPosition () {
      let startPosition = this.lastSelectionStartPosition
      if (this.$refs.name) {
        const position = this.$refs.name.selectionStart
        this.lastSelectionStartPosition = position
        startPosition = position
      }
      return startPosition
    },
    setSelectionRange (start, end) {
      if (this.$refs.name) {
        this.$refs.name.setSelectionRange(start, end)
      }
    },
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
      if (this.preventCardDetailsOpeningAnimation || !this.card.name) {
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
    toggleUrlsIsVisible () {
      const isVisible = !this.urlsIsVisible
      let newUrls = []
      this.urls.forEach(url => {
        url = url.trim()
        url = utils.removeTrailingSlash(url)
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
    splitCards (event, isPreview) {
      const prevName = (this.pastedName || this.name).trim()
      const cardNames = utils.splitCardNameByParagraphAndSentence(prevName)
      // create new split cards
      let newCards = cardNames.map((cardName, index) => {
        const indentAmount = 50
        const indentLevel = utils.numberOfLeadingTabs(cardName) || utils.numberOfLeadingDoubleSpaces(cardName)
        const indentX = indentLevel * indentAmount
        let id = nanoid()
        if (index === 0) {
          id = this.card.id
        }
        return {
          id,
          name: cardName.trim(),
          x: this.card.x + indentX,
          y: this.card.y,
          frameId: this.card.frameId,
          backgroundColor: this.card.backgroundColor
        }
      })
      if (isPreview) { return newCards }
      this.pastedName = ''
      this.updateCardName(newCards[0].name)
      this.$store.dispatch('history/resume')
      this.$store.dispatch('history/add', { cards: newCards, useSnapshot: true })
      this.$store.dispatch('history/pause')
      newCards.shift()
      this.addSplitCards(newCards)
    },
    addSplitCards (newCards) {
      const spaceBetweenCards = 12
      let prevCard = utils.clone(this.card)
      this.$store.dispatch('currentCards/addMultiple', newCards)
      this.$nextTick(() => {
        newCards = newCards.map(card => {
          const element = document.querySelector(`article [data-card-id="${prevCard.id}"]`)
          const prevCardRect = element.getBoundingClientRect()
          card.y = prevCard.y + (prevCardRect.height * this.spaceCounterZoomDecimal) + spaceBetweenCards
          prevCard = card
          return card
        })
        newCards.forEach(card => {
          card = utils.updateCardDimensions(card)
          card = {
            name: card.name,
            id: card.id,
            y: card.y,
            width: card.width,
            height: card.height,
            urlPreviewIsVisible: true
          }
          this.$store.dispatch('currentCards/update', card)
          this.$store.commit('triggerUpdateUrlPreview', card.id)
        })
        this.$store.dispatch('closeAllDialogs')
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
      this.$store.dispatch('currentCards/updateURLQueryStrings', { cardId: this.card.id })
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.$store.commit('triggerCardIdUpdatePastedName', { cardId: this.card.id, name: text })
        })
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
      this.$store.dispatch('currentCards/update', update)
    },
    updateCardName (newName) {
      const cardId = this.cardDetailsIsVisibleForCardId
      if (this.card.id !== cardId) {
        return
      }
      const userId = this.currentUser.id
      const card = {
        name: newName,
        id: this.card.id,
        nameUpdatedAt: new Date(),
        nameUpdatedByUserId: userId
      }
      this.$store.dispatch('currentCards/update', card)
      this.$nextTick(() => {
        this.$store.dispatch('currentConnections/updatePaths', { cardId: this.card.id, shouldUpdateApi: true })
      })
      this.updateMediaUrls()
      this.updateTags()
      if (this.notifiedMembers) { return }
      if (this.createdByUser.id !== this.currentUser.id) { return }
      if (card.name) {
        this.$store.dispatch('userNotifications/addCardUpdated', { cardId: this.card.id, type: 'updateCard' })
        this.notifiedMembers = true
      }
    },
    updateDimensions (cardId) {
      this.$store.dispatch('currentCards/updateDimensions', { cardId })
    },
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
        this.setSelectionRange(position + 1, position + 1)
      })
      this.insertedLineBreak = true
      this.updateCardName(newName)
    },
    updateCompositionEventEndTime (event) {
      // for non-latin input
      // https://stackoverflow.com/questions/51226598/what-is-javascripts-compositionevent-please-give-examples
      compositionEventEndTime = event.timeStamp
    },
    handleEnterKey (event) {
      const isCompositionEvent = event.timeStamp && Math.abs(event.timeStamp - compositionEventEndTime) < 1000
      const pickersIsVisible = this.tag.pickerIsVisible || this.space.pickerIsVisible
      console.log('🎹 enter', {
        shouldPreventNextEnterKey: this.shouldPreventNextEnterKey,
        pickersIsVisible
      })
      if (this.shouldPreventNextEnterKey) {
        this.$store.commit('shouldPreventNextEnterKey', false)
      } else if (pickersIsVisible) {
        this.triggerPickerSelectItem(event)
        this.hidePickers()
      } else if (this.insertedLineBreak) {
        this.insertedLineBreak = false
      } else if (isCompositionEvent) {

      } else {
        this.closeCard()
        this.$store.dispatch('closeAllDialogs')
        this.$store.commit('shouldPreventNextEnterKey', false)
        this.$store.commit('triggerAddCard')
      }
    },
    closeCardAndFocus (event) {
      const pickersIsVisible = this.tag.pickerIsVisible || this.space.pickerIsVisible
      if (pickersIsVisible) {
        this.hidePickers()
        return
      }
      this.$store.dispatch('closeAllDialogs')
      document.querySelector(`.card[data-card-id="${prevCardId}"]`).focus()
    },
    removeCard () {
      if (!this.canEditCard) { return }
      this.$store.dispatch('history/resume')
      this.$store.dispatch('currentCards/remove', this.card)
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
    toggleShouldShowItemActions () {
      this.closeDialogs()
      const isVisible = !this.shouldShowItemActions
      this.$store.dispatch('currentUser/shouldShowItemActions', isVisible)
      this.$nextTick(() => {
        this.scrollIntoView()
      })
    },
    toggleShareCardIsVisible () {
      const isVisible = this.shareCardIsVisible
      this.closeDialogs()
      this.shareCardIsVisible = !isVisible
    },
    focusName (position) {
      utils.disablePinchZoom()
      if (this.shouldPreventNextFocusOnName) {
        this.triggerUpdatePositionInVisualViewport()
        this.$store.commit('shouldPreventNextFocusOnName', false)
        return
      }
      this.$nextTick(() => {
        const element = this.$refs.name
        const length = this.name.length
        if (!element) { return }
        element.focus()
        if (position) {
          element.setSelectionRange(position, position)
        }
        if (length) {
          element.setSelectionRange(length, length)
        }
        this.triggerUpdatePositionInVisualViewport()
      })
    },
    scrollIntoView (behavior) {
      // wait for element to be rendered before getting position
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.$nextTick(() => {
            const element = this.$refs.dialog
            utils.scrollIntoView(element, behavior)
          })
        })
      })
    },
    scrollIntoViewAndFocus () {
      let behavior
      if (utils.isIPhone()) {
        behavior = 'auto'
      }
      utils.disablePinchZoom()
      this.$nextTick(() => {
        if (!utils.isIPhone()) {
          this.scrollIntoView(behavior)
          this.focusName()
        }
        this.triggerUpdateMagicPaintPositionOffset()
        this.triggerUpdatePositionInVisualViewport()
      })
    },
    triggerUpdateMagicPaintPositionOffset () {
      this.$store.commit('triggerUpdateMagicPaintPositionOffset')
      this.triggerUpdatePositionInVisualViewport()
    },
    closeDialogs (shouldSkipGlobalDialogs) {
      this.$store.commit('triggerCardDetailsCloseDialogs')
      this.imagePickerIsVisible = false
      this.cardTipsIsVisible = false
      this.shareCardIsVisible = false
      this.hidePickers()
      if (shouldSkipGlobalDialogs === true) { return }
      this.hideTagDetailsIsVisible()
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

    triggerCommentAddClosingBrackets () {
      const cursorPosition = this.selectionStartPosition()
      const previousCharacter = this.name[cursorPosition - 1]
      if (previousCharacter === '(') {
        const name = this.name
        const newName = `${name.substring(0, cursorPosition)}))${name.substring(cursorPosition)}`
        this.updateCardName(newName)
        this.$nextTick(() => {
          this.setSelectionRange(cursorPosition, cursorPosition)
        })
      }
    },

    // Pickers

    updatePicker (event) {
      const cursorPosition = this.selectionStartPosition()
      const previousCharacter = this.name[cursorPosition - 1]
      const previousCharacterIsBlank = utils.hasBlankCharacters(previousCharacter)
      const key = event.key
      const keyIsArrowUpOrDown = key === 'ArrowDown' || key === 'ArrowUp'
      const keyIsLettterOrNumber = key.length === 1
      const isCursorInsideTagBrackets = this.isCursorInsideTagBrackets()
      const isCursorInsideSlashCommand = this.isCursorInsideSlashCommand()
      if (keyIsArrowUpOrDown) { return }
      if (key === '(') {
        this.triggerCommentAddClosingBrackets()
      }
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
      const cursorPosition = this.selectionStartPosition()
      const start = this.slashTextToCursor() // /txt|
      let end = this.name.substring(cursorPosition, this.name.length) // |abc xyz
      end = utils.splitByBlankCharacters(end)[0]
      return start + end
    },
    slashTextToCursor () {
      const cursorPosition = this.selectionStartPosition()
      const textPosition = this.slashTextPosition()
      const text = this.name.substring(textPosition, cursorPosition)
      return text
    },
    slashTextPosition () {
      const cursorPosition = this.selectionStartPosition()
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
    replaceSlashCommandWithSpaceUrl (space) {
      let name = this.card.name
      let position = this.slashTextPosition()
      const spaceUrl = utils.kinopioDomain() + '/' + space.url + ' '
      const start = name.substring(0, position)
      const end = name.substring(position + this.slashText().length, name.length)
      const newName = start + spaceUrl + end
      this.updateCardName(newName)
      position = position + spaceUrl.length + 1
      this.hideSpacePicker()
      this.$nextTick(() => {
        this.focusName(position)
        this.$store.commit('shouldPreventNextEnterKey', false)
      })
    },

    // [[Tags]]

    showTagPicker () {
      this.tag.pickerSearch = ''
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
      const cursorPosition = this.selectionStartPosition()
      const start = this.name.substring(0, cursorPosition)
      let startPosition = start.lastIndexOf('[[')
      if (startPosition === -1) { return }
      startPosition = startPosition + 2
      return start.substring(startPosition)
    },
    tagEndText () {
      // xyz]]...
      const cursorPosition = this.selectionStartPosition()
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
      this.cursorPosition = this.selectionStartPosition() // for template
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
      const cursorPosition = this.selectionStartPosition()
      const name = this.name
      const newName = `${name.substring(0, cursorPosition)}]]${name.substring(cursorPosition)}`
      this.updateCardName(newName)
      this.$nextTick(() => {
        this.setSelectionRange(cursorPosition, cursorPosition)
      })
    },
    moveCursorPastTagEnd () {
      const cursorPosition = this.selectionStartPosition()
      let endText = this.name.substring(cursorPosition)
      let newCursorPosition = endText.indexOf(']]')
      newCursorPosition = cursorPosition + newCursorPosition + 2
      this.$nextTick(() => {
        this.setSelectionRange(newCursorPosition, newCursorPosition)
      })
    },
    updatePreviousTags () {
      const name = this.card.name
      if (!name) {
        previousTags = []
        return
      }
      previousTags = utils.tagsFromStringWithoutBrackets(name) || []
      previousTags = previousTags.map(tagName => {
        let tag
        if (this.previousSelectedTag.name === tagName) {
          tag = this.previousSelectedTag
        } else if (this.currentSearchTag.name === tagName) {
          tag = this.currentSearchTag
        } else {
          tag = this['currentSpace/tagByName'](tagName)
          tag = utils.clone(tag)
          tag.color = this.previousSelectedTag.color || tag.color
        }
        return tag
      })
    },
    updateNewTagColor (color) {
      this.newTagColor = color
    },
    addNewTags (newTagNames) {
      const previousTagNames = previousTags.map(tag => tag.name)
      const addTagsNames = newTagNames.filter(newTagName => !previousTagNames.includes(newTagName))
      addTagsNames.forEach(tagName => {
        let tag
        tag = utils.newTag({
          name: tagName,
          defaultColor: this.newTagColor || this.currentUser.color,
          cardId: this.card.id,
          spaceId: this.currentSpace.id
        })
        if (this.previousSelectedTag.name === tagName) {
          tag.color = this.previousSelectedTag.color
        } else if (this.currentSearchTag.name === tagName) {
          tag.color = this.currentSearchTag.color
        }
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
    showTagDetailsIsVisible (event, tag) {
      this.closeDialogs()
      const element = event.target.closest('.tag')
      const tagRect = element.getBoundingClientRect()
      this.$store.commit('tagDetailsPosition', {
        x: window.scrollX + tagRect.x + 2,
        y: window.scrollY + tagRect.y + tagRect.height - 2,
        pageX: window.scrollX,
        pageY: window.scrollY
      })
      this.$store.commit('currentSelectedTag', tag)
      this.$store.commit('tagDetailsIsVisible', true)
    },
    updateCurrentSearchTag (tag) {
      this.currentSearchTag = tag
      this.updatePreviousTags()
    },
    updateTagBracketsWithTag (tag) {
      this.previousSelectedTag = tag
      this.updatePreviousTags()
      const cursorPosition = this.selectionStartPosition()
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
      this.$store.commit('shouldPreventNextEnterKey', false)
    },
    removeUrlPreview () {
      const cardId = this.card.id || prevCardId
      const update = {
        id: cardId,
        urlPreviewUrl: '',
        urlPreviewImage: '',
        urlPreviewTitle: '',
        urlPreviewDescription: ''
      }
      this.$store.commit('removeUrlPreviewLoadingForCardIds', cardId)
      this.$store.dispatch('currentCards/update', update)
      this.$store.dispatch('currentConnections/updatePaths', { cardId: this.card.id, shouldUpdateApi: true })
      this.$store.dispatch('currentCards/updateDimensions', { cards: [this.card] })
    },
    toggleUrlPreviewIsVisible () {
      const value = !this.card.urlPreviewIsVisible
      const update = {
        id: this.card.id,
        urlPreviewIsVisible: value
      }
      this.$store.dispatch('currentCards/update', update)
    },
    resetPinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', 1)
    },
    updatePinchCounterZoomDecimal () {
      this.$store.commit('pinchCounterZoomDecimal', utils.pinchCounterZoomDecimal())
    },
    resetTextareaHeight () {
      if (!this.visible) { return }
      this.$refs.name.style.height = 'initial'
    },
    showCard (cardId) {
      this.$nextTick(() => {
        this.broadcastShowCardDetails()
        this.clearErrors()
        this.updatePinchCounterZoomDecimal()
        this.scrollIntoViewAndFocus()
        this.updatePreviousTags()
        this.updateNameSplitIntoCardsCount()
        this.resetTextareaHeight()
        this.$nextTick(() => {
          this.startOpening()
          const card = this['currentCards/byId'](cardId)
          this.$store.dispatch('checkIfItemShouldIncreasePageSize', card)
        })
      })
      this.previousSelectedTag = {}
      this.updateMediaUrls()
      const connections = this['currentConnections/byCardId'](cardId)
      this.$store.commit('updateCurrentCardConnections', connections)
      prevCardName = this.card.name
      this.$store.dispatch('history/pause')
    },
    closeCard () {
      const element = this.$refs.name
      element.blur()
      this.$store.commit('triggerHideTouchInterface')
      const cardId = prevCardId
      const card = this['currentCards/byId'](cardId)
      this.closeDialogs(true)
      this.cancelOpening()
      this.$store.dispatch('currentSpace/removeUnusedTagsFromCard', cardId)
      this.$store.commit('updateCurrentCardConnections')
      this.$store.commit('triggerUpdatePositionInVisualViewport')
      this.$store.commit('shouldPreventNextEnterKey', false)
      if (!card) { return }
      const cardHasName = Boolean(card.name)
      if (!cardHasName) {
        this.$store.dispatch('currentCards/remove', { id: cardId })
      }
      this.$store.dispatch('updatePageSizes')
      this.$nextTick(() => {
        this.updateDimensions(cardId)
        this.$store.dispatch('checkIfItemShouldIncreasePageSize', card)
      })
      this.$store.dispatch('history/resume')
      if (card.name || prevCardName) {
        this.$store.dispatch('history/add', { cards: [card], useSnapshot: true })
      }
    }
  },
  watch: {
    visible (visible) {
      if (!visible) {
        this.closeCard()
        utils.enablePinchZoom()
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
      padding-top 0
  .media-preview + .url-preview
    margin-top 10px
  .opening-frame
    position absolute
    z-index -1
    pointer-events none

  dialog.image-picker
    left -100px

</style>
