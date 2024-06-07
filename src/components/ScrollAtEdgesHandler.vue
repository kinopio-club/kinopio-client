<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

const scrollArea = 50
let startCursor, prevCursor, prevCursorPage, endCursor, scrollTimer, maxHeight, maxWidth, currentEvent
let movementDirection = {}

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'currentUserIsPaintingLocked' && mutation.payload) {
      stopScrollTimer()
    }
    if (mutation.type === 'triggeredTouchCardDragPosition') {
      const position = store.state.triggeredTouchCardDragPosition
      const event = {
        clientX: position.x,
        clientY: position.y
      }
      stopScrollTimer()
      initInteractions(event)
    }
  })
  window.addEventListener('mousedown', initInteractions)
  window.addEventListener('touchstart', initInteractions)
  // bind events to window to receive events when mouse is outside window
  window.addEventListener('mousemove', interact)
  window.addEventListener('touchmove', interact)
  window.addEventListener('mouseup', stopInteractions)
  window.addEventListener('touchend', stopInteractions)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', initInteractions)
  window.removeEventListener('touchstart', initInteractions)
  window.removeEventListener('mousemove', interact)
  window.removeEventListener('touchmove', interact)
  window.removeEventListener('mouseup', stopInteractions)
  window.removeEventListener('touchend', stopInteractions)
})

// interacting

const initInteractions = (event) => {
  currentEvent = event
  const position = utils.cursorPositionInViewport(event)
  const zoom = spaceZoomDecimal.value
  startCursor = position
  endCursor = position
  maxHeight = Math.max(6500, store.state.viewportHeight) * zoom
  maxWidth = Math.max(6500, store.state.viewportWidth) * zoom
  if (store.getters.shouldScrollAtEdges(event)) {
    updateMovementDirection()
  }
  if (store.getters.shouldScrollAtEdges(event) && !scrollTimer) {
    scrollTimer = window.requestAnimationFrame(scrollFrame)
  }
}
const interact = (event) => {
  currentEvent = event
  if (store.getters.shouldScrollAtEdges(event)) {
    updateMovementDirection()
  }
  prevCursor = utils.cursorPositionInViewport(event)
  prevCursorPage = utils.cursorPositionInPage(event)
}
const stopScrollTimer = () => {
  window.cancelAnimationFrame(scrollTimer)
  scrollTimer = undefined
  prevCursor = undefined
  movementDirection = {}
}
const stopInteractions = () => {
  stopScrollTimer()
}

// user

const currentUserIsPainting = computed(() => store.state.currentUserIsPainting)
const isDraggingCard = computed(() => store.state.currentUserIsDraggingCard)
const isDrawingConnection = computed(() => store.state.currentUserIsDrawingConnection)
const isResizingCard = computed(() => store.state.currentUserIsResizingCard)

// position

const cursor = () => {
  if (utils.objectHasKeys(prevCursor)) {
    return prevCursor
  } else {
    return startCursor
  }
}
const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)
const pageHeight = computed(() => store.state.pageHeight)
const pageWidth = computed(() => store.state.pageWidth)
const spaceCounterZoomDecimal = computed(() => store.getters.spaceCounterZoomDecimal)
const spaceZoomDecimal = computed(() => store.getters.spaceZoomDecimal)
const shouldPreventResize = computed(() => currentUserIsPainting.value || isDrawingConnection.value || isResizingCard.value)

// scroll

const scrollFrame = () => {
  let delta, currentSpeed
  const currentCursor = cursor()
  const cursorIsTopSide = currentCursor.y <= scrollArea
  const cursorIsBottomSide = currentCursor.y >= (viewportHeight.value - scrollArea)
  const cursorIsLeftSide = currentCursor.x <= scrollArea
  const cursorIsRightSide = currentCursor.x >= (viewportWidth.value - scrollArea)
  const shouldScrollUp = Boolean(cursorIsTopSide && window.scrollY)
  // Y movement
  if (movementDirection.y === 'up' && shouldScrollUp) {
    currentSpeed = scrollSpeed(currentCursor, 'up')
    delta = {
      x: 0,
      y: -currentSpeed
    }
    scrollBy(delta)
  } else if (movementDirection.y === 'down' && cursorIsBottomSide && shouldScrollDown()) {
    currentSpeed = scrollSpeed(currentCursor, 'down')
    delta = {
      x: 0,
      y: currentSpeed
    }
    increasePageHeight(delta)
    scrollBy(delta)
  }
  // X movement
  if (movementDirection.x === 'left' && cursorIsLeftSide && window.scrollX) {
    currentSpeed = scrollSpeed(currentCursor, 'left')
    delta = {
      x: -currentSpeed,
      y: 0
    }
    scrollBy(delta)
  } else if (movementDirection.x === 'right' && cursorIsRightSide && shouldScrollRight()) {
    currentSpeed = scrollSpeed(currentCursor, 'right')
    delta = {
      x: currentSpeed,
      y: 0
    }
    increasePageWidth(delta)
    scrollBy(delta)
  }
  if (scrollTimer) {
    window.requestAnimationFrame(scrollFrame)
  }
}
const updateMovementDirection = () => {
  const frameCursor = cursor()
  const xMove = endCursor.x - frameCursor.x
  const yMove = endCursor.y - frameCursor.y
  if (Math.sign(yMove) === 1) {
    movementDirection.y = 'up'
  } else if (Math.sign(yMove) === -1) {
    movementDirection.y = 'down'
  }
  if (Math.sign(xMove) === 1) {
    movementDirection.x = 'left'
  } else if (Math.sign(xMove) === -1) {
    movementDirection.x = 'right'
  }
}
const shouldScrollRight = () => {
  updatePageSizes()
  const scrolledTooFarRight = (window.scrollX + viewportWidth.value) > maxWidth
  return !scrolledTooFarRight
}
const shouldScrollDown = () => {
  updatePageSizes()
  const scrolledTooFarDown = (window.scrollY + viewportHeight.value) > maxHeight
  return !scrolledTooFarDown
}
const scrollSpeed = (cursor, direction) => {
  const minSpeed = 10
  const maxSpeed = 20
  const maxSpeedOutsideWindow = 50
  // viewportSize based on direction
  const directionIsY = direction === 'up' || direction === 'down'
  const directionIsX = direction === 'left' || direction === 'right'
  let viewportSize
  if (directionIsX) {
    cursor = cursor.x
    viewportSize = viewportWidth.value
  } else if (directionIsY) {
    cursor = cursor.y
    viewportSize = viewportHeight.value
  }
  // calc percent over scrollArea
  let amount
  if (direction === 'up' || direction === 'left') {
    amount = Math.abs(cursor - scrollArea)
  }
  if (direction === 'down' || direction === 'right') {
    amount = Math.abs(cursor - (viewportSize - scrollArea))
  }
  let percent = utils.roundFloat(amount / scrollArea)
  // speed
  let speed = percent * scrollArea
  speed = Math.max(speed, minSpeed)
  if (percent > 1) {
    speed = Math.min(speed, maxSpeedOutsideWindow)
  } else {
    speed = Math.min(speed, maxSpeed)
  }
  return speed
}
const scrollBy = (delta) => {
  if (utils.isAndroid()) { return }
  let zoom = spaceZoomDecimal.value
  if (zoom === 1) {
    const viewport = utils.visualViewport()
    zoom = viewport.scale
  }
  const currentUserIsBoxSelecting = store.state.currentUserIsBoxSelecting
  const isDraggingCard = store.state.currentUserIsDraggingCard
  const isDraggingBox = store.state.currentUserIsDraggingBox
  const isDraggingItem = isDraggingCard || isDraggingBox
  delta = {
    left: Math.round(delta.x * zoom),
    top: Math.round(delta.y * zoom)
  }
  if (isDraggingItem) {
    const slowMultiplier = 0.9
    const itemDelta = {
      x: delta.left * slowMultiplier,
      y: delta.top * slowMultiplier
    }
    store.dispatch('history/pause')
    if (isDraggingCard || isDraggingBox) {
      store.dispatch('currentCards/move', { endCursor, prevCursor, delta: itemDelta })
      store.dispatch('currentBoxes/move', { endCursor, prevCursor, delta: itemDelta })
    }
  }
  if (isDrawingConnection.value) {
    store.commit('triggerDrawConnectionFrame', currentEvent)
  }
  if (currentUserIsPainting.value && !currentUserIsBoxSelecting) {
    store.commit('triggerPaintFramePosition', currentEvent)
  }
  window.scrollBy(delta)
}

// page size

const increasePageWidth = (delta) => {
  if (shouldPreventResize.value) { return }
  const cursorIsRightSideOfPage = (pageWidth.value - prevCursorPage.x) < scrollArea
  if (cursorIsRightSideOfPage) {
    const width = pageWidth.value + delta.x
    store.commit('pageWidth', width)
  }
}
const increasePageHeight = (delta) => {
  if (shouldPreventResize.value) { return }
  const cursorIsBottomSideOfPage = (pageHeight.value - prevCursorPage.y) < scrollArea
  if (cursorIsBottomSideOfPage) {
    const height = pageHeight.value + delta.y
    store.commit('pageHeight', height)
  }
}
const updatePageSizes = () => {
  store.dispatch('updatePageSizes')
}

</script>

<template lang="pug">
</template>
