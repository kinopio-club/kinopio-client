<template lang="pug">
aside.offscreen-markers(v-if="isVisible" :style="styles" :class="{'fade-out': isFadeOut, 'hidden': isHidden}")
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

import debounce from 'lodash-es/debounce'

const offscreenMarkers = new Worker('/web-workers/offscreen-markers.js')

const updatePositionDuration = 10
const fadeOutDuration = 10
const hiddenDuration = 10
let fadeOutIteration, fadeOutTimer, hiddenIteration, hiddenTimer, updatePositionIteration, updatePositionTimer

export default {
  name: 'OffscreenMarkers',
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerUpdatePositionInVisualViewport') {
        this.updatePosition()
      } else if (mutation.type === 'isLoadingSpace') {
        this.updatePosition()
      } else if (mutation.type === 'triggerHideTouchInterface') {
        this.hidden()
      }
    })
    window.addEventListener('scroll', this.debouncedUpdateOffscreenMarkers)
    offscreenMarkers.addEventListener('message', event => {
      this.offscreenCardsByDirection = event.data
    })
    window.addEventListener('scroll', this.handleTouchInteractions)
    window.addEventListener('gesturestart', this.handleTouchInteractions)
    window.addEventListener('gesturechange', this.handleTouchInteractions)
    window.addEventListener('touchend', this.updatePosition)
    visualViewport.addEventListener('resize', this.debouncedUpdateOffscreenMarkers)
  },
  beforeUnmount () {
    window.removeEventListener('scroll', this.handleTouchInteractions)
    window.removeEventListener('gesturestart', this.handleTouchInteractions)
    window.removeEventListener('gesturechange', this.handleTouchInteractions)
    window.removeEventListener('touchend', this.updatePosition)
    visualViewport.removeEventListener('resize', this.debouncedUpdateOffscreenMarkers)
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
      },
      isFadeOut: false,
      isHidden: false
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
    styles () {
      const viewport = this.viewport
      const pinchZoomScale = viewport.scale
      const counterPinchZoomScale = utils.roundFloat(1 / pinchZoomScale)
      const pinchZoomOffsetLeft = viewport.offsetLeft
      const pinchZoomOffsetTop = viewport.offsetTop
      let styles = {}
      if (pinchZoomScale > 1) {
        styles.transform = `translate(${pinchZoomOffsetLeft}px, ${pinchZoomOffsetTop}px) scale(${counterPinchZoomScale})`
        styles['transform-origin'] = 'left top'
      }
      return styles
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

    // hide

    hidden (event) {
      if (!this.$store.getters.isTouchDevice) { return }
      hiddenIteration = 0
      if (hiddenTimer) { return }
      hiddenTimer = window.requestAnimationFrame(this.hiddenFrame)
    },
    hiddenFrame () {
      hiddenIteration++
      this.isHidden = true
      if (hiddenIteration < hiddenDuration) {
        window.requestAnimationFrame(this.hiddenFrame)
      } else {
        this.cancelHidden()
      }
    },
    cancelHidden () {
      window.cancelAnimationFrame(hiddenTimer)
      hiddenTimer = undefined
      this.isHidden = false
    },

    // fade out

    handleTouchInteractions (event) {
      if (!this.$store.getters.isTouchDevice) { return }
      if (utils.shouldIgnoreTouchInteraction(event)) { return }
      this.fadeOut()
      this.updatePosition()
    },
    fadeOut () {
      fadeOutIteration = 0
      if (fadeOutTimer) { return }
      fadeOutTimer = window.requestAnimationFrame(this.fadeOutFrame)
    },
    cancelFadeOut () {
      window.cancelAnimationFrame(fadeOutTimer)
      fadeOutTimer = undefined
      this.isFadeOut = false
      this.cancelUpdatePosition()
      this.updatePosition()
    },
    fadeOutFrame () {
      fadeOutIteration++
      this.isFadeOut = true
      if (fadeOutIteration < fadeOutDuration) {
        window.requestAnimationFrame(this.fadeOutFrame)
      } else {
        this.cancelFadeOut()
      }
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
    updateOffscreenMarkers: debounce(function () {
      this.debouncedUpdateOffscreenMarkers()
    }, 20),
    debouncedUpdateOffscreenMarkers () {
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
