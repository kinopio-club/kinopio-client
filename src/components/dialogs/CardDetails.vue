<template lang="pug">
dialog.card-details(v-if="visible" :open="visible" ref="dialog" @click="closeDialogs" @keyup.stop.backspace="removeCard")
  section
    textarea.name(
      :disabled="!canEditCard"
      ref="name"
      rows="1"
      placeholder="Type text here, or paste a URL"
      v-model="name"
      @keydown.prevent.enter.exact
      @keyup.enter.exact="closeCard"
      @keyup.stop.esc="closeCardAndFocus"
      @keyup.stop.backspace
      data-type="name"
      maxlength="250"
      @click="triggerUpdateMagicPaintPositionOffset"
      @blur="triggerUpdatePositionInVisualViewport"
      @paste="updatePastedName"

      @keyup.alt.enter.exact.stop
      @keyup.ctrl.enter.exact.stop
      @keydown.alt.enter.exact.stop="insertLineBreak"
      @keydown.ctrl.enter.exact.stop="insertLineBreak"
    )
    .row(v-if="cardPendingUpload")
      .badge.info
        Loader(:visible="true")
        span {{cardPendingUpload.percentComplete}}%

    .row
      //- Remove
      .button-wrap
        button(:disabled="!canEditCard" @click="removeCard")
          img.icon(src="@/assets/remove.svg")
          span Remove
      //- [·]
      .button-wrap.cards-checkboxes
        label(v-if="checkbox" :class="{active: checkboxIsChecked, disabled: !canEditCard}" tabindex="0")
          input(type="checkbox" v-model="checkboxIsChecked" tabindex="-1")
        label(v-else @click.prevent="addCheckbox" @keydown.stop.enter="addCheckbox" :class="{disabled: !canEditCard}" tabindex="0")
          input.add(type="checkbox" tabindex="-1")
      //- Image
      .button-wrap
        button(:disabled="!canEditCard" @click.stop="toggleImagePickerIsVisible" :class="{active : imagePickerIsVisible}")
          span Image
        ImagePicker(:visible="imagePickerIsVisible" :initialSearch="initialSearch" :cardUrl="url" :cardId="card.id" @selectImage="addImage")
      //- Frames
      .button-wrap
        button(:disabled="!canEditCard" @click.stop="toggleFramePickerIsVisible" :class="{active : framePickerIsVisible}")
          span Frames
        FramePicker(:visible="framePickerIsVisible" :cards="[card]")
      //- Split
    .row(v-if="nameHasLineBreaks")
      .button-wrap
        button(:disabled="!canEditCard" @click.stop="splitCards")
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
            button(@click.stop="triggerSignUpOrInIsVisible") Sign Up or In
      template(v-else-if="spacePrivacyIsClosed")
        span.badge.info
          img.icon(src="@/assets/unlock.svg")
          span To edit closed spaces, you'll need to be invited

</template>

<script>
import FramePicker from '@/components/dialogs/FramePicker.vue'
import ImagePicker from '@/components/dialogs/ImagePicker.vue'
import Loader from '@/components/Loader.vue'
import scrollIntoView from '@/scroll-into-view.js'
import utils from '@/utils.js'

export default {
  name: 'CardDetails',
  components: {
    FramePicker,
    ImagePicker,
    Loader
  },
  props: {
    card: Object // name, x, y, z
  },
  data () {
    return {
      framePickerIsVisible: false,
      imagePickerIsVisible: false,
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
    seperatedLines (name) {
      let lines = name.split('\n')
      lines = lines.filter(line => Boolean(line.length))
      return lines
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
      const card = {
        name: newName,
        id: this.card.id
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
      this.$store.dispatch('closeAllDialogs')
    },
    closeCardAndFocus () {
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
    triggerUpdateMagicPaintPositionOffset () {
      this.$store.commit('triggerUpdateMagicPaintPositionOffset')
      this.triggerUpdatePositionInVisualViewport()
    },
    closeDialogs () {
      this.framePickerIsVisible = false
      this.imagePickerIsVisible = false
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    addImage (image) {
      let name = this.card.name
      const checkbox = utils.checkboxFromString(name)
      const url = utils.urlFromString(name)
      if (utils.urlIsImage(url) || utils.urlIsVideo(url)) {
        name = name.replace(url, '')
      }
      if (image.url === url) {
        name = name.replace(url, '')
      } else {
        name = utils.trim(name)
        name = `${image.url}\n\n${name}`
      }
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
