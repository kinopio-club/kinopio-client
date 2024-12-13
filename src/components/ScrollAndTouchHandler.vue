<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()

let multiTouchAction, shouldCancelUndo

let inertiaScrollEndIntervalTimer, prevPosition

let unsubscribe

onMounted(() => {
  window.addEventListener('wheel', handleMouseWheelEvents, { passive: false })
  // use timer to prevent being fired from page reload scroll
  // https://stackoverflow.com/questions/34095038/on-scroll-fires-automatically-on-page-refresh
  setTimeout(() => {
    window.addEventListener('scroll', scroll)
  }, 100)
  window.addEventListener('touchstart', touchStart)
  window.addEventListener('touchmove', touchMove)
  window.addEventListener('touchend', touchEnd)
  window.addEventListener('mousemove', mouseMove)
  window.addEventListener('mouseup', mouseUp)
  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerPanningStart') {
      shouldStartPanning = true
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('wheel', handleMouseWheelEvents, { passive: false })
  window.removeEventListener('touchstart', touchStart)
  window.removeEventListener('touchmove', touchMove)
  window.removeEventListener('touchend', touchEnd)
  window.removeEventListener('mousemove', mouseMove)
  window.removeEventListener('mouseup', mouseUp)
  unsubscribe()
})

const isSpacePage = computed(() => store.getters.isSpacePage)

// wheel

const handleMouseWheelEvents = (event) => {
  const min = consts.spaceZoom.min
  const max = consts.spaceZoom.max
  const maxSpeed = 10 // windows deltaY fix
  const isMeta = event.metaKey || event.ctrlKey // event.ctrlKey is true for trackpad pinch
  if (!isMeta) { return }
  event.preventDefault()
  const deltaY = event.deltaY
  let shouldZoomIn = deltaY < 0
  let shouldZoomOut = deltaY > 0
  let invertZoom = event.webkitDirectionInvertedFromDevice
  if (store.state.currentUser.shouldInvertZoom) {
    invertZoom = !invertZoom
  }
  if (invertZoom) {
    shouldZoomIn = deltaY > 0
    shouldZoomOut = deltaY < 0
  }
  let speed = Math.max(Math.abs(deltaY), 1)
  speed = Math.min(maxSpeed, speed)
  updateZoomOrigin(event)
  store.dispatch('zoomSpace', { shouldZoomIn, shouldZoomOut, speed })
}

// scroll

const updateZoomOrigin = (event) => {
  const cursor = utils.PositionInPage(event)
  store.dispatch('zoomOrigin', cursor)
}
const scroll = () => {
  if (store.state.userHasScrolled) { return }
  store.commit('userHasScrolled', true)
}

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

// mouse events

const mouseUp = () => {
  shouldCancelPanningTimer = true
}
const mouseMove = (event) => {
  // panning triggered in KeyboardShortcutsHandler
  if (store.state.currentUserIsPanning) {
    event.preventDefault()
    updatePanningPosition(event)
    initPanning(event)
  }
}

// panning

let shouldStartPanning, startPosition, currentPosition, panningTimer, shouldCancelPanningTimer, panningDelta, shouldPanNextFrame

const updatePanningPosition = (event) => {
  const position = utils.cursorPositionInPage(event)
  if (startPosition) {
    panningDelta = {
      x: startPosition.x - position.x,
      y: startPosition.y - position.y
    }
    shouldPanNextFrame = true
  }
}
const initPanning = (event) => {
  const position = utils.cursorPositionInPage(event)
  if (shouldStartPanning) {
    startPosition = position
    shouldStartPanning = false
    shouldCancelPanningTimer = false
    panningTimer = window.requestAnimationFrame(panningFrame)
  }
}
const panningFrame = () => {
  if (shouldPanNextFrame) {
    window.scrollBy(panningDelta.x, panningDelta.y, 'instant')
    shouldPanNextFrame = false
  }
  panningTimer = window.requestAnimationFrame(panningFrame)
  if (shouldCancelPanningTimer) {
    window.cancelAnimationFrame(panningTimer)
    panningTimer = null
    startPosition = null
  }
}

</script>

<template lang="pug">
</template>

<style lang="stylus">
</style>
