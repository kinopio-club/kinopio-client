<template lang="pug">
dialog.card-details(v-if="visible" :open="visible" ref="dialog" @click="closeDialogs")
  section.meta-section
    .row
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

let isNewCard

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
        if (element.value.length === 0) {
          isNewCard = true
        } else {
          isNewCard = false
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
      if (this.preventScrollIntoView()) { return }
      this.scrollIntoView()
    }
  },
  computed: {
    visible () {
      return this.$store.state.cardDetailsIsVisibleForCard === this.card.id
    },
    name: {
      get () {
        return this.card.name
      },
      set (newValue) {
        const options = {
          type: 'name',
          value: newValue,
          cardId: this.card.id
        }
        this.$store.commit('currentSpace/updateCardDetails', options)
        this.$nextTick(() => {
          this.$store.commit('currentSpace/updateCardConnections', this.card.id)
        })
      }
    }
  },
  methods: {
    focusName () {
      const element = this.$refs.name
      if (isNewCard) {
        this.$nextTick(() => {
          element.focus()
        })
      }
    },
    blurField (event) {
      if (!event.shiftKey) {
        event.preventDefault()
        event.target.blur()
      }
    },
    completeEditing (event) {
      if (isNewCard) {
        this.$store.commit('closeAllDialogs')
      } else {
        this.blurField(event)
      }
    },
    closeCard () {
      this.$store.commit('closeAllDialogs')
    },
    removeCard () {
      this.$store.dispatch('currentSpace/removeCard', this.card.id)
      this.$store.commit('cardDetailsIsVisibleForCard', '')
    },
    textareaSizes () {
      let textareas = document.querySelectorAll('dialog textarea')
      textareas.forEach(textarea => {
        textarea.style.height = textarea.scrollHeight + 1 + 'px'
      })
    },
    preventScrollIntoView () {
    // disable scrolling into view on ios because it conflicts with panning and zooming on focused input
      return Boolean(this.cardIsEmpty() && utils.isIOS())
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
        this.$store.dispatch('currentSpace/removeCard', this.card.id)
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
</style>
