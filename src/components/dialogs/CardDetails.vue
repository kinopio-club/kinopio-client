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
      @keyup.alt.enter.exact.stop="insertLineBreak"
      @keyup.ctrl.enter.exact.stop="insertLineBreak"
      @keyup.stop.esc="closeCardAndFocus"
      @keyup.stop.backspace
      data-type="name"
      maxlength="250"
      @click="triggerUpdateMagicPaintPositionOffset"
    )
    .button-wrap
      button(:disabled="!canEditCard" @click="removeCard")
        img.icon(src="@/assets/remove.svg")
        span Remove
    .button-wrap
      button(:disabled="!canEditCard" @click.stop="toggleImagePickerIsVisible" :class="{active : imagePickerIsVisible}")
        span Image
      //- ImagePicker(:visible="imagePickerIsVisible")
    .button-wrap
      button(:disabled="!canEditCard" @click.stop="toggleFramePickerIsVisible" :class="{active : framePickerIsVisible}")
        span Frames
      FramePicker(:visible="framePickerIsVisible" :cards="[card]")

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
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil awaiting 'scrollmode' support for https://github.com/w3c/csswg-drafts/pull/1805

import utils from '@/utils.js'
import FramePicker from '@/components/dialogs/FramePicker.vue'

export default {
  name: 'CardDetails',
  components: {
    FramePicker
  },
  props: {
    card: Object // name, x, y, z
  },
  data () {
    return {
      framePickerIsVisible: false,
      imagePickerIsVisible: false
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
      }
    }
  },
  methods: {
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
      this.$store.commit('closeAllDialogs')
    },
    closeCardAndFocus () {
      this.closeCard()
      document.querySelector(`.card[data-card-id="${this.card.id}"]`).focus()
    },
    removeCard () {
      if (!this.canEditCard) { return }
      this.$store.dispatch('currentSpace/removeCard', this.card)
      this.$store.commit('cardDetailsIsVisibleForCardId', '')
    },
    textareaSizes () {
      let textareas = document.querySelectorAll('dialog textarea')
      textareas.forEach(textarea => {
        textarea.style.height = textarea.scrollHeight + 1 + 'px'
      })
    },
    cardIsEmpty () {
      // TODO: expand isEmpty to inlcude other metadata content (images etc)?
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
    },
    focusName () {
      const element = this.$refs.name
      const length = this.name.length
      if (!element) { return }
      element.focus()
      if (length && element) {
        element.setSelectionRange(length, length)
      }
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    },
    scrollIntoViewAndFocus () {
      const pinchZoomRatio = document.documentElement.clientWidth / window.innerWidth
      const pinchZoomRatioShouldFocus = utils.isBetween({
        value: pinchZoomRatio,
        min: 0.8,
        max: 1.3
      })
      if (!pinchZoomRatioShouldFocus) { return }
      if (!utils.isMobile()) {
        this.scrollIntoView()
      }
      this.focusName()
      this.triggerUpdateMagicPaintPositionOffset()
    },
    triggerUpdateMagicPaintPositionOffset () {
      this.$store.commit('triggerUpdateMagicPaintPositionOffset')
    },
    closeDialogs () {
      this.framePickerIsVisible = false
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('triggerSignUpOrInIsVisible')
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
</style>
