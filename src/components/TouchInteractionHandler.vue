<template lang="pug">
</template>

<script>
import utils from '@/utils.js'

import { mapState } from 'vuex'
import isEqual from 'lodash-es/isEqual'

let touchStartZoomValue

let wasZoomed, startCursor, prevCursor, currentCursor, prevTimeStamp, scrollDelta, velocity
let touches = []

export default {
  name: 'TouchInteractionHandler',
  mounted () {
    window.addEventListener('touchstart', this.touchStart, { passive: false })
    window.addEventListener('touchmove', this.touchMove, { passive: false })
    window.addEventListener('touchend', this.touchEnd, { passive: false })
  },
  beforeUnmount () {
    // window.removeEventListener('touchend', this.touchEnd)
    window.removeEventListener('touchstart', this.touchStart, { passive: false })
    window.removeEventListener('touchmove', this.touchMove, { passive: false })
    window.removeEventListener('touchend', this.touchEnd, { passive: false })
  },
  computed: {
    ...mapState([
      'spaceZoomPercent',
      'currentUserIsDraggingBox',
      'currentUserIsDraggingCard',
      'currentUserIsPaintingLocked',
      'currentUserIsDrawingConnection',
      'currentUserIsResizingCard',
      'touchScrollOrigin'
    ])
  },
  methods: {
    cursorPositionInPage (event) {
      return {
        x: event.pageX,
        y: event.pageY
      }
    },
    touchStart (event) {
      if (this.shouldPreventMultiTouchAction(event)) {
        event.preventDefault()
        return
      }
      if (this.shouldIgnore(event)) { return }
      startCursor = this.cursorPositionInPage(event)
      prevCursor = startCursor
      currentCursor = startCursor
      this.$store.commit('isTouchScrollingOrPinchZooming', true) // fades out header, footer
      // this.cancelMomentum() timer, shouldCancelMomentum = true
      const isMultiTouch = utils.isMultiTouch(event)
      if (isMultiTouch) {
        this.startPinchZoom(event)
      }
    },
    touchMove (event) {
      if (this.shouldPreventMultiTouchAction(event)) {
        event.preventDefault()
        return
      }
      if (this.shouldIgnore(event)) { return }
      event.preventDefault()
      currentCursor = this.cursorPositionInPage(event)
      prevTimeStamp = event.timeStamp
      const isMultiTouch = utils.isMultiTouch(event)
      if (isMultiTouch) {
        this.pinchZoom(event)
      } else {
        this.scroll(event)
      }
    },
    touchEnd (event) {
      if (this.shouldIgnore(event)) { return }
      event.preventDefault()
      this.$store.commit('isTouchScrollingOrPinchZooming', false)
      this.startMomentum(event)
      this.checkIfTouchIsUndoOrRedo()
      touches = []
      wasZoomed = false
    },
    shouldIgnore (event) {
      const element = event.target
      const isDialog = element.closest('dialog')
      const isButton = element.closest('button')
      const isDraggingItem = this.currentUserIsDraggingBox || this.currentUserIsDraggingCard
      const preventInteractions = this.currentUserIsPaintingLocked || this.currentUserIsResizingCard || this.currentUserIsDrawingConnection
      return isDialog || isButton || isDraggingItem || preventInteractions
    },
    shouldPreventMultiTouchAction (event) {
      const isMultiTouch = utils.isMultiTouch(event)
      if (!isMultiTouch) { return }
      let isDialog, isButton
      const touchesKeys = Object.keys(event.touches)
      touchesKeys.forEach(key => touches.push(event.touches[key]))
      touches.forEach(touch => {
        isDialog = touch.target.closest('dialog')
        isButton = touch.target.closest('button')
      })

      return isDialog || isButton
    },

    // Undo and redo

    checkIfTouchIsUndoOrRedo () {
      const cursorIsUnchanged = isEqual(currentCursor, startCursor)
      if (!cursorIsUnchanged) { return }
      if (touches.length === 2) {
        this.$store.dispatch('history/undo')
        this.$store.commit('addNotificationWithPosition', { message: 'Undo', position: currentCursor, type: 'success', layer: 'app', icon: 'undo' })
      } else if (touches.length === 3) {
        this.$store.dispatch('history/redo')
        this.$store.commit('addNotificationWithPosition', { message: 'Redo', position: currentCursor, type: 'success', layer: 'app', icon: 'redo' })
      }
    },

    // touch scroll

    scroll (event) {
      scrollDelta = {
        x: currentCursor.x - prevCursor.x,
        y: currentCursor.y - prevCursor.y
      }
      const prevScrollBy = this.touchScrollOrigin
      const scrollBy = {
        x: prevScrollBy.x + scrollDelta.x,
        y: prevScrollBy.y + scrollDelta.y
      }
      this.$store.commit('touchScrollOrigin', scrollBy)
      prevCursor = currentCursor
      this.$store.commit('shouldAddCard', false)
    },

    // pinch zoom

    startPinchZoom (event) {
      wasZoomed = true
      touchStartZoomValue = this.spaceZoomPercent
    },
    pinchZoom (event) {
      const isPinching = event.touches.length === 2
      if (!isPinching) { return }
      this.updateZoom(event)
    },
    updateZoom (event) {
      wasZoomed = true
      let percent = event.scale * touchStartZoomValue
      this.$store.dispatch('spaceZoomPercent', percent)
      const position = this.cursorPositionInPage(event)
      this.$store.commit('zoomOrigin', position)
    },

    startMomentum (event) {
      if (wasZoomed) { return }
      const time = Math.round(prevTimeStamp - event.timeStamp)
      if (!time) { return }
      velocity = {
        x: scrollDelta.x / time,
        y: scrollDelta.y / time
      }
      console.log('💦', velocity)

      // When the mouse/touch is released, check to see if the last timestamp is recent enough (I use 0.3 seconds).
      // If so, set a variable inertialVelocity to the last calculated velocity; otherwise set it to 0 to prevent scrolling if the user carefully selected a position.
      // start RAF momentumScroll: Then on every update (either through a timer, or each render call, depending on how you're rendering),

      //   // velocity is amount of movement divided by the time since the last frame
      //   // velocity = {
      //   //   x: delta.x / frameTime,
      //   //   y: delta.y / frameTime,
      //   // }
      // },
    },
    momentumFrame () {
      // scroll by inertialVelocity * INERTIA_SCROLL_FACTOR (I use 0.9) and multiply inertialVelocity by INERTIA_ACCELERATION (I use 0.98).
    }
    // cancelMomentum () {
    // },

  }
}
</script>
