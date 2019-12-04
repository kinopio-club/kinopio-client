<template lang="pug">
dialog.card-details(v-if="visible" :open="visible" ref="dialog" @click="closeDialogs")
  section.meta-section
    textarea.name(
      ref="name"
      rows="1"
      placeholder="Tell me your dreams"
      v-model="name"
      v-focus
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

import utils from '@/utils.js'
import FrameDetails from '@/components/dialogs/FrameDetails.vue'

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
  directives: {
    focus: {
      inserted (element) {
        const length = element.value.length || 0
        if (!length && utils.isMobile()) { return }
        element.focus()
        if (length) {
          element.setSelectionRange(length, length)
        }
      }
    }
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
      this.focusName()
      this.scrollIntoView()
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
    focusName () {
      const element = this.$refs.name
      this.$nextTick(() => {
        element.focus()
      })
    },
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
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
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
    closeDialogs () {
      this.frameDetailsIsVisible = false
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.scrollIntoView()
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
