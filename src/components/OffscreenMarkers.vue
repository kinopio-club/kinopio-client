<template lang="pug">
aside
  .marker yo
</template>

<script>
// will contain toggleable view code for directions/corners based on intersection observed state of all .cards

let observer

export default {
  name: 'OffscreenMarkers',
  mounted () {
    this.updateCardsObserver()
  },
  data () {
    return {
      offscreen: []
    }
  },
  computed: {
    cards () {
      return this.$store.state.currentSpace.cards
    }
  },
  methods: {
    // bottom
    // top
    // left
    // right
    // topleft
    // topright
    // bottomleft
    // bottomright
    updateDirections () {
      this.offscreen.map(card => {
        let x = ''
        let y = ''
        const scrollX = window.scrollX
        const scrollY = window.scrollY
        const viewportWidth = this.$store.state.viewportWidth
        const viewportHeight = this.$store.state.viewportHeight
        if (card.y > (viewportHeight + scrollY)) {
          y = 'bottom'
        } else if (card.y < scrollY) {
          y = 'top'
        }
        if (card.x > (viewportWidth + scrollX)) {
          x = 'right'
        } else if (card.x < scrollX) {
          x = 'left'
        }
        card.direction = y + x
        return card
      })
    },
    updateCardsObserver () {
      const cards = document.querySelectorAll('.card')
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const cardId = entry.target.dataset.cardId
          const cardX = entry.target.dataset.cardX
          const cardY = entry.target.dataset.cardY
          if (entry.intersectionRatio > 0) {
            this.offscreen = this.offscreen.filter(card => {
              return card.id !== cardId
            })
          } else {
            const card = {
              id: cardId,
              x: cardX,
              y: cardY
            }
            this.offscreen.push(card)
          }
        })

        this.updateDirections()
        console.log('🍆', this.offscreen)
      })
      cards.forEach(card => {
        observer.observe(card)
      })
    }
  },

  watch: {
    cards (state) {
      observer.disconnect()
      this.updateCardsObserver()
    }
  }

}
</script>

<style lang="stylus">
</style>
