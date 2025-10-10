<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useHistoryStore } from '@/stores/useHistoryStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const historyStore = useHistoryStore()

let multiTouchAction, shouldCancelUndo

let inertiaScrollEndIntervalTimer, prevPosition

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
})
onBeforeUnmount(() => {
  window.removeEventListener('wheel', handleMouseWheelEvents, { passive: false })
  window.removeEventListener('touchstart', touchStart)
  window.removeEventListener('touchmove', touchMove)
  window.removeEventListener('touchend', touchEnd)
})

const isSpacePage = computed(() => globalStore.isSpacePage)

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
  if (userStore.shouldInvertZoom) {
    invertZoom = !invertZoom
  }
  if (invertZoom) {
    shouldZoomIn = deltaY > 0
    shouldZoomOut = deltaY < 0
  }
  let speed = Math.max(Math.abs(deltaY), 1)
  speed = Math.min(maxSpeed, speed)
  updateZoomOrigin(event)
  globalStore.zoomSpace({ shouldZoomIn, shouldZoomOut, speed })
}

// scroll

const updateZoomOrigin = (event) => {
  const cursor = utils.cursorPositionInPage(event)
  globalStore.updateZoomOrigin(cursor)
}
const scroll = () => {
  if (globalStore.userHasScrolled) { return }
  globalStore.userHasScrolled = true
}

// touch start

const touchStart = (event) => {
  shouldCancelUndo = false
  if (!utils.isMultiTouch(event)) {
    multiTouchAction = null
    return
  }
  globalStore.shouldAddCard = false
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
  globalStore.isTouchScrolling = true
}

// touch end

const touchEnd = () => {
  if (!isSpacePage.value) { return }
  globalStore.isPinchZooming = false
  checkIfInertiaScrollEnd()
  if (shouldCancelUndo) {
    shouldCancelUndo = false
    multiTouchAction = ''
    return
  }
  if (!multiTouchAction) { return }
  if (multiTouchAction === 'undo') {
    historyStore.undo()
    globalStore.addNotification({ message: 'Undo', icon: 'undo' })
  } else if (multiTouchAction === 'redo') {
    historyStore.redo()
    globalStore.addNotification({ message: 'Redo', icon: 'redo' })
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
      globalStore.isTouchScrolling = false
    } else {
      prevPosition = current
    }
  }, 250)
}

// pinch zoom

const toggleIsPinchZooming = (event) => {
  if (utils.shouldIgnoreTouchInteraction(event)) { return }
  globalStore.isPinchZooming = true
}
</script>

<template lang="pug">
</template>

<style lang="stylus">
</style>
