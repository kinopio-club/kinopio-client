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
        @keyup.stop.esc="closeCardAndFocus"

        @keyup.stop.backspace="checkIfShouldShowTagPicker"
        @keyup.stop.up="checkIfShouldShowTagPicker"
        @keyup.stop.down="checkIfShouldShowTagPicker"
        @keyup.stop.left="checkIfShouldShowTagPicker"
        @keyup.stop.right="checkIfShouldShowTagPicker"

        data-type="name"
        maxlength="250"
        @click.left="clickName"
        @blur="triggerUpdatePositionInVisualViewport"
        @paste="updatePastedName"
        @keyup="updateTagPicker"

        @keyup.alt.enter.exact.stop
        @keyup.ctrl.enter.exact.stop
        @keydown.alt.enter.exact.stop="insertLineBreak"
        @keydown.ctrl.enter.exact.stop="insertLineBreak"
      )
      TagPicker(:visible="tagPickerIsVisible" :position="tagPickerPosition" :search="tagPickerSearch")
        //- @selectLabel="insertLabel"
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

</template>

<script>
import FramePicker from '@/components/dialogs/FramePicker.vue'
import ImagePicker from '@/components/dialogs/ImagePicker.vue'
import TagPicker from '@/components/dialogs/TagPicker.vue'
import Loader from '@/components/Loader.vue'
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'

import qs from '@aguezz/qs-parse'

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
      wasPasted: false
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
    // for new cards
    const element = this.$refs.dialog
    if (element) {
      this.scrollIntoViewAndFocus()
      this.$emit('broadcastShowCardDetails')
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
      // ...[[start|
      const start = this.name.substring(0, cursorPosition)
      let startPosition = start.lastIndexOf('[[')
      if (startPosition === -1) { return }
      startPosition = startPosition + 2
      return start.substring(startPosition)
    },
    tagEndText (cursorPosition) {
      // |end]]...
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
    isCursorInsideBrackets (cursorPosition) {
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
      const isCursorInsideBrackets = this.isCursorInsideBrackets(cursorPosition)
      if (isCursorInsideBrackets && !tagPickerIsVisible) {
        this.showTagPicker(cursorPosition)
      } else if (!isCursorInsideBrackets && tagPickerIsVisible) {
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
      const previousCharacter = this.name[cursorPosition - 2]
      if (this.tagPickerIsVisible) {
        this.updateTagPickerSearch(cursorPosition)
      }
      if (cursorPosition === 0) { return }
      if (key === '[' && previousCharacter === '[') {
        this.showTagPicker(cursorPosition)
        this.addClosingBrackets(cursorPosition)
      }

      // hide label picker:
      // X esc
      // X enter while typing = new label
      // X backspace when this.currentLabel is ''
      // X if cursor isn't inside a [[ ]]
      // X isCursorInsideBrackets(cursorPosition)

      // each label has a id, name, color . 1label:many-cards (how tod?)
      // get spaces should include labels
      // clicking a label opens labelDetails: color, name, list currentspace cards and fetch other spaces that it's linked to (click to scroll/switch)
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
        // TODO this.addSelectedTag()
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
      if (this.isCursorInsideBrackets(cursorPosition)) {
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
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoViewAndFocus()
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
