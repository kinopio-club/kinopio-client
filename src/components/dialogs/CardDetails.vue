<template lang="pug">
dialog.card-details(v-if="visible" :open="visible" ref="dialog" @click.left="closeDialogs" @keyup.stop.backspace="removeCard")
  section
    .textarea-wrap
      textarea.name(
        :disabled="!canEditCard"
        ref="name"
        rows="1"
        placeholder="Type text here, or paste a URL"
        v-model="name"
        @keydown.prevent.enter.exact

        @keyup.enter.exact="closeCard"
        @keyup.stop.esc
        @keydown.esc="closeCardAndFocus"

        @keyup.stop.backspace="checkIfShouldShowPicker"
        @keyup.stop.up="checkIfShouldHidePicker"
        @keyup.stop.down="checkIfShouldHidePicker"
        @keyup.stop.left="checkIfShouldHidePicker"
        @keyup.stop.right="checkIfShouldHidePicker"

        data-type="name"
        maxlength="300"
        @click.left="clickName"
        @blur="triggerUpdatePositionInVisualViewport"
        @paste="updatePastedName"

        @keyup.alt.enter.exact.stop
        @keyup.ctrl.enter.exact.stop
        @keydown.alt.enter.exact.stop="insertLineBreak"
        @keydown.ctrl.enter.exact.stop="insertLineBreak"

        @keyup="updateTagPickerSearch(null)"

        @keydown="updateTagPicker"
        @keydown.down="triggerTagPickerNavigation"
        @keydown.up="triggerTagPickerNavigation"
        @keydown.enter="triggerTagPickerSelectTag"
        @keydown.tab="triggerTagPickerSelectTag"
        @keydown.221="triggerTagPickerSelectTag"
        @keydown.bracket-right="triggerTagPickerSelectTag"
      )
      TagPicker(:visible="tagPickerIsVisible" :cursorPosition="cursorPosition" :position="tagPickerPosition" :search="tagPickerSearch" @closeDialog="hidePickers" @selectTag="updateTagBracketsWithTag")
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
          span Image
        ImagePicker(:visible="imagePickerIsVisible" :initialSearch="initialSearch" :cardUrl="url" :cardId="card.id" @selectImage="addFile")
      //- Frames
      .button-wrap
        button(:disabled="!canEditCard" @click.left.stop="toggleFramePickerIsVisible" :class="{active : framePickerIsVisible}")
          span Frames
        FramePicker(:visible="framePickerIsVisible" :cards="[card]")

    .row(v-if="nameHasLineBreaks || hasUrls || nameHasSentences")
      //- Show Url
      .button-wrap(v-if="hasUrls")
        button(:disabled="!canEditCard" @click.left.stop="toggleUrlsIsVisible" :class="{active: urlsIsVisible}")
          img.icon(v-if="urlsIsVisible" src="@/assets/view-hidden.svg")
          img.icon(v-else src="@/assets/view.svg")
          span Link
      //- Split by Line Breaks
      .button-wrap(v-if="nameHasLineBreaks")
        button(:disabled="!canEditCard" @click.left.stop="splitCards")
          img.icon(src="@/assets/split-vertically.svg")
          span Split into {{nameLines}} Cards
      //- or, Split by Sentences
      .button-wrap(v-if="nameHasSentences")
        button(:disabled="!canEditCard" @click.left.stop="splitCards")
          img.icon(src="@/assets/split-vertically.svg")
          span Split into {{nameSentences}} Cards

    p.edit-message(v-if="!canEditCard")
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
      p To fit small screens, cards can't be longer than 300 characters
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

    .badges-row(v-if="tagsInCard.length || card.linkToSpaceId")
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
</template>

<script>
import FramePicker from '@/components/dialogs/FramePicker.vue'
import ImagePicker from '@/components/dialogs/ImagePicker.vue'
import TagPicker from '@/components/dialogs/TagPicker.vue'
import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'

import qs from '@aguezz/qs-parse'
import nanoid from 'nanoid'
import debounce from 'lodash-es/debounce'

let previousTags = []

export default {
  name: 'CardDetails',
  components: {
    FramePicker,
    ImagePicker,
    TagPicker,
    Loader,
    User
  },
  props: {
    card: Object // name, x, y, z
  },
  data () {
    return {
      framePickerIsVisible: false,
      imagePickerIsVisible: false,
      tagPickerIsVisible: false,
      tagPickerPosition: {},
      tagPickerSearch: '',
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
      }
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.framePickerIsVisible = false
        this.imagePickerIsVisible = false
        this.hidePickers()
      }
      if (mutation.type === 'triggerUploadComplete') {
        let { cardId, url } = mutation.payload
        if (cardId !== this.card.id) { return }
        this.addFile({ url })
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
    }
  },
  computed: {
    visible () { return this.$store.state.cardDetailsIsVisibleForCardId === this.card.id },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    cardIsCreatedByCurrentUser () { return this.$store.getters['currentUser/cardIsCreatedByCurrentUser'](this.card) },
    spacePrivacyIsOpen () { return this.$store.state.currentSpace.privacy === 'open' },
    spacePrivacyIsClosed () { return this.$store.state.currentSpace.privacy === 'closed' },
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
    errorMaxCardLength () {
      const maxCardLength = 300
      if (this.card.name.length >= maxCardLength) {
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
      }
    },
    url () { return utils.urlFromString(this.name) },
    urls () { return utils.urlsFromString(this.name, true) },
    validUrls () {
      if (!this.urls) { return [] }
      return this.urls.filter(url => {
        return utils.urlType(url) === 'link'
      })
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
    nameLines () {
      const name = this.pastedName || this.name
      return this.seperatedLines(name).length
    },
    nameSentences () {
      const name = this.pastedName || this.name
      return this.seperatedSentences(name).length
    },
    nameHasLineBreaks () {
      if (this.nameLines > 1) {
        return true
      } else {
        return false
      }
    },
    nameHasSentences () {
      if (this.nameHasLineBreaks) { return }
      if (this.nameSentences > 1) {
        return true
      } else {
        return false
      }
    },
    cardPendingUpload () {
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => upload.cardId === this.card.id)
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    seperatedLines (name) {
      let lines = name.split('\n')
      lines = lines.filter(line => Boolean(line.length))
      return lines
    },
    seperatedSentences (name) {
      let sentences = name.split('. ')
      sentences = sentences.filter(sentence => Boolean(sentence.length))
      return sentences
    },
    updateLink ({ url, newUrl }) {
      const newName = this.name.replace(url.trim(), newUrl)
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
    splitCards () {
      const spaceBetweenCards = 12
      const maxCardLength = 300
      let seperated
      if (this.nameHasLineBreaks) {
        seperated = this.seperatedLines
      } else if (this.nameHasSentences) {
        seperated = this.seperatedSentences
      }
      const cardNames = seperated(this.pastedName || this.name)
      let newCards = cardNames.map(name => {
        return {
          id: nanoid(),
          name: name.substring(0, maxCardLength),
          x: this.card.x,
          y: this.card.y,
          frameId: this.card.frameId
        }
      })
      newCards.shift()
      this.updateCardName(cardNames[0])
      let prevCard = utils.clone(this.card)
      this.$store.dispatch('currentSpace/addMultipleCards', newCards)
      this.$nextTick(() => {
        newCards = newCards.map(card => {
          const element = document.querySelector(`article [data-card-id="${prevCard.id}"]`)
          const prevCardRect = element.getBoundingClientRect()
          card.y = prevCard.y + prevCardRect.height + spaceBetweenCards
          prevCard = card
          return card
        })
        newCards.forEach(card => {
          this.$store.dispatch('currentSpace/updateCard', {
            id: card.id,
            y: card.y
          })
        })
        this.$store.dispatch('closeAllDialogs', 'CardDetails.splitCards')
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
      this.updateTags()
      this.updateSpaceLink()
    },
    updateSpaceLink () {
      let link = this.validUrls.filter(url => utils.urlIsKinopioSpace(url))[0]
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
    closeCard (event) {
      if (this.tagPickerIsVisible) {
        this.hidePickers()
        event.stopPropagation()
        return
      }
      if (this.insertedLineBreak) {
        this.insertedLineBreak = false
        event.stopPropagation()
        return
      }
      this.$store.dispatch('closeAllDialogs', 'CardDetails.closeCard')
    },
    closeCardAndFocus () {
      if (this.tagPickerIsVisible) {
        this.hidePickers()
        return
      }
      this.closeCard()
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
      textareas.forEach(textarea => {
        textarea.style.height = textarea.scrollHeight + 1 + 'px'
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
    toggleImagePickerIsVisible () {
      const isVisible = this.imagePickerIsVisible
      this.closeDialogs()
      this.imagePickerIsVisible = !isVisible
      this.initialSearch = this.normalizedName
    },
    focusName () {
      const element = this.$refs.name
      const length = this.name.length
      if (!element) { return }
      element.focus()
      if (length && element) {
        element.setSelectionRange(length, length)
      }
      this.triggerUpdatePositionInVisualViewport()
    },
    scrollIntoView () {
      if (utils.isMobile()) { return }
      const element = this.$refs.dialog
      const isTouchDevice = this.$store.state.isTouchDevice
      scrollIntoView.scroll(element, isTouchDevice)
    },
    scrollIntoViewAndFocus () {
      const pinchZoomScale = utils.visualViewport().scale
      const pinchZoomScaleShouldFocus = utils.isBetween({
        value: pinchZoomScale,
        min: 0.8,
        max: 1.3
      })
      if (!pinchZoomScaleShouldFocus) { return }
      this.scrollIntoView()
      this.focusName()
      this.triggerUpdateMagicPaintPositionOffset()
      this.triggerUpdatePositionInVisualViewport()
    },
    clickName (event) {
      this.triggerUpdateMagicPaintPositionOffset()
      if (this.isCursorInsideTagBrackets()) {
        this.showTagPicker()
        event.stopPropagation()
      }
    },
    triggerUpdateMagicPaintPositionOffset () {
      this.$store.commit('triggerUpdateMagicPaintPositionOffset')
      this.triggerUpdatePositionInVisualViewport()
    },
    closeDialogs () {
      this.framePickerIsVisible = false
      this.imagePickerIsVisible = false
      this.hidePickers()
      this.hideTagDetailsIsVisible()
      this.hideLinkDetailsIsVisible()
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
      const previousUrls = utils.urlsFromString(name, true)
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
    },
    checkIfShouldHidePicker () {
      this.checkIfShouldHideTagPicker()
    },

    // Tags

    showTagPicker () {
      this.closeDialogs()
      const nameRect = this.$refs.name.getBoundingClientRect()
      this.tagPickerPosition = {
        top: nameRect.height - 2
      }
      this.updateTagPickerSearch()
      this.tagPickerIsVisible = true
    },
    hidePickers () {
      this.tagPickerSearch = ''
      this.tagPickerIsVisible = false
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
      if (!this.tagPickerIsVisible) { return }
      const start = this.tagStartText() || ''
      const end = this.tagEndText() || ''
      this.tagPickerSearch = start + end
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
      const tagPickerIsVisible = this.tagPickerIsVisible
      const isCursorInsideTagBrackets = this.isCursorInsideTagBrackets()
      if (isCursorInsideTagBrackets && !tagPickerIsVisible) {
        this.showTagPicker()
      } else if (!isCursorInsideTagBrackets && tagPickerIsVisible) {
        this.hidePickers()
      }
    },
    checkIfShouldHideTagPicker () {
      const tagPickerIsVisible = this.tagPickerIsVisible
      const isCursorInsideTagBrackets = this.isCursorInsideTagBrackets()
      if (!isCursorInsideTagBrackets && tagPickerIsVisible) {
        this.hidePickers()
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
    updateTagPicker (event) {
      const cursorPosition = this.$refs.name.selectionStart
      const previousCharacter = this.name[cursorPosition - 1]
      const key = event.key
      const keyIsLettterOrNumber = key.length === 1
      const isCursorInsideTagBrackets = this.isCursorInsideTagBrackets()
      if (cursorPosition === 0) { return }
      if (key === '[' && previousCharacter === '[') {
        this.showTagPicker()
        this.addClosingBrackets()
      } else if (keyIsLettterOrNumber && isCursorInsideTagBrackets) {
        this.showTagPicker()
      }
      this.checkIfIsInsertLineBreak(event)
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
    removeRemovedTags (newTagNames) {
      const removeTags = previousTags.filter(previousTag => !newTagNames.includes(previousTag.name))
      removeTags.forEach(tag => this.$store.dispatch('currentSpace/removeTag', tag))
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
      this.removeRemovedTags(newTagNames)
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
    triggerTagPickerNavigation (event) {
      const modifierKey = event.altKey || event.shiftKey || event.ctrlKey || event.metaKey
      const shouldTrigger = this.tagPickerIsVisible && !modifierKey
      if (shouldTrigger) {
        this.$store.commit('triggerPickerNavigationKey', event.key)
        event.preventDefault()
      }
    },
    triggerTagPickerSelectTag (event) {
      const modifierKey = event.altKey || event.shiftKey || event.ctrlKey || event.metaKey
      const shouldTrigger = this.tagPickerIsVisible && !modifierKey
      if (shouldTrigger) {
        this.$store.commit('triggerPickerSelect')
        event.preventDefault()
      }
      // prevent trailing ]
      if (event.key === ']' && this.tagPickerIsVisible) {
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
        this.tagPickerIsVisible = false
      }
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
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.clearErrors()
          this.scrollIntoViewAndFocus()
          this.updatePreviousTags()
        } else {
          this.removeTrackingQueryStrings()
        }
      })
      if (!visible && this.cardIsEmpty()) {
        this.$store.dispatch('currentSpace/removeCard', this.card)
      }
      this.$store.dispatch('updatePageSizes')
    }
  }
}
</script>

<style lang="stylus">
.card-details
  > section
    background-color var(--secondary-background)
  .textarea-wrap
    position relative
  textarea
    margin-bottom 5px
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
</style>
