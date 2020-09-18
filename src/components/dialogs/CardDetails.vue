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

        @keyup.stop.backspace="checkIfShouldShowTagPicker"
        @keyup.stop.up="checkIfShouldHideTagPicker"
        @keyup.stop.down="checkIfShouldHideTagPicker"
        @keyup.stop.left="checkIfShouldHideTagPicker"
        @keyup.stop.right="checkIfShouldHideTagPicker"

        data-type="name"
        maxlength="250"
        @click.left="clickName"
        @blur="triggerUpdatePositionInVisualViewport"
        @paste="updatePastedName"

        @keyup.alt.enter.exact.stop
        @keyup.ctrl.enter.exact.stop
        @keydown.alt.enter.exact.stop="insertLineBreak"
        @keydown.ctrl.enter.exact.stop="insertLineBreak"

        @keyup="updateTagPicker"
        @keydown.down="triggerTagPickerNavigation"
        @keydown.up="triggerTagPickerNavigation"
        @keydown.enter="triggerTagPickerSelect"
      )
      TagPicker(:visible="tagPickerIsVisible" :cursorPosition="cursorPosition" :position="tagPickerPosition" :search="tagPickerSearch" @closeDialog="hideTagPicker")
        //- @selectTag="insertTag"
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

    .row(v-if="nameHasLineBreaks || hasLinks")
      //- Show Link
      .button-wrap(v-if="hasLinks")
        button(:disabled="!canEditCard" @click.left.stop="toggleLinksIsVisible" :class="{active: linksIsVisible}")
          img.icon(v-if="linksIsVisible" src="@/assets/view-hidden.svg")
          img.icon(v-else src="@/assets/view.svg")
          span Link
      //- Split
      .button-wrap(v-if="nameHasLineBreaks")
        button(:disabled="!canEditCard" @click.left.stop="splitCards")
          img.icon(src="@/assets/split-vertically.svg")
          span Split into {{nameLines}} Cards

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
      p To fit small screens, cards can't be longer than 250 characters
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

</template>

<script>
import FramePicker from '@/components/dialogs/FramePicker.vue'
import ImagePicker from '@/components/dialogs/ImagePicker.vue'
import TagPicker from '@/components/dialogs/TagPicker.vue'
import Loader from '@/components/Loader.vue'
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'

import qs from '@aguezz/qs-parse'

let previousTags = []

export default {
  name: 'CardDetails',
  components: {
    FramePicker,
    ImagePicker,
    TagPicker,
    Loader
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
      cursorPosition: 0
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.framePickerIsVisible = false
        this.imagePickerIsVisible = false
        this.hideTagPicker()
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
      this.savePreviousTags()
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
    isInvitedButCannotEditSpace () { return this.$store.getters['currentUser/isInvitedButCannotEditSpace']() },
    errorMaxCardLength () {
      const maxCardLength = 250
      if (this.card.name.length >= maxCardLength) {
        return true
      } else {
        return false
      }
    },
    tagsInCard () { return this.$store.getters['currentSpace/tagsInCard'](this.card) },
    currentSelectedTag () { return this.$store.state.currentSelectedTag },
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
    linkUrls () {
      return this.urls.filter(url => {
        return this.urlType(url) === 'link'
      })
    },
    hasLinks () {
      return Boolean(this.linkUrls.length)
    },
    linksIsVisible () {
      const linksVisible = this.linkUrls.filter(url => {
        const queryString = utils.queryString(url)
        if (queryString) {
          const queryObject = qs.decode(queryString)
          return queryObject.hidden || queryObject.kinopio
        } else {
          return false
        }
      })
      return linksVisible.length === this.linkUrls.length
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
    nameHasLineBreaks () {
      if (this.nameLines > 1) {
        return true
      } else {
        return false
      }
    },
    cardPendingUpload () {
      const pendingUploads = this.$store.state.upload.pendingUploads
      return pendingUploads.find(upload => upload.cardId === this.card.id)
    }
  },
  methods: {
    showTagPicker (cursorPosition) {
      this.closeDialogs()
      const nameRect = this.$refs.name.getBoundingClientRect()
      this.tagPickerPosition = {
        top: nameRect.height - 2
      }
      this.updateTagPickerSearch(cursorPosition)
      this.tagPickerIsVisible = true
    },
    hideTagPicker () {
      this.tagPickerSearch = ''
      this.tagPickerIsVisible = false
    },
    tagStartText (cursorPosition) {
      // ...[[abc
      const start = this.name.substring(0, cursorPosition)
      let startPosition = start.lastIndexOf('[[')
      if (startPosition === -1) { return }
      startPosition = startPosition + 2
      return start.substring(startPosition)
    },
    tagEndText (cursorPosition) {
      // xyz]]...
      const end = this.name.substring(cursorPosition)
      const endPosition = end.indexOf(']]')
      if (endPosition === -1) { return }
      return end.substring(0, endPosition)
    },
    updateTagPickerSearch (cursorPosition) {
      const start = this.tagStartText(cursorPosition) || ''
      const end = this.tagEndText(cursorPosition) || ''
      this.tagPickerSearch = start + end
    },
    isCursorInsideTagBrackets (cursorPosition) {
      this.cursorPosition = cursorPosition
      const start = this.tagStartText(cursorPosition)
      const end = this.tagEndText(cursorPosition)
      if (start === undefined || end === undefined) { return }
      if (!start.includes(']]') && !end.includes('[[')) {
        return true
      }
    },
    checkIfShouldShowTagPicker () {
      const cursorPosition = this.$refs.name.selectionStart
      const tagPickerIsVisible = this.tagPickerIsVisible
      const isCursorInsideTagBrackets = this.isCursorInsideTagBrackets(cursorPosition)
      if (isCursorInsideTagBrackets && !tagPickerIsVisible) {
        this.showTagPicker(cursorPosition)
      } else if (!isCursorInsideTagBrackets && tagPickerIsVisible) {
        this.hideTagPicker()
      }
    },
    checkIfShouldHideTagPicker () {
      const cursorPosition = this.$refs.name.selectionStart
      const tagPickerIsVisible = this.tagPickerIsVisible
      const isCursorInsideTagBrackets = this.isCursorInsideTagBrackets(cursorPosition)
      if (!isCursorInsideTagBrackets && tagPickerIsVisible) {
        this.hideTagPicker()
      }
    },
    addClosingBrackets (cursorPosition) {
      const name = this.name
      const newName = `${name.substring(0, cursorPosition)}]]${name.substring(cursorPosition)}`
      this.updateCardName(newName)
      this.$nextTick(() => {
        this.$refs.name.setSelectionRange(cursorPosition, cursorPosition)
      })
    },
    updateTagPicker (event) {
      const cursorPosition = this.$refs.name.selectionStart
      const key = event.key
      const keyIsLettterOrNumber = key.length === 1
      const previousCharacter = this.name[cursorPosition - 2]
      const isCursorInsideTagBrackets = this.isCursorInsideTagBrackets(cursorPosition)
      if (this.tagPickerIsVisible) {
        this.updateTagPickerSearch(cursorPosition)
      }
      if (cursorPosition === 0) { return }
      if (key === '[' && previousCharacter === '[') {
        this.showTagPicker(cursorPosition)
        this.addClosingBrackets(cursorPosition)
      } else if (keyIsLettterOrNumber && isCursorInsideTagBrackets) {
        this.showTagPicker(cursorPosition)
      }
    },
    moveCursorPastTagEnd () {
      const cursorPosition = this.$refs.name.selectionStart
      let end = this.name.substring(cursorPosition)
      let newCursorPosition = end.indexOf(']]')
      if (newCursorPosition === -1) {
        this.addClosingBrackets(cursorPosition)
        end = this.name.substring(cursorPosition)
        newCursorPosition = end.indexOf(']]') + 2
      } else {
        newCursorPosition = newCursorPosition + 2
      }
      newCursorPosition = newCursorPosition + cursorPosition
      this.$refs.name.setSelectionRange(newCursorPosition, newCursorPosition)
    },
    seperatedLines (name) {
      let lines = name.split('\n')
      lines = lines.filter(line => Boolean(line.length))
      return lines
    },
    updateLink ({ url, newUrl }) {
      const newName = this.name.replace(url.trim(), newUrl)
      this.updateCardName(newName)
    },
    toggleLinksIsVisible () {
      const isVisible = !this.linksIsVisible
      let newUrls = []
      this.urls.forEach(url => {
        url = url.trim()
        const isLink = this.urlType(url) === 'link'
        if (!isLink) { return }
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
      const maxCardLength = 250
      const cardNames = this.seperatedLines(this.pastedName || this.name)
      let newCards = cardNames.map(name => {
        return {
          name: name.substring(0, maxCardLength),
          x: this.card.x,
          y: this.card.y,
          frameId: this.card.frameId
        }
      })
      this.$store.dispatch('currentSpace/addMultipleCards', newCards)
      this.removeCard()
      newCards = utils.clone(this.$store.state.currentSpace.cards)
      newCards = newCards.slice(-cardNames.length)
      this.$nextTick(() => {
        let prevCard = {}
        newCards = newCards.map(card => {
          if (utils.objectHasKeys(prevCard)) {
            const element = document.querySelector(`article [data-card-id="${card.id}"]`)
            const rect = element.getBoundingClientRect()
            card.y = prevCard.y + rect.height + spaceBetweenCards
          }
          prevCard = card
          return card
        })
        newCards.forEach(card => {
          this.$store.dispatch('currentSpace/updateCard', {
            id: card.id,
            y: card.y
          })
        })
      })
    },
    updatePastedName (event) {
      const text = event.clipboardData.getData('text')
      this.pastedName = text
      this.wasPasted = true
    },
    removeTrackingQueryStrings () {
      this.linkUrls.forEach(url => {
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
    },
    insertLineBreak (event) {
      const position = this.$refs.name.selectionEnd
      const name = this.card.name
      const newName = name.substring(0, position) + '\n' + name.substring(position)
      setTimeout(() => {
        this.$refs.name.setSelectionRange(position + 1, position + 1)
      })
      this.updateCardName(newName)
    },
    closeCard (event) {
      if (this.tagPickerIsVisible) {
        this.hideTagPicker()
        this.moveCursorPastTagEnd()
        event.stopPropagation()
        return
      }
      this.$store.dispatch('closeAllDialogs', 'CardDetails.closeCard')
    },
    closeCardAndFocus () {
      if (this.tagPickerIsVisible) {
        this.hideTagPicker()
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
      const cursorPosition = this.$refs.name.selectionStart
      if (this.isCursorInsideTagBrackets(cursorPosition)) {
        this.showTagPicker(cursorPosition)
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
      this.hideTagPicker()
      this.hideTagDetailsIsVisible()
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    urlType (url) {
      if (utils.urlIsImage(url)) {
        return 'image'
      } else if (utils.urlIsVideo(url)) {
        return 'video'
      } else if (utils.urlIsAudio(url)) {
        return 'audio'
      } else {
        return 'link'
      }
    },
    addFile (file) {
      let name = this.card.name
      const url = file.url
      const urlType = this.urlType(url)
      const checkbox = utils.checkboxFromString(name)
      const previousUrls = utils.urlsFromString(name)
      let isReplaced
      previousUrls.forEach(previousUrl => {
        if (this.urlType(previousUrl) === urlType) {
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
    savePreviousTags () {
      const name = this.card.name
      if (!name) {
        previousTags = []
        return
      }
      previousTags = utils.tagsFromStringWithoutBrackets(name) || []
    },
    normalizeTags (tags) {
      return tags.map(tag => {
        return {
          name: tag,
          cardId: this.card.id
        }
      })
    },
    updateTags () {
      const name = this.card.name
      if (!name) { return }
      const newTags = utils.tagsFromStringWithoutBrackets(name) || []
      // removed
      let removedTags = previousTags.filter(previousTag => !newTags.includes(previousTag))
      removedTags = this.normalizeTags(removedTags)
      removedTags.forEach(tag => this.$store.dispatch('currentSpace/removeTag', tag))
      // added
      let addedTags = newTags.filter(newTag => !previousTags.includes(newTag))
      addedTags = this.normalizeTags(addedTags)
      addedTags.forEach(tag => this.$store.dispatch('currentSpace/addTag', tag))
      this.savePreviousTags()
    },
    hideTagDetailsIsVisible () {
      this.$store.commit('currentSelectedTag', {})
      this.$store.commit('tagDetailsIsVisible', false)
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
    triggerTagPickerNavigation (event) {
      const modifierKey = event.altKey || event.shiftKey || event.ctrlKey || event.metaKey
      const shouldTrigger = this.tagPickerIsVisible && !modifierKey
      if (shouldTrigger) {
        this.$store.commit('triggerPickerNavigationKey', event.key)
        event.preventDefault()
      }
    },
    triggerTagPickerSelect (event) {
      const modifierKey = event.altKey || event.shiftKey || event.ctrlKey || event.metaKey
      const shouldTrigger = this.tagPickerIsVisible && !modifierKey
      if (shouldTrigger) {
        this.$store.commit('triggerPickerSelect')
        event.preventDefault()
      }
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoViewAndFocus()
          this.savePreviousTags()
        } else {
          this.removeTrackingQueryStrings()
        }
      })
      if (!visible && this.cardIsEmpty()) {
        this.$store.dispatch('currentSpace/removeCard', this.card)
      }
      this.$store.commit('updatePageSizes')
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
</style>
