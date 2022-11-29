<template lang="pug">
</template>

<script>
import consts from '@/consts.js'
import utils from '@/utils.js'

// let multiTouchAction, shouldCancelUndo
let touchStartZoomValue

// timestamp
// let velocity
let startCursor, currentCursor

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
  data () {
    return {
    }
  },
  computed: {
    spaceZoomPercent () { return this.$store.state.spaceZoomPercent },
    max () { return consts.spaceZoom.max }, // 100
    min () { return consts.spaceZoom.min } // 40
  },
  methods: {
    cursorPositionInPage (event) {
      return {
        x: event.pageX,
        y: event.pageY
      }
    },
    touchStart (event) {
      if (this.shouldIgnore(event)) { return }
      event.preventDefault()
      startCursor = this.cursorPositionInPage(event)
      console.log('🐢 start, update cursors', startCursor.y)
      // this.cancelMomentum() shouldCancelMomentum = true
      const isMultiTouch = utils.isMultiTouch(event)
      if (isMultiTouch) {
        this.initPinchZoom(event)
      }
    },
    touchMove (event) {
      if (this.shouldIgnore(event)) { return }
      event.preventDefault()
      currentCursor = this.cursorPositionInPage(event)
      console.log('🍓 touchmove, update pos y', currentCursor.y)
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
      console.log('🍇 end', event)
    },
    shouldIgnore (event) {
      const element = event.target
      const isDialog = element.closest('dialog')
      const isButton = element.closest('button')
      const isDraggingItem = this.$store.state.currentUserIsDraggingBox || this.$store.state.currentUserIsDraggingCard
      console.log(isDraggingItem) // TODO bug fix dragging cards shouldn't scroll, shouldn't scroll when connecting either
      return isDialog || isButton || isDraggingItem
    },

    // swipe scroll

    scroll (event) {
      // const delta = {
      //   x: currentCursor.x - startCursor.x,
      //   y: currentCursor.y - startCursor.y
      // }
      const position = this.cursorPositionInPage(event)
      this.$store.commit('zoomOrigin', position) // TODO make something better
    },

    //   // velocity is amount of movement divided by the time since the last frame
    //   // velocity = {
    //   //   x: delta.x / frameTime,
    //   //   y: delta.y / frameTime,
    //   // }
    // },
    startMomentum (event) {
      // When the mouse/touch is released, check to see if the last timestamp is recent enough (I use 0.3 seconds).
      // If so, set a variable inertialVelocity to the last calculated velocity; otherwise set it to 0 to prevent scrolling if the user carefully selected a position.
      // start RAF momentumScroll: Then on every update (either through a timer, or each render call, depending on how you're rendering),
    },
    momentum () {
      // scroll by inertialVelocity * INERTIA_SCROLL_FACTOR (I use 0.9) and multiply inertialVelocity by INERTIA_ACCELERATION (I use 0.98).
    },
    // cancelMomentum () {
    // },

    // pinch zoom

    initPinchZoom (event) {
      touchStartZoomValue = this.spaceZoomPercent
    },
    pinchZoom (event) {
      const isPinching = event.touches.length === 2
      if (!isPinching) { return }
      const position = this.cursorPositionInPage(event)
      this.$store.commit('zoomOrigin', position)
      const percent = event.scale * touchStartZoomValue
      this.updateZoom(percent)
    },
    updateZoom (percent) {
      percent = Math.max(percent, this.min)
      percent = Math.min(percent, this.max)
      this.$store.commit('spaceZoomPercent', percent)
    }

    // sets store isPinchZooming, isTouchScrolling. to be used by footer and header = should still use?

    // touchStart (event) {

    // if checkIfShouldCancelUndoOrRedo() return

    //   shouldCancelUndo = false
    //   if (!utils.isMultiTouch(event)) {
    //     multiTouchAction = null
    //     return
    //   }

    //   this.$store.commit('shouldAddCard', false)
    //   const touches = event.touches.length
    //   if (touches >= 2) {
    //     this.toggleIsPinchZooming(event)
    //   }
    //   // undo/redo
    //   if (touches === 2) {
    //     multiTouchAction = 'undo'
    //   } else if (touches === 3) {
    //     multiTouchAction = 'redo'
    //   }
    // },
    // touchMove (event) {
    //   const isFromDialog = event.target.closest('dialog')
    //   if (isFromDialog) { return }
    //   shouldCancelUndo = true
    //   this.isTouchScrolling = true
    // },

    // touchEnd () {
    //   if (this.$store.state.isAddPage) { return }
    //   this.isPinchZooming = false
    //   this.checkIfInertiaScrollEnd()

    // checkIfTouchIsUndoOrRedo()

    //   if (shouldCancelUndo) {
    //     shouldCancelUndo = false
    //     multiTouchAction = ''
    //     return
    //   }
    //   if (!multiTouchAction) { return }
    //   if (multiTouchAction === 'undo') {
    //     this.$store.dispatch('history/undo')
    //     this.$store.commit('addNotification', { message: 'Undo', icon: 'undo' })
    //   } else if (multiTouchAction === 'redo') {
    //     this.$store.dispatch('history/redo')
    //     this.$store.commit('addNotification', { message: 'Redo', icon: 'redo' })
    //   }
    //   multiTouchAction = null
    // },

  }
}
</script>
