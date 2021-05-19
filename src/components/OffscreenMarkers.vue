<template lang="pug">
aside.offscreen-markers
  .marker.top(v-if="offscreenCardsTop.length" :style="{ left: topMarkerOffset }")
  .marker.topleft(v-if="hasDirectionTopLeft")
  .marker.left(v-if="offscreenCardsLeft.length" :style="{ top: leftMarkerOffset }")
  .marker.right(v-if="offscreenCardsRight.length" :style="{ top: rightMarkerOffset }")
  .marker.bottom(v-if="offscreenCardsBottom.length" :style="{ left: bottomMarkerOffset }")
</template>

<script>
import utils from '@/utils.js'

export default {
  name: 'OffscreenMarkers',
  mounted () {
    window.addEventListener('scroll', this.updateOffscreenCards)
    this.updateOffscreenCards()
  },
  data () {
    return {
      offscreenCards: [],
      viewport: {}
    }
  },
  computed: {
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    hasDirectionTopLeft () { return this.hasDirection('topleft') },
    hasDirectionTopRight () { return this.hasDirection('topright') },
    hasDirectionBottomLeft () { return this.hasDirection('bottomleft') },
    hasDirectionBottomRight () { return this.hasDirection('bottomright') },
    // top
    offscreenCardsTop () { return this.offscreenCards.filter(card => card.direction === 'top') },
    topMarkerOffset () {
      let cards = this.offscreenCardsTop
      if (!cards.length) { return }
      cards = cards.map(card => card.x)
      const average = utils.averageOfNumbers(cards)
      return average - this.viewport.pageLeft + 'px'
    },
    // left
    offscreenCardsLeft () { return this.offscreenCards.filter(card => card.direction === 'left') },
    leftMarkerOffset () {
      let cards = this.offscreenCardsLeft
      if (!cards.length) { return }
      cards = cards.map(card => card.y)
      const average = utils.averageOfNumbers(cards)
      return average - this.viewport.pageTop + 'px'
    },
    // right
    offscreenCardsRight () { return this.offscreenCards.filter(card => card.direction === 'right') },
    rightMarkerOffset () {
      let cards = this.offscreenCardsRight
      if (!cards.length) { return }
      cards = cards.map(card => card.y)
      const average = utils.averageOfNumbers(cards)
      return average - this.viewport.pageTop + 'px'
    },
    // bottom
    offscreenCardsBottom () { return this.offscreenCards.filter(card => card.direction === 'bottom') },
    bottomMarkerOffset () {
      let cards = this.offscreenCardsBottom
      if (!cards.length) { return }
      cards = cards.map(card => card.x)
      const average = utils.averageOfNumbers(cards)
      return average - this.viewport.pageLeft + 'px'
    }
  },
  methods: {
    hasDirection (direction) {
      return this.offscreenCards.find(card => {
        return card.direction === direction
      })
    },
    updateOffscreenCards () {
      const markerHeight = 16
      const markerWidth = 12
      const zoom = this.spaceZoomDecimal
      let cards = utils.clone(this.$store.state.currentSpace.cards)
      cards = cards.map(card => {
        const element = document.querySelector(`article [data-card-id="${card.id}"]`)
        const rect = element.getBoundingClientRect()
        card.x = card.x + (rect.width / 2) - (markerWidth / 2)
        card.x = card.x * zoom
        card.y = card.y + (rect.height / 2) - (markerHeight / 2)
        card.y = card.y * zoom
        card.direction = this.direction(card)
        return card
      })
      this.offscreenCards = cards || []
    },
    direction (card) {
      this.viewport = utils.visualViewport()
      const scrollX = this.viewport.pageLeft
      const scrollY = this.viewport.pageTop
      let x = ''
      let y = ''
      //           │        │
      //                       top-right
      //           │  top   │
      //
      // ─ ─ ─ ─ ─ ┼────────┼ ─ ─ ─ ─ ─
      //           │        │
      //    left   │Viewport│  right
      //           │        │
      // ─ ─ ─ ─ ─ ┼────────┼ ─ ─ ─ ─ ─
      //
      //           │ bottom │
      //
      //           │        │

      if (card.y > (this.viewport.height + scrollY)) {
        y = 'bottom'
      } else if (card.y < scrollY) {
        y = 'top'
      }
      if (card.x > (this.viewport.width + scrollX)) {
        x = 'right'
      } else if (card.x < scrollX) {
        x = 'left'
      }
      return y + x
    }
  },
  watch: {
    spaceZoomDecimal (value) {
      this.updateOffscreenCards()
    }
  }
}
</script>

<style lang="stylus">
height = 18px
width = 12px
edge = 4px

.offscreen-markers
  position fixed
  width 100%
  height 100%
  // background-color rgba(255, 193, 93, 0.45)
  .marker
    width width
    height height
    background-repeat no-repeat
    background-size contain
    position absolute
    opacity 0.5
  .top
    top edge
    left "calc(50% -  %s)" % (width / 2)
    transform rotate(90deg)
  .topleft
    top edge
    left edge
    transform rotate(45deg)
  .topright
    top edge
    right edge
    transform rotate(135deg)
  .left
    top "calc(50% -  %s)" % (height / 2)
    left edge
  .right
    top "calc(50% -  %s)" % (height / 2)
    right edge
    transform rotate(180deg)
  .bottom
    bottom edge
    left "calc(50% -  %s)" % (width / 2)
    transform rotate(-90deg)
  .bottomleft
    bottom edge
    left edge
    transform rotate(-45deg)
  .bottomright
    bottom edge
    right edge
    transform rotate(-135deg)
</style>
