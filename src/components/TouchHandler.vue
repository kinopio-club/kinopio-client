<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

let multiTouchAction, shouldCancelUndo

let inertiaScrollEndIntervalTimer, prevPosition

onMounted(() => {
  window.addEventListener('touchstart', touchStart)
  window.addEventListener('touchmove', touchMove)
  window.addEventListener('touchend', touchEnd)
})
onBeforeUnmount(() => {
  window.removeEventListener('touchstart', touchStart)
  window.removeEventListener('touchmove', touchMove)
  window.removeEventListener('touchend', touchEnd)
})

const isSpacePage = computed(() => store.getters.isSpacePage)

// touch start

const touchStart = (event) => {
  shouldCancelUndo = false
  if (!utils.isMultiTouch(event)) {
    multiTouchAction = null
    return
  }
  store.commit('shouldAddCard', false)
  const touches = event.touches.length
  if (touches >= 2) {
    toggleIsPinchZooming(event)
  }
  // undo/redo
  if (touches === 2) {
    multiTouchAction = 'undo'
  } else if (touches === 3) {
    multiTouchAction = 'redo'
  }
}

// touch move

const touchMove = (event) => {
  const isFromDialog = event.target.closest('dialog')
  if (isFromDialog) { return }
  shouldCancelUndo = true
  store.commit('isTouchScrolling', true)
}

// touch end

const touchEnd = () => {
  if (!isSpacePage.value) { return }
  store.commit('isPinchZooming', false)
  checkIfInertiaScrollEnd()
  if (shouldCancelUndo) {
    shouldCancelUndo = false
    multiTouchAction = ''
    return
  }
  if (!multiTouchAction) { return }
  if (multiTouchAction === 'undo') {
    store.dispatch('history/undo')
    store.commit('addNotification', { message: 'Undo', icon: 'undo' })
  } else if (multiTouchAction === 'redo') {
    store.dispatch('history/redo')
    store.commit('addNotification', { message: 'Redo', icon: 'redo' })
  }
  multiTouchAction = null
}
const checkIfInertiaScrollEnd = () => {
  if (!utils.isAndroid) { return }
  if (inertiaScrollEndIntervalTimer) { return }
  prevPosition = null
  inertiaScrollEndIntervalTimer = setInterval(() => {
    const viewport = utils.visualViewport()
    const current = {
      left: viewport.offsetLeft,
      top: viewport.offsetTop
    }
    if (!prevPosition) {
      prevPosition = current
    } else if (prevPosition.left === current.left && prevPosition.top === current.top) {
      clearInterval(inertiaScrollEndIntervalTimer)
      inertiaScrollEndIntervalTimer = null
      store.commit('isTouchScrolling', false)
    } else {
      prevPosition = current
    }
  }, 250)
}

// pinch zoom

const toggleIsPinchZooming = (event) => {
  if (utils.shouldIgnoreTouchInteraction(event)) { return }
  store.commit('isPinchZooming', true)
}

</script>

<template lang="pug">
</template>

<style lang="stylus">
</style>
