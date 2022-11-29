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
    // window.addEventListener('touchstart', this.touchStart)
    // window.addEventListener('touchmove', this.touchMove)
    // window.addEventListener('touchend', this.touchEnd)
    window.addEventListener('touchmove', this.pinchZoom, { passive: false })
    window.addEventListener('touchstart', this.initPinchZoom, { passive: false })
  },
  beforeUnmount () {
    // window.removeEventListener('touchstart', this.touchStart)
    // window.removeEventListener('touchmove', this.touchMove)
    // window.removeEventListener('touchend', this.touchEnd)
    window.removeEventListener('touchmove', this.pinchZoom, { passive: false })
    window.removeEventListener('touchstart', this.initPinchZoom, { passive: false })
  },
  data () {
    return {
    }
  },
  computed: {
    // https://raw.githubusercontent.com/kinopio-club/kinopio-client/5026c48ad4a3801fed3018eb42cb63f481ec560d/src/components/SpaceZoom.vue?token=GHSAT0AAAAAAB26SPJ43YH3LGDYLK2V4XNAY4FF2OA
    spaceZoomPercent () { return this.$store.state.spaceZoomPercent },
    max () { return consts.spaceZoom.max }, // 100
    min () { return consts.spaceZoom.min } // 40

  },
  methods: {

    // pinch zoom

    initPinchZoom (event) {
      if (!utils.isMultiTouch(event)) { return }
      event.preventDefault()
      touchStartZoomValue = this.spaceZoomPercent
    },
    pinchZoom (event) {
      if (!utils.isMultiTouch(event)) { return }
      event.preventDefault()
      const isPinching = event.touches.length === 2
      if (!isPinching) { return }
      const position = utils.cursorPositionInPage(event)
      this.$store.commit('zoomOrigin', position)
      const percent = event.scale * touchStartZoomValue
      this.updateZoom(percent)
    },

    updateZoom (percent) {
      // if (percent > this.max) {
      //   this.animateJiggleRight = true
      // } else if (percent < this.min) {
      //   this.animateJiggleLeft = true
      // }
      percent = Math.max(percent, this.min)
      percent = Math.min(percent, this.max)
      this.$store.commit('spaceZoomPercent', percent)
    }

    // sets store isPinchZooming, isTouchScrolling. to be used by footer and header

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
