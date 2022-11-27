<template lang="pug">
</template>

<script>
// import utils from '@/utils.js'

// let multiTouchAction, shouldCancelUndo

export default {
  name: 'TouchInteractionHandler',
  created () {
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'closeAllDialogs') {
  //       this.closeAllDialogs()
  //     }
  //   })
  },
  mounted () {
    // window.addEventListener('touchstart', this.touchStart)
    // window.addEventListener('touchmove', this.touchMove)
    // window.addEventListener('touchend', this.touchEnd)
  },
  beforeUnmount () {
    // window.removeEventListener('touchstart', this.touchStart)
    // window.removeEventListener('touchmove', this.touchMove)
    // window.removeEventListener('touchend', this.touchEnd)
  },
  data () {
    return {
    }
  },
  computed: {
    // kinopioDomain () { return utils.kinopioDomain() },
  },
  methods: {

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
