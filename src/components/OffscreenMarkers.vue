<template lang="pug">
aside.offscreen-markers(v-if="isVisible")
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

const updatePositionDuration = 10
let updatePositionIteration, updatePositionTimer

export default {
  name: 'OffscreenMarkers',
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdateOffscreenMarkers') {
        this.updateOffscreenMarkers()
      } else if (mutation.type === 'isLoadingSpace') {
        this.updateOffscreenMarkers()
      }
    })
    window.addEventListener('scroll', this.updateOffscreenMarkers)
    window.addEventListener('scroll', this.handleTouchInteractions)
    window.addEventListener('gesturestart', this.handleTouchInteractions)
    window.addEventListener('gesturechange', this.handleTouchInteractions)
    window.addEventListener('touchend', this.updatePosition)
    visualViewport.addEventListener('resize', this.updateOffscreenMarkers)
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.handleTouchInteractions)
    window.removeEventListener('gesturestart', this.handleTouchInteractions)
    window.removeEventListener('gesturechange', this.handleTouchInteractions)
    window.removeEventListener('touchend', this.updatePosition)
    visualViewport.removeEventListener('resize', this.updateOffscreenMarkers)
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
    isVisible () {
      if (this.isAddPage) { return }
      const isTouchDevice = this.$store.getters.isTouchDevice
      if (!isTouchDevice) {
        return true
      }
      let isVisible = true
      if (this.dialogsVisible) { isVisible = false }
      return isVisible
    },
    dialogsVisible () {
      return Boolean(this.$store.state.cardDetailsIsVisibleForCardId || this.$store.state.multipleSelectedActionsIsVisible || this.$store.state.connectionDetailsIsVisibleForConnectionId)
    },
    isAddPage () { return this.$store.state.isAddPage },
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
    hasDirection (direction) {
      return Boolean(this.offscreenCardsByDirection[direction].length)
    },

    // update position

    updatePosition () {
      updatePositionIteration = 0
      if (updatePositionTimer) { return }
      updatePositionTimer = window.requestAnimationFrame(this.updatePositionFrame)
    },
    cancelUpdatePosition () {
      window.cancelAnimationFrame(updatePositionTimer)
      updatePositionTimer = undefined
    },
    updatePositionFrame () {
      updatePositionIteration++
      this.updateOffscreenMarkers()
      if (updatePositionIteration < updatePositionDuration) {
        window.requestAnimationFrame(this.updatePositionFrame)
      } else {
        this.cancelUpdatePosition()
      }
    },

    // calculate offscreen markers

    zoomedViewport () {
      const viewport = utils.visualViewport()
      const zoom = this.$store.getters.spaceCounterZoomDecimal || 1
      const space = document.getElementById('space')
      if (!space) { return }
      const spaceRect = space.getBoundingClientRect()
      const zoomedViewport = {
        height: Math.round(viewport.height * zoom),
        width: Math.round(viewport.width * zoom),
        scrollX: -Math.round(spaceRect.x * zoom),
        scrollY: -Math.round(spaceRect.y * zoom)
      }
      return zoomedViewport
    },
    normalizeCardsByDirection () {
      const viewport = this.zoomedViewport()
      const cards = this.$store.getters['currentCards/all']
      let normalizedCards = {
        top: [],
        left: [],
        right: [],
        bottom: [],
        topleft: [],
        topright: [],
        bottomleft: [],
        bottomright: []
      }
      cards.forEach(card => {
        //           │        │  top-right
        //           │  top   │
        // ──────────┼────────┼───────────
        //           │        │
        //    left   │Viewport│  right
        //           │        │
        // ──────────┼────────┼───────────
        //           │ bottom │
        //           │        │
        let x = ''
        let y = ''
        if (card.y > (viewport.height + viewport.scrollY)) {
          y = 'bottom'
        } else if (card.y < viewport.scrollY) {
          y = 'top'
        }
        if (card.x > (viewport.width + viewport.scrollX)) {
          x = 'right'
        } else if (card.x < viewport.scrollX) {
          x = 'left'
        }
        const direction = y + x
        if (direction) {
          normalizedCards[direction].push(card)
        }
      })
      return normalizedCards
    },
    updateOffscreenMarkers () {
      const cards = this.normalizeCardsByDirection()
      this.offscreenCardsByDirection = cards
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
  transition 0.2s all
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
