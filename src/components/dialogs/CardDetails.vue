<template lang="pug">
dialog.card-details(v-if="visible" :open="visible" ref="cardDetails")
  section.meta-section
    .row
      textarea.name(
        rows="1"
        placeholder="Tell me your dreams"
        v-model="name"
        v-focus
      )
    button(@click="removeCard")
      img.icon(src="@/assets/remove.svg")
      span Remove
</template>

<script>
import utils from '@/utils.js'

let observer

export default {
  name: 'CardDetails',
  props: {
    card: Object // name, x, y, z, cardDetailsVisible
  },
  directives: {
    focus: {
      inserted (element) {
        if (element.value.length === 0) {
          element.focus()
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
    const element = this.$refs.cardDetails
    if (element) {
      this.scrollIntoView()
    }
  },
  computed: {
    visible () { return this.card.cardDetailsVisible },
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
      }
    }
  },
  methods: {
    removeCard () {
      this.$store.dispatch('currentSpace/removeCard', this.card.id)
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
      if (this.preventScrollIntoView()) { return }
      const element = this.$refs.cardDetails
      observer = new IntersectionObserver((entries, observer) => {
        let top, left
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            const clientRect = entry.boundingClientRect
            const intersectionRect = entry.intersectionRect
            top = (clientRect.height - intersectionRect.height) + 8
            left = (clientRect.width - intersectionRect.width) + 8
            if (clientRect.x < 0) {
              left = -left
            }
            window.scrollBy({ top, left, behavior: 'smooth' })
          } else {
            observer.disconnect()
          }
        })
      }, { threshold: 1 })
      observer.observe(element)
    },
    cardIsEmpty () {
      // TODO: expand isEmpty to inlcude other metadata content (images etc)
      return !this.card.name
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
