<template lang="pug">
.overlay(v-if="isVisible")
  .background(:style="overlayBackgroundStyle")
  .card
//- .minimap(v-if="isVisible")
//-   p blank template, please duplicate
</template>

<script>
// const padding = 100

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
      multiplier: 1,
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
      this.updateMultiplier()
      // this.updateViewportBoundary()
      this.updateCards()
      console.log('🍅', this.boundary, this.multiplier, this.cards)
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
    updateMultiplier () {
      const viewportWidth = this.$store.state.viewportWidth
      const viewportHeight = this.$store.state.viewportHeight
      const multiplierX = viewportWidth / this.boundary.width
      const multiplierY = viewportHeight / this.boundary.height
      let multiplier = Math.min(multiplierX, multiplierY)
      this.multiplier = multiplier
    },
    updateCards () {
      let cards = this.$store.getters['currentCards/all']
      cards = cards.map(card => {
        return {
          id: card.id,
          x: Math.round(card.x * this.multiplier),
          y: Math.round(card.y * this.multiplier),
          width: Math.round(card.width * this.multiplier),
          height: Math.round(card.height * this.multiplier)
        }
      })
      this.cards = cards
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
.overlay,
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
    width 100px
    height 50px
    top 100px
    left 100px
    border-radius 3px
    background-color #e3e3e3
</style>
