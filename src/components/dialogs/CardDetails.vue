<template lang="pug">
dialog.card-details(v-if="visible" :open="visible" ref="cardDetails")
  section.meta-section
    .row
      textarea.name(
        rows="1"
        placeholder="Tell me your dreams"
        v-model="name"
      )
    button(@click="removeCard")
      img.icon(src="@/assets/remove.svg")
      span Remove
</template>

<script>
let observer

export default {
  name: 'CardDetails',
  props: {
    card: Object // name, x, y, z, cardDetailsVisible
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
    scrollIntoView () {
      console.log('🥬 card details visible, scrollIntoView()')
      const element = this.$refs.cardDetails
      observer = new IntersectionObserver((entries, observer) => {
        let top, left
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            const clientRect = entry.boundingClientRect
            const intersectionRect = entry.intersectionRect
            top = (clientRect.height - intersectionRect.height) + 8
            left = (clientRect.width - intersectionRect.width) + 8
            window.scrollBy({ top, left, behavior: 'smooth' })
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
        } else {
          observer.disconnect()
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
