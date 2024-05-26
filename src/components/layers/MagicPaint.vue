<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import collisionDetection from '@/collisionDetection.js'
import postMessage from '@/postMessage.js'
import DropGuideLine from '@/components/layers/DropGuideLine.vue'
const store = useStore()

const circleRadius = 20
const circleSelectionRadius = circleRadius - 10 // magnitude of sensitivity

// painting
// a sequence of circles that's broadcasted to others and is used for multi-card selection
const maxIterations = 300 // higher is longer tail
const rateOfIterationDecay = 0.08 // higher is faster tail decay
const rateOfIterationDecaySlow = 0.03
let paintingCircles = []
let paintingCanvas, paintingContext, startCursor, paintingCirclesTimer
let prevScroll
let prevPosition, prevCursor

// remote painting
let remotePaintingCircles = []
let remotePaintingCanvas, remotePaintingContext, remotePaintingCirclesTimer

// locking
// long press to lock scrolling
const lockingPreDuration = 100 // ms
const lockingDuration = 150 // ms
const initialLockCircleRadius = 65
let lockingCanvas, lockingContext, lockingAnimationTimer, currentUserIsLocking, lockingStartTime, shouldCancelLocking

// initial
// shows immediate feedback without having to move cursor
let initialCircles = []
let initialCircleCanvas, initialCircleContext, initialCirclesTimer

// post scroll timer
// runs scroll events after scrollend to compensate for android inertia scrolling
const postScrollDuration = 300 // ms
let postScrollAnimationTimer, postScrollStartTime, shouldCancelPostScroll

let selectableCardsInViewport = []
let selectableBoxes = []
let selectableConnectionsInViewport = []

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerPaintFramePosition') {
      const event = mutation.payload
      const position = utils.cursorPositionInSpace(event)
      createPaintingCircle(event)
      selectItems([position])
    } else if (mutation.type === 'triggerUpdateMagicPaintPositionOffset') {
      updateCirclesWithScroll()
    } else if (mutation.type === 'triggerAddRemotePaintingCircle') {
      let circle = mutation.payload
      delete circle.type
      const position = updateRemotePosition(circle)
      circle.x = position.x
      circle.y = position.y
      createRemotePaintingCircle(circle)
      remotePainting()
    }
  })
  paintingCanvas = document.getElementById('magic-painting')
  paintingContext = paintingCanvas.getContext('2d')
  paintingContext.scale(window.devicePixelRatio, window.devicePixelRatio)
  remotePaintingCanvas = document.getElementById('remote-painting')
  remotePaintingContext = remotePaintingCanvas.getContext('2d')
  remotePaintingContext.scale(window.devicePixelRatio, window.devicePixelRatio)
  lockingCanvas = document.getElementById('locking')
  lockingContext = lockingCanvas.getContext('2d')
  lockingContext.scale(window.devicePixelRatio, window.devicePixelRatio)
  initialCircleCanvas = document.getElementById('initial-circle')
  initialCircleContext = initialCircleCanvas.getContext('2d')
  initialCircleContext.scale(window.devicePixelRatio, window.devicePixelRatio)
  // trigger stopPainting even if mouse is outside window
  window.addEventListener('mouseup', stopPainting)
  window.addEventListener('touchend', stopPainting)
  // shift circle positions with scroll to simulate full size canvas
  updatePrevScrollPosition()
  window.addEventListener('scroll', userScroll)
  window.addEventListener('touchmove', userScroll) // android fix
  window.addEventListener('load', clearCircles)
  startPostScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('mouseup', stopPainting)
  window.removeEventListener('touchend', stopPainting)
  window.removeEventListener('scroll', userScroll)
  window.removeEventListener('touchmove', userScroll)
  window.removeEventListener('load', clearCircles)
})

const state = reactive({
  pinchZoomOffsetTop: 0,
  pinchZoomOffsetLeft: 0,
  currentCursor: {},
  currentCursorInSpace: {},
  uploadIsDraggedOver: false
})

// current user

const currentUserColor = computed(() => store.state.currentUser.color)
const userCannotEditSpace = computed(() => !store.getters['currentUser/canEditSpace']())
const isPanning = computed(() => store.state.currentUserIsPanningReady)
const isBoxSelecting = computed(() => store.state.currentUserIsBoxSelecting)
const toolbarIsCard = computed(() => store.state.currentUserToolbar === 'card')
const toolbarIsBox = computed(() => store.state.currentUserToolbar === 'box')

// page size
// keep canvases updated to viewport size so you can draw on newly created areas

const pageHeight = computed(() => store.state.pageHeight)
const pageWidth = computed(() => store.state.pageWidth)
const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)
const spaceCounterZoomDecimal = computed(() => store.getters.spaceCounterZoomDecimal)
const spaceZoomDecimal = computed(() => store.getters.spaceZoomDecimal)
const canvasStyles = computed(() => {
  return { top: state.pinchZoomOffsetTop + 'px', left: state.pinchZoomOffsetLeft + 'px' }
})

const updateSelectableCardsInViewport = () => {
  const selectableCards = store.getters['currentCards/isSelectableInViewport']()
  if (!selectableCards) { return }
  selectableCardsInViewport = selectableCards
}
const updateSelectableBoxes = () => {
  const boxes = store.getters['currentBoxes/isNotLocked']
  let array = []
  boxes.forEach(box => {
    const element = document.querySelector(`.box-info[data-box-id="${box.id}"]`)
    const rect = element.getBoundingClientRect()
    box = {
      id: box.id,
      name: box.name,
      x: box.x,
      y: box.y,
      width: rect.width,
      height: rect.height
    }
    array.push(box)
  })
  selectableBoxes = array
}
const updateSelectableConnectionsInViewport = () => {
  let paths = []
  const pathElements = document.querySelectorAll('svg .connection-path')
  pathElements.forEach(path => {
    // if (path.dataset.isVisibleInViewport === 'false') { return }
    if (path.dataset.isHiddenByCommentFilter === 'true') { return }
    paths.push(path)
  })
  selectableConnectionsInViewport = paths
}
const updateRemotePosition = (position) => {
  const zoom = spaceZoomDecimal.value
  const scroll = { x: window.scrollX, y: window.scrollY }
  const space = document.getElementById('space')
  const rect = space.getBoundingClientRect()
  position = {
    x: (position.x * zoom) + rect.x + scroll.x,
    y: (position.y * zoom) + rect.y + scroll.y
  }
  return position
}
const userScroll = () => {
  if (postScrollAnimationTimer) {
    shouldCancelPostScroll = true
  }
  // update selectable cards during paint autoscroll at edges
  if (store.state.currentUserIsPainting) {
    updateSelectableCardsInViewport()
    updateSelectableConnectionsInViewport()
  }
  scroll()
}
const scroll = () => {
  updateCirclesWithScroll()
  cancelLocking()
}
const clearCircles = () => {
  initialCircles = []
  paintingCircles = []
  remotePaintingCircles = []
}
const updatePrevScrollPosition = () => {
  prevScroll = {
    x: window.scrollX,
    y: window.scrollY
  }
}
const updateCirclePositions = (circles, scrollDelta) => {
  return circles.map(circle => {
    circle.x = circle.x - scrollDelta.x
    circle.y = circle.y - scrollDelta.y
    return circle
  })
}
const updateCirclesWithScroll = () => {
  const scrollDelta = {
    x: window.scrollX - prevScroll.x,
    y: window.scrollY - prevScroll.y
  }
  if (initialCircles.length) {
    initialCircles = updateCirclePositions(initialCircles, scrollDelta) // covers locking circles of varialbe radius/
  }
  if (paintingCircles.length) {
    paintingCircles = updateCirclePositions(paintingCircles, scrollDelta)
  }
  updatePrevScrollPosition()
}
const updateCircleForAndroid = (circle) => {
  if (!utils.isAndroid()) { return circle }
  circle.x = circle.x - window.visualViewport.offsetLeft
  circle.y = circle.y - window.visualViewport.offsetTop
  return circle
}
const checkIsCircleVisible = (circle) => {
  let { x, y, radius } = circle
  radius = radius || circleRadius
  let isBetween = {
    value: x + radius,
    min: 0,
    max: viewportWidth.value
  }
  const isCircleVisibleX = utils.isBetween(isBetween)
  isBetween = {
    value: y + radius,
    min: 0,
    max: viewportHeight.value
  }
  const isCircleVisibleY = utils.isBetween(isBetween)
  return Boolean(isCircleVisibleX && isCircleVisibleY)
}
const offscreenCircle = (circle) => {
  if (circle.x > viewportWidth.value) {
    circle.x = viewportWidth.value
  } else if (circle.x < 0) {
    circle.x = 0
  }
  if (circle.y > viewportHeight.value) {
    circle.y = viewportHeight.value
  } else if (circle.y < 0) {
    circle.y = 0
  }
  return circle
}
const drawCircle = (circle, context, shouldDrawOffscreen) => {
  circle = updateCircleForAndroid(circle)
  const isCircleVisible = checkIsCircleVisible(circle)
  if (!isCircleVisible && !shouldDrawOffscreen) { return }
  if (!isCircleVisible && shouldDrawOffscreen) { circle = offscreenCircle(circle) }
  let { x, y, color, iteration, radius, alpha } = circle
  radius = radius || circleRadius
  let decay = rateOfIterationDecay
  const isSlow = context.canvas.dataset.shouldDecaySlow
  if (isSlow) {
    decay = rateOfIterationDecaySlow
  }
  alpha = alpha || utils.exponentialDecay(iteration, decay)
  context.beginPath()
  context.arc(x, y, radius, 0, 2 * Math.PI)
  context.closePath()
  context.globalAlpha = alpha
  context.fillStyle = color
  context.fill()
}
const shouldCancel = (event) => {
  let shouldCancelOutsideOfBrowser = !(event.target instanceof Element)
  if (shouldCancelOutsideOfBrowser) {
    return false
  }
  const fromDialog = event.target.closest('dialog')
  const fromHeader = event.target.closest('header')
  const fromFooter = event.target.closest('footer')
  return fromDialog || fromHeader || fromFooter
}
const stopPainting = (event) => {
  if (store.state.isAddPage) { return }
  if (shouldCancel(event)) { return }
  startCursor = startCursor || {}
  const endCursor = utils.cursorPositionInViewport(event)
  const shouldAddCard = store.state.shouldAddCard
  currentUserIsLocking = false
  window.cancelAnimationFrame(lockingAnimationTimer)
  lockingAnimationTimer = undefined
  lockingContext.clearRect(0, 0, pageWidth.value, pageHeight.value)
  store.commit('currentUserIsPaintingLocked', false)
  store.commit('currentUserIsPainting', false)
  if (utils.cursorsAreClose(startCursor, endCursor) && shouldAddCard && event.cancelable) {
    store.commit('shouldAddCard', true)
    event.preventDefault()
  } else {
    store.commit('shouldAddCard', false)
  }
  // prevent mouse events from firing after touch events on touch device
  if (event.cancelable) { event.preventDefault() }
  startPostScroll()
}

// Post Scrolling (for android)

const startPostScroll = () => {
  shouldCancelPostScroll = false
  if (!postScrollAnimationTimer) {
    postScrollAnimationTimer = window.requestAnimationFrame(postScrollFrame)
  }
}
const postScrollFrame = (timestamp) => {
  if (!postScrollStartTime) {
    postScrollStartTime = timestamp
  }
  const elaspedTime = timestamp - postScrollStartTime
  const percentComplete = (elaspedTime / postScrollDuration) // between 0 and 1
  if (shouldCancelPostScroll) {
    endPostScroll()
  } else if (percentComplete <= 1) {
    scroll()
    window.requestAnimationFrame(postScrollFrame)
  } else {
    endPostScroll()
  }
}
const endPostScroll = () => {
  shouldCancelPostScroll = false
  window.cancelAnimationFrame(postScrollAnimationTimer)
  postScrollAnimationTimer = undefined
  postScrollStartTime = undefined
}

// Painting

const painting = (event) => {
  const isPainting = store.state.currentUserIsPainting
  if (isPanning.value) { return }
  if (isBoxSelecting.value) { return }
  if (!toolbarIsCard.value) { return }
  if (!isPainting) { return }
  if (store.getters.shouldScrollAtEdges(event) && event.cancelable) {
    event.preventDefault() // prevents touch swipe viewport scrolling
  }
  if (!paintingCirclesTimer) {
    paintingCirclesTimer = window.requestAnimationFrame(paintCirclesAnimationFrame)
  }
  if (event.getCoalescedEvents) {
    const events = event.getCoalescedEvents()
    events.forEach(event => createPaintingCircle(event))
  } else {
    createPaintingCircle(event)
  }
  triggerHideTouchInterface()
}
const triggerHideTouchInterface = () => {
  if (!store.state.currentUserIsPaintingLocked) { return }
  store.commit('triggerHideTouchInterface')
}
const createPaintingCircle = (event) => {
  const isTouch = Boolean(event.touches)
  const isPaintingLocked = store.state.currentUserIsPaintingLocked
  if (isTouch && !isPaintingLocked) { return }
  if (isBoxSelecting.value) { return }
  const currentUserIsPaintingLocked = store.state.currentUserIsPaintingLocked
  if (isTouch && !currentUserIsPaintingLocked) { return }
  createPaintingCircles(event)
  const position = utils.cursorPositionInSpace(event)
  selectItemsBetweenCurrentAndPrevPosition(position)
}
const createPaintingCircles = (event) => {
  state.currentCursor = utils.cursorPositionInViewport(event)
  if (!prevCursor) {
    prevCursor = state.currentCursor
    return
  }
  const color = store.state.currentUser.color
  const points = utils.pointsBetweenTwoPoints(prevCursor, state.currentCursor)
  points.forEach(point => {
    const circle = { x: point.x, y: point.y, color, iteration: 0 }
    paintingCircles.push(circle)
  })
  const circle = { x: state.currentCursor.x, y: state.currentCursor.y, color, iteration: 0 }
  broadcastCircle(event, circle)
  prevCursor = state.currentCursor
}
const startPainting = (event) => {
  if (isPanning.value) { return }
  if (isBoxSelecting.value) { return }
  updateSelectableCardsInViewport()
  updateSelectableBoxes()
  updateSelectableConnectionsInViewport()
  startCursor = utils.cursorPositionInViewport(event)
  state.currentCursor = startCursor
  const multipleCardsIsSelected = Boolean(store.state.multipleCardsSelectedIds.length)
  store.dispatch('currentCards/updateCanBeSelectedSortedByY')
  if (utils.isMultiTouch(event)) { return }
  startLocking()
  if (event.touches) {
    store.commit('currentUserIsPainting', false)
  } else {
    store.commit('currentUserIsPainting', true)
    createInitialCircle()
  }
  const shouldAdd = !multipleCardsIsSelected && !utils.unpinnedDialogIsVisible()
  // add card
  if (shouldAdd && toolbarIsCard.value) {
    store.commit('shouldAddCard', true)
  // add box
  } else if (shouldAdd && toolbarIsBox.value) {
    addBox(event)
    return
  }
  // clear selected
  if (!event.shiftKey) {
    store.dispatch('clearMultipleSelected')
  }
  prevPosition = null
  prevCursor = null
  store.commit('previousMultipleCardsSelectedIds', store.state.multipleCardsSelectedIds)
  store.commit('previousMultipleConnectionsSelectedIds', store.state.multipleConnectionsSelectedIds)
  store.dispatch('closeAllDialogs')
}
const paintCirclesAnimationFrame = () => {
  paintingCircles = utils.filterCircles(paintingCircles, maxIterations)
  paintingContext.clearRect(0, 0, pageWidth.value, pageHeight.value)
  paintingCircles.forEach(item => {
    item.iteration++
    let circle = JSON.parse(JSON.stringify(item))
    drawCircle(circle, paintingContext)
  })
  if (paintingCircles.length > 0) {
    window.requestAnimationFrame(paintCirclesAnimationFrame)
  } else {
    setTimeout(() => {
      window.cancelAnimationFrame(paintingCirclesTimer)
      paintingCirclesTimer = undefined
    }, 0)
  }
}

// Boxes

const addBox = (event) => {
  let position = utils.cursorPositionInSpace(event)
  if (utils.isPositionOutsideOfSpace(position)) {
    position = utils.cursorPositionInPage(event)
    store.commit('addNotificationWithPosition', { message: 'Outside Space', position, type: 'info', icon: 'cancel', layer: 'app' })
    return
  }
  store.dispatch('currentUser/notifyReadOnly', position)
  const shouldPrevent = !store.getters['currentUser/canEditSpace']()
  if (shouldPrevent) {
    store.commit('currentUserToolbar', 'card')
    return
  }
  store.dispatch('currentBoxes/add', { box: position, shouldResize: true })
  store.commit('currentBoxIsNew', true)
  event.preventDefault() // allows dragging boxes without scrolling on touch
}

// Selecting

const shouldPreventSelectionOnMobile = () => {
  const isMobile = utils.isMobile()
  const isPaintingLocked = store.state.currentUserIsPaintingLocked
  return isMobile && !isPaintingLocked
}
const selectItemsBetweenCurrentAndPrevPosition = (position) => {
  if (!prevPosition) {
    prevPosition = position
    return
  }
  const points = utils.pointsBetweenTwoPoints(prevPosition, position)
  selectItems(points)
  prevPosition = position
}
const selectItems = (points) => {
  if (shouldPreventSelectionOnMobile()) { return }
  if (userCannotEditSpace.value) { return }
  selectCards(points)
  selectBoxes(points)
  selectConnections(points)
}
const selectCards = (points) => {
  const matches = collisionDetection.checkPointsInRects(points, selectableCardsInViewport)
  const cardIds = matches.map(match => match.id)
  store.dispatch('addMultipleToMultipleCardsSelected', cardIds)
}
const selectBoxes = (points) => {
  const matches = collisionDetection.checkPointsInRects(points, selectableBoxes)
  const boxIds = matches.map(match => match.id)
  store.dispatch('addMultipleToMultipleBoxesSelected', boxIds)
}
const selectConnections = (points) => {
  const svg = document.querySelector('svg.connections')
  const matches = collisionDetection.checkPointsInsidePaths(points, selectableConnectionsInViewport, svg)
  const connectionIds = matches.map(match => match.id)
  store.dispatch('addMultipleToMultipleConnectionsSelected', connectionIds)
}

// Remote Painting

const broadcastCircle = (event, circle) => {
  const position = utils.cursorPositionInSpace(event)
  store.commit('broadcast/update', {
    updates: {
      userId: store.state.currentUser.id,
      x: position.x,
      y: position.y,
      color: circle.color,
      iteration: circle.iteration,
      zoom: spaceZoomDecimal.value
    },
    type: 'addRemotePaintingCircle',
    handler: 'triggerAddRemotePaintingCircle'
  })
}
const createRemotePaintingCircle = (circle) => {
  const { color, zoom } = circle
  const prevCircle = remotePaintingCircles.findLast(item => item.userId === circle.userId)
  if (prevCircle) {
    const points = utils.pointsBetweenTwoPoints(prevCircle, circle)
    points.forEach(point => {
      point = { x: point.x, y: point.y, color, zoom, iteration: 0 }
      remotePaintingCircles.push(point)
    })
    remotePaintingCircles.push(circle)
  } else {
    remotePaintingCircles.push(circle)
  }
}
const remotePainting = () => {
  if (!remotePaintingCirclesTimer) {
    remotePaintingCirclesTimer = window.requestAnimationFrame(remotePaintCirclesAnimationFrame)
  }
}
const remotePaintCirclesAnimationFrame = () => {
  remotePaintingCircles = utils.filterCircles(remotePaintingCircles, maxIterations)
  remotePaintingContext.clearRect(0, 0, pageWidth.value, pageHeight.value)
  remotePaintingCircles.forEach(item => {
    item.iteration++
    let circle = JSON.parse(JSON.stringify(item))
    circle.x = circle.x - window.scrollX
    circle.y = circle.y - window.scrollY
    const shouldDrawOffscreen = true
    drawCircle(circle, remotePaintingContext, shouldDrawOffscreen)
  })
  if (remotePaintingCircles.length > 0) {
    window.requestAnimationFrame(remotePaintCirclesAnimationFrame)
  } else {
    setTimeout(() => {
      window.cancelAnimationFrame(remotePaintingCirclesTimer)
      remotePaintingCirclesTimer = undefined
    }, 0)
  }
}

// Locking

const cancelLocking = () => {
  shouldCancelLocking = true
}
const startLocking = () => {
  if (toolbarIsBox.value) { return }
  currentUserIsLocking = true
  shouldCancelLocking = false
  setTimeout(() => {
    if (!lockingAnimationTimer) {
      lockingAnimationTimer = window.requestAnimationFrame(lockingAnimationFrame)
    }
  }, lockingPreDuration)
}
const lockingAnimationFrame = (timestamp) => {
  if (!lockingStartTime) {
    lockingStartTime = timestamp
  }
  const elaspedTime = timestamp - lockingStartTime
  const percentComplete = (elaspedTime / lockingDuration) // between 0 and 1
  if (!utils.cursorsAreClose(startCursor, state.currentCursor)) {
    currentUserIsLocking = false
  }
  if (shouldCancelLocking) {
    currentUserIsLocking = false
    shouldCancelLocking = false
  }
  if (currentUserIsLocking && percentComplete <= 1) {
    const minSize = circleRadius
    const percentRemaining = Math.abs(percentComplete - 1)
    const circleRadiusDelta = initialLockCircleRadius - minSize
    const radius = (circleRadiusDelta * percentRemaining) + minSize
    const alpha = utils.easeOut(percentComplete, elaspedTime, lockingDuration)
    const circle = {
      x: startCursor.x,
      y: startCursor.y,
      color: currentUserColor.value,
      radius,
      alpha: alpha || 0.01, // to ensure truthyness
      iteration: 1
    }
    lockingContext.clearRect(0, 0, pageWidth.value, pageHeight.value)
    drawCircle(circle, lockingContext)
    window.requestAnimationFrame(lockingAnimationFrame)
  } else {
    window.cancelAnimationFrame(lockingAnimationTimer)
    lockingContext.clearRect(0, 0, pageWidth.value, pageHeight.value)
    lockingAnimationTimer = undefined
    lockingStartTime = undefined
  }
  if (currentUserIsLocking && percentComplete > 1) {
    store.commit('currentUserIsPainting', true)
    store.commit('currentUserIsPaintingLocked', true)
    console.log('🔒 lockingAnimationFrame locked')
    postMessage.sendHaptics({ name: 'softImpact' })
    lockingStartTime = undefined
  }
}

// Initial Circles

const startInitialCircles = () => {
  initialCircles.map(circle => {
    circle.persistent = false
  })
  if (!initialCirclesTimer) {
    initialCirclesTimer = window.requestAnimationFrame(initialCirclesAnimationFrame)
  }
}
const createInitialCircle = () => {
  if (toolbarIsBox.value) { return }
  const initialCircle = {
    x: startCursor.x,
    y: startCursor.y,
    color: currentUserColor.value,
    iteration: 1,
    persistent: true
  }
  initialCircles.push(initialCircle)
  drawCircle(initialCircle, initialCircleContext)
  startInitialCircles()
}
const initialCirclesAnimationFrame = () => {
  initialCircles = utils.filterCircles(initialCircles, maxIterations)
  initialCircleContext.clearRect(0, 0, pageWidth.value, pageHeight.value)
  initialCircles.forEach(item => {
    if (!item.persistent) {
      item.iteration++
    }
    let circle = JSON.parse(JSON.stringify(item))
    drawCircle(circle, initialCircleContext)
  })
  if (initialCircles.length) {
    window.requestAnimationFrame(initialCirclesAnimationFrame)
  } else {
    window.cancelAnimationFrame(initialCirclesTimer)
    initialCirclesTimer = undefined
  }
}

// Upload Files

const checkIfUploadIsDraggedOver = (event) => {
  const uploadIsFiles = event.dataTransfer.types.find(type => type === 'Files')
  if (!uploadIsFiles) { return }
  state.currentCursor = utils.cursorPositionInViewport(event)
  state.currentCursorInSpace = utils.cursorPositionInSpace(event)
  state.uploadIsDraggedOver = true
}
const removeUploadIsDraggedOver = () => {
  state.uploadIsDraggedOver = false
}
const addCardsAndUploadFiles = (event) => {
  let files = event.dataTransfer.files
  files = Array.from(files)
  removeUploadIsDraggedOver()
  store.dispatch('upload/addCardsAndUploadFiles', {
    files,
    event
  })
}

</script>

<template lang="pug">
aside
  //- Magic painting is ephemeral brush strokes that select items
  canvas#magic-painting(
    @mousedown.left="startPainting"
    @touchstart="startPainting"
    @mousemove="painting"
    @touchmove="painting"
    :width="viewportWidth"
    :height="viewportHeight"
    :style="canvasStyles"
    @dragenter="checkIfUploadIsDraggedOver"
    @dragover.prevent="checkIfUploadIsDraggedOver"
    @dragleave="removeUploadIsDraggedOver"
    @dragend="removeUploadIsDraggedOver"
    @drop.prevent.stop="addCardsAndUploadFiles"
  )
  canvas#remote-painting.remote-painting(
    :width="viewportWidth"
    :height="viewportHeight"
    :style="canvasStyles"
    :data-should-decay-slow="true"
  )
  canvas#locking.locking(
    :width="viewportWidth"
    :height="viewportHeight"
    :style="canvasStyles"
    :data-should-decay-slow="true"
  )
  canvas#initial-circle.initial-circle(
    :width="viewportWidth"
    :height="viewportHeight"
    :style="canvasStyles"
    :data-should-decay-slow="true"
  )
  DropGuideLine(
    :currentCursor="state.currentCursor"
    :currentCursorInSpace="state.currentCursorInSpace"
    :uploadIsDraggedOver="state.uploadIsDraggedOver"
  )
</template>

<style lang="stylus" scoped>
canvas
  position fixed
  top 0
.locking,
.initial-circle,
.remote-painting
  pointer-events none
</style>
