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
export default {
  name: 'CardDetails',
  props: {
    card: Object // name, x, y, z, cardDetailsVisible
  },
  updated () {
    this.$nextTick(() => {
      if (this.visible) {
        this.scrollIntoView()
        this.textareaSizes()
      }
    })
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
      let top, left
      const element = this.$refs.cardDetails
      // move to visible?
      let observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            console.log(entry.boundingClientRect, entry.intersectionRect)
            const clientRect = entry.boundingClientRect
            const intersectionRect = entry.intersectionRect
            top = (clientRect.height - intersectionRect.height) + 8
            left = (clientRect.width - intersectionRect.width) + 8
            window.scrollBy({ top, left, behavior: 'smooth' })
          }
        })
      }, { threshold: 1 })

      observer.observe(element)

      // observer.unobserve(element)
      // ^ do in watch when not visible anymore
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('updatePageSizes')
      const isEmpty = !this.card.name // TODO: expand isEmpty to inlcude other metadata content (images etc)
      if (!visible && isEmpty) {
        this.$store.dispatch('currentSpace/removeCard', this.card.id)
      }
    }
  }
}
</script>

<style lang="stylus">
.card-details
  .meta-section
    background-color var(--secondary-background)
</style>
