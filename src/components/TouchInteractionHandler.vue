<template lang="pug">
</template>

<script>
import consts from '@/consts.js'
import utils from '@/utils.js'

// let multiTouchAction, shouldCancelUndo
let touchStartZoomValue

export default {
  name: 'TouchInteractionHandler',
  mounted () {
    // window.addEventListener('touchend', this.touchEnd) initiates momentum scroll raf
    window.addEventListener('touchstart', this.touchStart, { passive: false })
    window.addEventListener('touchmove', this.touchMove, { passive: false })
  },
  beforeUnmount () {
    // window.removeEventListener('touchend', this.touchEnd)
    window.removeEventListener('touchstart', this.touchStart, { passive: false })
    window.removeEventListener('touchmove', this.touchMove, { passive: false })
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

    touchStart (event) {
      if (this.shouldIgnore(event)) { return }
      console.log('🌳 start', event)
      event.preventDefault()
      const isMultiTouch = utils.isMultiTouch(event)
      if (isMultiTouch) {
        this.initPinchZoom(event)
      } else {
      }
    },
    touchMove (event) {
      if (this.shouldIgnore(event)) { return }
      event.preventDefault()
      console.log('💦 move')
      const isMultiTouch = utils.isMultiTouch(event)
      if (isMultiTouch) {
        this.pinchZoom(event)
      } else {
      }
    },
    shouldIgnore (event) {
      const element = event.target
      const isDialog = element.closest('dialog')
      const isButton = element.closest('button')
      return isDialog || isButton
    },

    // pinch zoom

    initPinchZoom (event) {
      touchStartZoomValue = this.spaceZoomPercent
    },
    pinchZoom (event) {
      const isPinching = event.touches.length === 2
      if (!isPinching) { return }
      const position = utils.cursorPositionInPage(event)
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
