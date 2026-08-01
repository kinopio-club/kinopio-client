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

import { usePanMomentum } from '@/composables/usePanMomentum'
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

let multiTouchAction, shouldCancelUndo

// touch panning and pinch zooming
// replaces native swipe scrolling and native pinch zooming,
// so the page never scales – only the space does (no counter-scaling needed for fixed UI)
const pinchEngageThreshold = 10 // min px moved before a multi-touch gesture is a pinch, preserves multi-touch tap gestures
const momentumMaxSampleAge = 100 // ms of trailing touchmove samples used for momentum velocity
const panMomentum = usePanMomentum()
let prevTouchPosition
let touchVelocitySamples = []
let totalPanDistance = 0
let pinchBaseline, prevPinchMidpoint
let pinchFrameTimer, pinchFrameZoom, pinchFramePan

// touches on these elements keep their native behavior (dialog scrolling, slider dragging)
const nativeTouchSelector = 'dialog, header, .footer-wrap, .minimap-canvas-wrap'

onMounted(() => {
  window.addEventListener('wheel', handleMouseWheelEvents, { passive: false })
  // use timer to prevent being fired from page reload scroll
  // https://stackoverflow.com/questions/34095038/on-scroll-fires-automatically-on-page-refresh
  setTimeout(() => {
    window.addEventListener('scroll', scroll)
  }, 100)
  window.addEventListener('touchstart', touchStart)
  window.addEventListener('touchmove', touchMove, { passive: false })
  window.addEventListener('touchend', touchEnd)
  window.addEventListener('touchcancel', touchEnd)
  // safari fires non-standard gesture events for native pinch zooming, which ignores meta viewport user-scalable=no
  window.addEventListener('gesturestart', preventNativeZoom)
  window.addEventListener('gesturechange', preventNativeZoom)
  window.addEventListener('gestureend', preventNativeZoom)
})
onBeforeUnmount(() => {
  window.removeEventListener('wheel', handleMouseWheelEvents, { passive: false })
  window.removeEventListener('scroll', scroll)
  window.removeEventListener('touchstart', touchStart)
  window.removeEventListener('touchmove', touchMove, { passive: false })
  window.removeEventListener('touchend', touchEnd)
  window.removeEventListener('touchcancel', touchEnd)
  window.removeEventListener('gesturestart', preventNativeZoom)
  window.removeEventListener('gesturechange', preventNativeZoom)
  window.removeEventListener('gestureend', preventNativeZoom)
})

const isSpacePage = computed(() => globalStore.isSpacePage)

const preventNativeZoom = (event) => {
  event.preventDefault()
}

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

// touch gating

const isNativeTouchTarget = (event) => {
  if (!(event.target instanceof Element)) { return false }
  return Boolean(event.target.closest(nativeTouchSelector))
}
// true when another handler owns the current touches (dragging, resizing, painting, drawing)
const isTouchInteractingWithItem = () => {
  return (
    globalStore.getIsInteractingWithItem ||
    globalStore.currentUserIsDraggingLine ||
    globalStore.currentUserIsTiltingCard ||
    globalStore.currentUserIsPaintSelecting ||
    globalStore.currentUserIsPaintSelectingLocked ||
    globalStore.currentUserIsBoxSelecting
  )
}
const shouldPreventPan = () => {
  return isTouchInteractingWithItem() || globalStore.getToolbarIsDrawing
}
const shouldPreventPinch = () => {
  // pinching is allowed in drawing mode (unlike panning), but not mid-stroke
  return isTouchInteractingWithItem() || globalStore.currentUserIsDrawing
}

// touch start

const touchStart = (event) => {
  shouldCancelUndo = false
  if (!isSpacePage.value) { return }
  if (isNativeTouchTarget(event)) { return }
  panMomentum.cancel()
  const touches = event.touches
  if (touches.length === 1) {
    prevTouchPosition = touchPosition(touches[0])
    touchVelocitySamples = []
    totalPanDistance = 0
    pinchBaseline = null
  } else {
    updatePinchBaseline(event)
  }
  if (!utils.isMultiTouch(event)) {
    multiTouchAction = null
    return
  }
  globalStore.shouldAddCard = false
  // undo/redo
  if (touches.length === 2) {
    multiTouchAction = 'undo'
  } else if (touches.length === 3) {
    multiTouchAction = 'redo'
  }
}

// touch move

const touchPosition = (touch) => {
  return { x: touch.clientX, y: touch.clientY }
}
const touchMove = (event) => {
  if (!isSpacePage.value) { return }
  if (isNativeTouchTarget(event)) { return }
  if (event.cancelable) { event.preventDefault() }
  if (event.touches.length >= 2) {
    pinchMove(event)
  } else {
    panMove(event)
  }
}

// one finger panning

const panMove = (event) => {
  const position = touchPosition(event.touches[0])
  const prevPosition = prevTouchPosition
  prevTouchPosition = position
  if (!prevPosition) { return }
  if (shouldPreventPan()) { return }
  const delta = {
    x: prevPosition.x - position.x,
    y: prevPosition.y - position.y
  }
  window.scrollBy(delta.x, delta.y)
  touchVelocitySamples.push({ x: delta.x, y: delta.y, time: event.timeStamp })
  touchVelocitySamples = touchVelocitySamples.slice(-5)
  totalPanDistance = totalPanDistance + Math.hypot(delta.x, delta.y)
  if (totalPanDistance > pinchEngageThreshold) {
    shouldCancelUndo = true
  }
  globalStore.isTouchScrolling = true
}
const startTouchMomentum = (event) => {
  const samples = touchVelocitySamples.filter(sample => event.timeStamp - sample.time <= momentumMaxSampleAge)
  touchVelocitySamples = []
  if (!samples.length) {
    globalStore.isTouchScrolling = false
    return
  }
  const velocity = {
    x: samples.reduce((total, sample) => total + sample.x, 0) / samples.length,
    y: samples.reduce((total, sample) => total + sample.y, 0) / samples.length
  }
  panMomentum.start(velocity, () => {
    globalStore.isTouchScrolling = false
  })
}

// pinch zooming, with two finger panning

const pinchValues = (event) => {
  const touch0 = event.touches[0]
  const touch1 = event.touches[1]
  const distance = Math.hypot(touch1.clientX - touch0.clientX, touch1.clientY - touch0.clientY)
  const midpoint = {
    x: (touch0.clientX + touch1.clientX) / 2,
    y: (touch0.clientY + touch1.clientY) / 2
  }
  return { distance, midpoint }
}
const updatePinchBaseline = (event) => {
  const values = pinchValues(event)
  pinchBaseline = {
    distance: values.distance,
    midpoint: values.midpoint,
    percent: globalStore.spaceZoomPercent
  }
  prevPinchMidpoint = values.midpoint
}
const pinchMove = (event) => {
  if (!pinchBaseline) {
    updatePinchBaseline(event)
    return
  }
  if (shouldPreventPinch()) { return }
  const values = pinchValues(event)
  // engage after a movement threshold so multi-touch tap gestures (undo/redo) still fire
  if (!globalStore.isPinchZooming) {
    const distanceDelta = Math.abs(values.distance - pinchBaseline.distance)
    const midpointDelta = Math.hypot(values.midpoint.x - pinchBaseline.midpoint.x, values.midpoint.y - pinchBaseline.midpoint.y)
    if (distanceDelta < pinchEngageThreshold && midpointDelta < pinchEngageThreshold) { return }
    globalStore.isPinchZooming = true
    shouldCancelUndo = true
  }
  pinchFrameZoom = {
    percent: pinchBaseline.percent * (values.distance / pinchBaseline.distance),
    origin: values.midpoint
  }
  pinchFramePan = pinchFramePan || { x: 0, y: 0 }
  pinchFramePan.x = pinchFramePan.x + (prevPinchMidpoint.x - values.midpoint.x)
  pinchFramePan.y = pinchFramePan.y + (prevPinchMidpoint.y - values.midpoint.y)
  prevPinchMidpoint = values.midpoint
  if (!pinchFrameTimer) {
    pinchFrameTimer = window.requestAnimationFrame(pinchFrame)
  }
}
const pinchFrame = () => {
  pinchFrameTimer = null
  if (pinchFramePan) {
    window.scrollBy(pinchFramePan.x, pinchFramePan.y)
    pinchFramePan = null
  }
  if (pinchFrameZoom) {
    globalStore.zoomSpaceTo(pinchFrameZoom)
    pinchFrameZoom = null
  }
}

// touch end

const touchEnd = (event) => {
  if (!isSpacePage.value) { return }
  const touches = event.touches
  // fingers remain, re-baseline the continuing gesture
  if (touches.length === 1) {
    globalStore.isPinchZooming = false
    pinchBaseline = null
    prevTouchPosition = touchPosition(touches[0])
    return
  } else if (touches.length > 1) {
    updatePinchBaseline(event)
    return
  }
  // all fingers lifted
  globalStore.isPinchZooming = false
  pinchBaseline = null
  prevTouchPosition = null
  // undo/redo
  if (shouldCancelUndo) {
    shouldCancelUndo = false
    multiTouchAction = null
  } else if (multiTouchAction === 'undo') {
    historyStore.undo()
    globalStore.addNotification({ message: 'Undo', icon: 'undo' })
  } else if (multiTouchAction === 'redo') {
    historyStore.redo()
    globalStore.addNotification({ message: 'Redo', icon: 'redo' })
  }
  multiTouchAction = null
  startTouchMomentum(event)
}
</script>

<template lang="pug">
</template>

<style lang="stylus">
</style>
