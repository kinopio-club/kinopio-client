<template lang="pug">
.overlay.minimap(v-if="isVisible" @click="closeAllDialogs")
  .overlay-background(:style="overlayBackgroundStyle")
  .cards(:style="position")
    template(v-for="card in cards")
      .card(:style="cardPosition(card)" :data-card-minimap-id="card.id")
</template>

<script>
import utils from '@/utils.js'

const maxScale = 0.4

export default {
  name: 'ComponentName',
  components: {
  },
  // created () {
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'closeAllDialogs') {
  //       this.closeAllDialogs()
  //     }
  //   })
  // },
  // mounted () {
  // this.update()
  // },
  data () {
    return {
      boundary: {},
      scale: 1,
      cards: [],
      viewport: {}
      // cursors: {}, todo remote and local
    }
  },
  computed: {
    isVisible () { return this.$store.state.minimapIsVisible },
    overlayBackgroundStyle () {
      const backgroundColor = this.$store.state.currentSpace.backgroundTint
      return { backgroundColor }
    },
    position () {
      return {
        transform: `scale(${this.scale})`
      }
    }
  },
  methods: {
    update () {
      this.updateBoundary()
      this.updateScale()
      this.updateViewport()
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
      const squish = 0.05
      let scale = Math.min(scaleX, scaleY)
      scale = Math.min(utils.roundFloat(scale - squish), maxScale)
      this.scale = scale
    },
    updateViewport () {
      const color = this.$store.state.currentUser.color
      let width = this.$store.state.viewportWidth
      let height = this.$store.state.viewportHeight
      let x = window.scrollX
      let y = window.scrollY
      this.viewport = {
        color,
        width: width,
        height: height,
        left: x,
        top: y
      }
      // todo update on scroll
    },
    updateCards () {
      let cards = this.$store.getters['currentCards/all']
      cards = cards.map(card => {
        return {
          id: card.id,
          x: Math.round(card.x),
          y: Math.round(card.y),
          width: Math.round(card.width),
          height: Math.round(card.height),
          backgroundColor: card.backgroundColor
        }
      })
      this.cards = cards
    },
    cardPosition (card) {
      const borderRadius = 1.2
      const position = {
        width: card.width + 'px',
        height: card.height + 'px',
        left: card.x + 'px',
        top: card.y + 'px',
        backgroundColor: card.backgroundColor,
        borderRadius: Math.round(borderRadius / this.scale) + 'px'
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
        // this.closeAllDialogs()
        this.update()
      }
    }
  }
}
</script>

<style lang="stylus">
.overlay.minimap,
.overlay-background
  position fixed
  top 0
  left 0
  width 100vw
  height 100vh
  .overlay-background
    background-color var(--primary-background)
    opacity 0.8
  .cards
    position absolute
    left 0
    padding 20px
  .card
    position absolute
    background-color var(--secondary-background)
</style>
