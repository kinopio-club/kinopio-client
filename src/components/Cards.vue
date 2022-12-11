<template lang="pug">
.cards
  //- locked cards rendered in ItemsLocked
  template(v-for="card in unlockedCards")
    Card(:card="card")
</template>

<script>
import Card from '@/components/Card.vue'

export default {
  name: 'Cards',
  components: {
    Card
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      const cardRectEvents = ['isLoadingSpace', 'spaceZoomPercent', 'currentCards/afterMove', 'currentCards/create']
      if (mutation.type === 'triggerUpdateUrlPreviewComplete') {
        this.$store.dispatch('currentCards/checkIfShouldUpdateNewTweetCards')
      } else if (cardRectEvents.includes(mutation.type)) {
        this.updateCardRectsInViewport()
      }
    })
  },
  mounted () {
    window.addEventListener('scroll', this.updateCardRectsInViewport)
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updateCardRectsInViewport)
  },
  computed: {
    unlockedCards () { return this.$store.getters['currentCards/isNotLocked'] }
  },
  methods: {
    updateCardRectsInViewport () {
      this.$nextTick(() => {
        let cards = []
        const elements = document.querySelectorAll('article#card')
        elements.forEach(element => {
          if (element.dataset.isLocked === 'true') { return }
          const card = this.$store.getters['currentCards/byId'](element.dataset.cardId)
          cards.push(card)
        })
        this.$store.commit('currentCards/inViewport', cards)
      })
    }
  }
}
</script>

<style lang="stylus">
</style>
