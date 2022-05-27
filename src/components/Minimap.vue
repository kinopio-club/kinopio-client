<template lang="pug">
.overlay.minimap(v-if="isVisible" @click="closeAllDialogs")
  .background(:style="overlayBackgroundStyle")
  template(v-for="card in cards")
    .card(:style="cardPosition(card)" :data-card-minimap-id="card.id")
</template>

<script>
const padding = 100
const maxScale = 0.4

export default {
  name: 'ComponentName',
  components: {
  },
  created () {
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'closeAllDialogs') {
  //       this.closeAllDialogs()
  //     }
  //   })
  },
  mounted () {
    this.update()
  },
  data () {
    return {
      boundary: {},
      scale: 1,
      cards: []
      // cursorPosition: {},
    }
  },
  computed: {
    isVisible () { return this.$store.state.minimapIsVisible },
    overlayBackgroundStyle () {
      const backgroundColor = this.$store.state.currentSpace.backgroundTint
      return { backgroundColor }
    }
  },
  methods: {
    update () {
      this.updateBoundary()
      this.updateScale()
      // this.updateViewportBoundary()
      this.updateCards()
      console.log('🍅', this.boundary, this.scale, this.cards)
    },
    updateBoundary () {
      const cards = this.$store.getters['currentCards/all']
      let width = 0
      let height = 0
      cards.forEach(card => {
        const x = card.x + card.width
        const y = card.y + card.height
        if (x > width) {
          width = x
        }
        if (y > height) {
          height = y
        }
      })
      this.boundary = { width, height }
    },
    updateScale () {
      const viewportWidth = this.$store.state.viewportWidth
      const viewportHeight = this.$store.state.viewportHeight
      const scaleX = viewportWidth / this.boundary.width
      const scaleY = viewportHeight / this.boundary.height
      let scale = Math.min(scaleX, scaleY)
      scale = Math.min(scale, maxScale)
      this.scale = scale
    },
    updateCards () {
      let cards = this.$store.getters['currentCards/all']
      cards = cards.map(card => {
        return {
          id: card.id,
          x: Math.round(card.x * this.scale),
          y: Math.round(card.y * this.scale),
          width: Math.round(card.width * this.scale),
          height: Math.round(card.height * this.scale),
          backgroundColor: card.backgroundColor
        }
      })
      this.cards = cards
    },
    cardPosition (card) {
      const position = {
        width: card.width + 'px',
        height: card.height + 'px',
        left: card.x + padding + 'px',
        top: card.y + padding + 'px',
        backgroundColor: card.backgroundColor
      }
      return position
    },
    closeAllDialogs () {
      this.$store.dispatch('closeAllDialogs', 'minimap')
    }
  },
  watch: {
    isVisible (value) {
      if (value) {
        this.update()
      }
    }
  }
}
</script>

<style lang="stylus">
.overlay.minimap,
.background
  position fixed
  top 0
  left 0
  width 100vw
  height 100vh
  .background
    background-color var(--primary-background)
    opacity 0.8
  .card
    position absolute
    border-radius 3px
    background-color var(--secondary-background)
</style>
