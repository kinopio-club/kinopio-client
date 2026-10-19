<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useCardStore } from '@/stores/useCardStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useLineStore } from '@/stores/useLineStore'
import { useListStore } from '@/stores/useListStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

import debounce from 'lodash-es/debounce'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const historyStore = useHistoryStore()
const cardStore = useCardStore()
const boxStore = useBoxStore()
const lineStore = useLineStore()
const listStore = useListStore()

// touch panning momentum, similar to native ios scroll deceleration
const momentumDeceleration = 0.998 // per ms
const momentumMinVelocity = 0.02 // px per ms
const momentumMaxVelocity = 8 // px per ms
const momentumMaxIdleTime = 100 // ms, pausing before release doesn't fling

let multiTouchAction, shouldCancelUndo

let touchGesture, touchesCount, panVelocity, momentumTimer, prevMomentumTime

onMounted(() => {
  utils.disablePinchZoom()
  window.addEventListener('wheel', handleMouseWheelEvents, { passive: false })
  // use timer to prevent being fired from page reload scroll
  // https://stackoverflow.com/questions/34095038/on-scroll-fires-automatically-on-page-refresh
  setTimeout(() => {
    window.addEventListener('scroll', scroll)
  }, 100)
  window.addEventListener('touchstart', touchStart)
  window.addEventListener('touchmove', touchMove, { passive: false })
  window.addEventListener('touchend', touchEnd)
  window.addEventListener('touchcancel', touchCancel)
  // safari pinch zoom
  window.addEventListener('gesturestart', preventGesture, { passive: false })
  window.addEventListener('gesturechange', preventGesture, { passive: false })
})
onBeforeUnmount(() => {
  utils.enablePinchZoom()
  window.removeEventListener('wheel', handleMouseWheelEvents, { passive: false })
  window.removeEventListener('touchstart', touchStart)
  window.removeEventListener('touchmove', touchMove, { passive: false })
  window.removeEventListener('touchend', touchEnd)
  window.removeEventListener('touchcancel', touchCancel)
  window.removeEventListener('gesturestart', preventGesture, { passive: false })
  window.removeEventListener('gesturechange', preventGesture, { passive: false })
  cancelMomentum()
})

const isSpacePage = computed(() => globalStore.isSpacePage)

// wheel

const handleMouseWheelEvents = (event) => {
  const min = consts.spaceZoom.min
  const max = consts.spaceZoom.max
  const maxSpeed = 10 // windows deltaY fix
  const isMeta = event.metaKey || event.ctrlKey // event.ctrlKey is true for trackpad pinch
  if (!isMeta) {
    moveDraggingItemsWithScroll(event)
    resizeItemsWithScroll(event)
    return
  }
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
  const origin = { x: event.clientX, y: event.clientY }
  globalStore.zoomSpace({ shouldZoomIn, shouldZoomOut, speed, origin })
}

// items being dragged should follow wheel/trackpad scroll panning
const moveDraggingItemsWithScroll = (event) => {
  const isDraggingItem = (
    globalStore.currentUserIsDraggingCard ||
    globalStore.currentUserIsDraggingBox ||
    globalStore.currentUserIsDraggingLine ||
    globalStore.currentUserIsDraggingList
  )
  if (!isDraggingItem) { return }
  const delta = {
    x: event.deltaX,
    y: event.deltaY
  }
  cardStore.moveCards({ delta })
  boxStore.moveBoxes({ delta })
  lineStore.moveLines({ delta })
  listStore.moveLists({ delta })
}
// items being resized should grow/shrink with wheel/trackpad scroll panning
const resizeItemsWithScroll = (event) => {
  const isResizingItem = (
    globalStore.currentUserIsResizingBox ||
    globalStore.currentUserIsResizingCard ||
    globalStore.currentUserIsResizingList
  )
  if (!isResizingItem) { return }
  const zoom = globalStore.getSpaceCounterZoomDecimal
  const delta = {
    x: Math.round(event.deltaX * zoom),
    y: Math.round(event.deltaY * zoom)
  }
  if (globalStore.currentUserIsResizingBox) {
    boxStore.resizeBoxes(globalStore.currentUserIsResizingBoxIds, delta)
  } else if (globalStore.currentUserIsResizingCard) {
    cardStore.resizeCards(globalStore.currentUserIsResizingCardIds, delta.x)
  } else if (globalStore.currentUserIsResizingList) {
    listStore.resizeLists(globalStore.currentUserIsResizingListIds, delta)
  }
  globalStore.updatePageSizes()
}

// scroll

const scroll = () => {
  updatePrevSpacePagePosition()
  if (globalStore.userHasScrolled) { return }
  globalStore.userHasScrolled = true
}
const updatePrevSpacePagePosition = debounce(() => {
  if (globalStore.isLoadingSpace) { return }
  globalStore.updatePrevSpacePagePosition(spaceStore.id)
}, 250)

// touch start

const touchStart = (event) => {
  // tapping to stop momentum shouldn't add a card
  if (momentumTimer) {
    globalStore.shouldAddCard = false
  }
  cancelMomentum()
  updateTouchGesture(event)
  shouldCancelUndo = false
  if (!utils.isMultiTouch(event)) {
    multiTouchAction = null
    return
  }
  globalStore.shouldAddCard = false
  const touches = event.touches.length
  // undo/redo
  if (touches === 2) {
    multiTouchAction = 'undo'
  } else if (touches === 3) {
    multiTouchAction = 'redo'
  }
}

// touch move

const touchMove = (event) => {
  if (!isSpacePage.value) { return }
  // touches already handled by an item, slider, or drawing
  const isHandled = event.defaultPrevented
  if (utils.isMultiTouch(event)) {
    event.preventDefault() // disable native pinch zoom
  }
  shouldCancelUndo = true // moving fingers isn't a multi-touch tap
  if (!touchGesture) { return }
  event.preventDefault() // disable native swipe scrolling
  const prevPosition = touchGesture.position
  const position = touchesCenter(event.touches)
  const delta = {
    x: prevPosition.x - position.x,
    y: prevPosition.y - position.y
  }
  const elapsedTime = event.timeStamp - touchGesture.timeStamp
  touchGesture.position = position
  touchGesture.timeStamp = event.timeStamp
  if (isHandled || isInteracting()) {
    panVelocity = null
    return
  }
  if (utils.isMultiTouch(event)) {
    pinchZoomSpace(event, prevPosition, delta)
  } else {
    panSpace(delta, elapsedTime)
  }
}
const isInteracting = () => {
  return (
    globalStore.getIsInteractingWithItem ||
    globalStore.getIsInteractingWithConnection ||
    globalStore.currentUserIsDraggingLine ||
    globalStore.currentUserIsTiltingCard ||
    globalStore.currentUserIsPaintSelecting ||
    globalStore.currentUserIsBoxSelecting ||
    globalStore.currentUserIsDrawing
  )
}

// touch end

const touchEnd = (event) => {
  checkIfShouldStartMomentum(event)
  updateTouchGesture(event)
  if (!isSpacePage.value) { return }
  globalStore.isPinchZooming = false
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
const touchCancel = (event) => {
  globalStore.isPinchZooming = false
  globalStore.isTouchScrolling = false
  multiTouchAction = null
  updateTouchGesture(event)
}

// touch gesture
// native swipe scrolling and pinch zooming are replaced with desktop panning and space zooming

const touchesCenter = (touches) => {
  const center = { x: 0, y: 0 }
  Array.from(touches).forEach(touch => {
    center.x += touch.clientX / touches.length
    center.y += touch.clientY / touches.length
  })
  return center
}
const touchesDistance = (touches) => {
  const start = { x: touches[0].clientX, y: touches[0].clientY }
  const end = { x: touches[1].clientX, y: touches[1].clientY }
  return utils.distanceBetweenTwoPoints(start, end)
}
// touches that start in dialogs keep native scrolling
const isTouchGestureFromSpace = (event) => {
  if (!isSpacePage.value) { return }
  const isFromDialog = event.target.closest('dialog')
  const isFromMinimap = event.target.closest('.minimap-canvas-wrap')
  return !isFromDialog && !isFromMinimap
}
// restart the gesture from current touches whenever a finger is added or lifted, so the space doesn't jump
const updateTouchGesture = (event) => {
  const touches = event.touches
  touchesCount = touches.length
  panVelocity = null
  if (!touches.length) {
    touchGesture = null
    return
  }
  // fingers can land together in a single touchstart
  const isNewGesture = event.type === 'touchstart' && touches.length === event.changedTouches.length
  if (isNewGesture) {
    touchGesture = null
    if (!isTouchGestureFromSpace(event)) { return }
    touchGesture = {}
  }
  if (!touchGesture) { return }
  touchGesture.position = touchesCenter(touches)
  touchGesture.timeStamp = event.timeStamp
  if (touches.length > 1) {
    touchGesture.distance = touchesDistance(touches)
    touchGesture.zoomPercent = globalStore.spaceZoomPercent
  }
}
const preventGesture = (event) => {
  if (!isSpacePage.value) { return }
  if (!touchesCount) { return } // trackpad gestures in desktop safari
  event.preventDefault()
}

// pan

const panSpace = (delta, elapsedTime) => {
  globalStore.isTouchScrolling = true
  window.scrollBy({ left: delta.x, top: delta.y, behavior: 'instant' })
  if (!elapsedTime) { return }
  const clampVelocity = (value) => {
    return Math.max(Math.min(value, momentumMaxVelocity), -momentumMaxVelocity)
  }
  const velocity = {
    x: clampVelocity(delta.x / elapsedTime),
    y: clampVelocity(delta.y / elapsedTime)
  }
  panVelocity = panVelocity || velocity
  // smooth out uneven touchmove intervals
  panVelocity = {
    x: (panVelocity.x * 0.2) + (velocity.x * 0.8),
    y: (panVelocity.y * 0.2) + (velocity.y * 0.8)
  }
}

// pinch zoom

const pinchZoomSpace = async (event, prevPosition, delta) => {
  if (!globalStore.isPinchZooming) {
    globalStore.isPinchZooming = true
    globalStore.closeAllDialogs()
  }
  const scale = touchesDistance(event.touches) / touchGesture.distance
  const percent = Math.round(touchGesture.zoomPercent * scale * 10) / 10
  // zoom around the previous touches center, then pan to follow the current one
  await globalStore.zoomSpaceTo({ percent, origin: prevPosition })
  window.scrollBy({ left: delta.x, top: delta.y, behavior: 'instant' })
}

// momentum, after panning

const checkIfShouldStartMomentum = (event) => {
  if (event.touches.length) { return }
  if (!touchGesture || !panVelocity) { return }
  const idleTime = event.timeStamp - touchGesture.timeStamp
  if (idleTime > momentumMaxIdleTime) { return }
  startMomentum(panVelocity)
}
const startMomentum = (velocity) => {
  cancelMomentum()
  prevMomentumTime = performance.now()
  const momentumFrame = (timestamp) => {
    const elapsedTime = Math.max(timestamp - prevMomentumTime, 0)
    prevMomentumTime = timestamp
    const decay = Math.pow(momentumDeceleration, elapsedTime)
    velocity.x *= decay
    velocity.y *= decay
    const velocityIsLow = Math.abs(velocity.x) < momentumMinVelocity && Math.abs(velocity.y) < momentumMinVelocity
    if (velocityIsLow) {
      cancelMomentum()
      return
    }
    window.scrollBy({ left: velocity.x * elapsedTime, top: velocity.y * elapsedTime, behavior: 'instant' })
    momentumTimer = window.requestAnimationFrame(momentumFrame)
  }
  momentumTimer = window.requestAnimationFrame(momentumFrame)
}
const cancelMomentum = () => {
  window.cancelAnimationFrame(momentumTimer)
  momentumTimer = null
  prevMomentumTime = null
}
</script>

<template lang="pug">
</template>

<style lang="stylus">
</style>
