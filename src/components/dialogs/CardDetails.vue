<template lang="pug">
dialog.card-details(v-if="visible" :open="visible" ref="dialog" @click="closeDialogs" @keyup.stop.backspace="removeCard")
  section.meta-section
    textarea.name(
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
    )
    //- todo change esc to keydown if i want to bubble up to also resetting the tree, if it feels better irl
    button(@click="removeCard")
      img.icon(src="@/assets/remove.svg")
      span Remove
    .button-wrap
      button(@click.stop="toggleFramePickerIsVisible" :class="{active : framePickerIsVisible}")
        span Frames
      FramePicker(:visible="framePickerIsVisible" :card="card")
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil awaiting 'scrollmode' support for https://github.com/w3c/csswg-drafts/pull/1805

import utils from '@/utils.js'
import FramePicker from '@/components/dialogs/FramePicker.vue'

// prevents jarring frame skips caused by simultaneously scrolling a card into view, zooming in, and showing an onscreen keyboard
const shouldPreventAutofocus = () => {
  const isMobile = utils.isMobile()
  const pinchZoomRatio = document.documentElement.clientWidth / window.innerWidth
  const pinchZoomRatioShouldNotFocusZoom = !utils.isBetween({
    value: pinchZoomRatio,
    min: 0.8,
    max: 1.3
  })
  if (isMobile && pinchZoomRatioShouldNotFocusZoom) {
    return true
  }
}

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
      framePickerIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.framePickerIsVisible = false
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
    visible () {
      return this.$store.state.cardDetailsIsVisibleForCardId === this.card.id
    },
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
    focusName () {
      this.$nextTick(() => {
        const element = this.$refs.name
        if (!element) { return }
        element.focus()
      })
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    },
    scrollIntoViewAndFocus () {
      const element = this.$refs.name
      const length = this.name.length
      this.scrollIntoView()
      if (shouldPreventAutofocus()) { return }
      this.$nextTick(() => {
        this.focusName()
        if (length) {
          element.setSelectionRange(length, length)
        }
      })
    },
    closeDialogs () {
      this.framePickerIsVisible = false
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
  .meta-section
    background-color var(--secondary-background)
  textarea
    margin-bottom 5px
</style>
