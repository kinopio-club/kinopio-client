<template lang="pug">
aside.offscreen-markers(:style="styles")
  .marker.topleft(v-if="hasDirectionTopLeft")
  .marker.topright(v-if="hasDirectionTopRight")
  .marker.bottomleft(v-if="hasDirectionBottomLeft")
  .marker.bottomright(v-if="hasDirectionBottomRight")

  .marker.top(v-if="offscreenCardsTop.length" :style="{ left: topMarkerOffset }")
  .marker.left(v-if="offscreenCardsLeft.length" :style="{ top: leftMarkerOffset }")
  .marker.right(v-if="offscreenCardsRight.length" :style="{ top: rightMarkerOffset }")
  .marker.bottom(v-if="offscreenCardsBottom.length" :style="{ left: bottomMarkerOffset }")
</template>

<script>
import utils from '@/utils.js'

const maxIterations = 30
let currentIteration, updatePositionTimer

export default {
  name: 'OffscreenMarkers',
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdatePositionInVisualViewport') {
        currentIteration = 0
        if (updatePositionTimer) { return }
        updatePositionTimer = window.requestAnimationFrame(this.updatePositionFrame)
      }
    })
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
    styles () {
      const viewport = this.viewport
      const pinchZoomScale = viewport.scale
      const pinchZoomOffsetLeft = viewport.offsetLeft
      const pinchZoomOffsetTop = viewport.offsetTop
      let styles = {}
      if (this.$store.state.currentSpace.background) {
        styles.opacity = 1
      } else {
        styles.opacity = 0.5
      }
      if (pinchZoomScale > 1) {
        styles.transform = `translate(${pinchZoomOffsetLeft}px, ${pinchZoomOffsetTop}px) scale(${1 / pinchZoomScale})`
        styles['transform-origin'] = 'left top'
      }
      return styles
    },
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
    updatePositionFrame () {
      currentIteration++
      this.updateOffscreenCards()
      if (currentIteration < maxIterations) {
        window.requestAnimationFrame(this.updatePositionFrame)
      } else {
        window.cancelAnimationFrame(updatePositionTimer)
        updatePositionTimer = undefined
      }
    },
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
        card.x = card.x + (card.width / 2) - (markerWidth / 2)
        card.x = card.x * zoom
        card.y = card.y + (card.height / 2) - (markerHeight / 2)
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
  mix-blend-mode color-burn
  .marker
    width width
    height height
    background-repeat no-repeat
    background-size contain
    position absolute
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
