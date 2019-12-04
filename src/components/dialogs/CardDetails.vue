<template lang="pug">
dialog.card-details(v-if="visible" :open="visible" ref="dialog" @click="closeDialogs")
  section.meta-section
    textarea.name(
      ref="name"
      rows="1"
      placeholder="Tell me your dreams"
      v-model="name"
      @keydown.enter="completeEditing"
      @keydown.esc="closeCard"
      data-type="name"
    )
    button(@click="removeCard")
      img.icon(src="@/assets/remove.svg")
      span Remove
    .button-wrap
      button(@click.stop="toggleFrameDetailsIsVisible" :class="{active : frameDetailsIsVisible}")
        span Frames
      FrameDetails(:visible="frameDetailsIsVisible" :card="card")
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil awaiting 'scrollmode' support for https://github.com/w3c/csswg-drafts/pull/1805

// import utils from '@/utils.js'
import FrameDetails from '@/components/dialogs/FrameDetails.vue'

// prevent focus on existing cards on mobile because of keyboard scroll issues when zoomed out
// const shouldPreventAutofocus = (length) => {
//   const cardHasName = Boolean(length)
//   const isMobile = utils.isMobile()
//   const pinchZoomRatio = document.documentElement.clientWidth / window.innerWidth
//   const pinchZoomRatioShouldFocusZoom = utils.between({
//     value: pinchZoomRatio,
//     min: 0.85,
//     max: 1.15
//   })
//   console.log('is zoomed?', document.documentElement.clientWidth / window.innerWidth, pinchZoomRatioShouldFocusZoom)
//   if (cardHasName && isMobile && !pinchZoomRatioShouldFocusZoom) {
//     return true
//   }
// }

export default {
  name: 'CardDetails',
  components: {
    FrameDetails
  },
  props: {
    card: Object // name, x, y, z
  },
  data () {
    return {
      frameDetailsIsVisible: false
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'closeAllDialogs') {
        this.frameDetailsIsVisible = false
      }
    })
  },
  // directives: {
  //   focus: {
  //     inserted (element) {
  //       const length = element.value.length || 0
  //       const preventAutofocus = shouldPreventAutofocus(length)
  //       // if (length && utils.isMobile()) { return }
  //       console.log('🌹',preventAutofocus)
  //       if (preventAutofocus) { return }
  //       element.focus()
  //       if (length) {
  //         element.setSelectionRange(length, length)
  //       }
  //     }
  //   }
  // },
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
        const card = {
          name: newName,
          id: this.card.id
        }
        this.$store.dispatch('currentSpace/updateCard', card)
        this.$nextTick(() => {
          this.$store.dispatch('currentSpace/updateCardConnectionPaths', { cardId: this.card.id, shouldUpdateApi: true })
        })
      }
    }
  },
  methods: {
    completeEditing (event) {
      if (!event.shiftKey) {
        this.$store.commit('closeAllDialogs')
      }
    },
    closeCard () {
      this.$store.commit('closeAllDialogs')
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
      // TODO: expand isEmpty to inlcude other metadata content (images etc)
      return !this.card.name
    },
    toggleFrameDetailsIsVisible () {
      const isVisible = this.frameDetailsIsVisible
      this.closeDialogs()
      this.frameDetailsIsVisible = !isVisible
    },
    focusName () {
      const element = this.$refs.name
      console.log('focusname run')
      this.$nextTick(() => {
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
      this.$nextTick(() => {
        this.focusName()
        if (length) {
          element.setSelectionRange(length, length)
        }
      })
    },
    closeDialogs () {
      this.frameDetailsIsVisible = false
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
