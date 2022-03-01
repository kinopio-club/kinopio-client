<template lang="pug">
aside.offscreen-markers(:style="styles" v-if="!isQuickCapture")
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

const offscreenMarkers = new Worker('/web-workers/offscreen-markers.js')

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
      if (mutation.type === 'isLoadingSpace') {
        this.updateOffscreenMarkers()
      }
    })
    window.addEventListener('scroll', this.updateOffscreenMarkers)
    offscreenMarkers.addEventListener('message', event => {
      this.offscreenCardsByDirection = event.data
    })
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.updateOffscreenMarkers)
  },
  data () {
    return {
      viewport: {},
      offscreenCardsByDirection: {
        top: [],
        left: [],
        right: [],
        bottom: [],
        topleft: [],
        topright: [],
        bottomleft: [],
        bottomright: []
      }
    }
  },
  computed: {
    styles () {
      const viewport = this.viewport
      const pinchZoomScale = viewport.scale
      const pinchZoomOffsetLeft = viewport.offsetLeft
      const pinchZoomOffsetTop = viewport.offsetTop
      let styles = {}
      if (pinchZoomScale > 1) {
        styles.transform = `translate(${pinchZoomOffsetLeft}px, ${pinchZoomOffsetTop}px) scale(${1 / pinchZoomScale})`
        styles['transform-origin'] = 'left top'
      }
      return styles
    },
    isQuickCapture () { return this.$store.state.isQuickCapture },
    spaceZoomDecimal () { return this.$store.getters.spaceZoomDecimal },
    hasDirectionTopLeft () { return this.hasDirection('topleft') },
    hasDirectionTopRight () { return this.hasDirection('topright') },
    hasDirectionBottomLeft () { return this.hasDirection('bottomleft') },
    hasDirectionBottomRight () { return this.hasDirection('bottomright') },
    // top
    offscreenCardsTop () { return this.offscreenCardsByDirection.top },
    topMarkerOffset () {
      let cards = this.offscreenCardsTop
      if (!cards.length) { return }
      cards = cards.map(card => card.x)
      const average = utils.averageOfNumbers(cards)
      return average - this.viewport.pageLeft + 'px'
    },
    // left
    offscreenCardsLeft () { return this.offscreenCardsByDirection.left },
    leftMarkerOffset () {
      let cards = this.offscreenCardsLeft
      if (!cards.length) { return }
      cards = cards.map(card => card.y)
      const average = utils.averageOfNumbers(cards)
      return average - this.viewport.pageTop + 'px'
    },
    // right
    offscreenCardsRight () { return this.offscreenCardsByDirection.right },
    rightMarkerOffset () {
      let cards = this.offscreenCardsRight
      if (!cards.length) { return }
      cards = cards.map(card => card.y)
      const average = utils.averageOfNumbers(cards)
      return average - this.viewport.pageTop + 'px'
    },
    // bottom
    offscreenCardsBottom () { return this.offscreenCardsByDirection.bottom },
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
      this.updateOffscreenMarkers()
      if (currentIteration < maxIterations) {
        window.requestAnimationFrame(this.updatePositionFrame)
      } else {
        window.cancelAnimationFrame(updatePositionTimer)
        updatePositionTimer = undefined
      }
    },
    hasDirection (direction) {
      return Boolean(this.offscreenCardsByDirection[direction].length)
    },
    updateOffscreenMarkers () {
      let cards = this.$store.getters['currentCards/all']
      cards = utils.clone(cards)
      const viewport = utils.visualViewport()
      const zoom = this.spaceZoomDecimal
      offscreenMarkers.postMessage({ cards, viewport, zoom })
      this.viewport = viewport
    }
  },
  watch: {
    spaceZoomDecimal (value) {
      this.updateOffscreenMarkers()
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
  pointer-events none
  z-index 1
  opacity 0.5
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
