<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useLineStore } from '@/stores/useLineStore'
import { useListStore } from '@/stores/useListStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

import throttle from 'lodash-es/throttle'
import { colord } from 'colord'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const lineStore = useLineStore()
const listStore = useListStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let canvas, context
let offscreenCanvas, offscreenContext
let cachedDrawingImage, cachedDrawingDataUrl
let startPanningPosition
let pingCanvas, pingContext, pingFrameId
let pingRipples = [] // { x, y, color, radius, speed, decay, lineWidth, shouldDestroy, opacity }
const itemRadius = 1
const canvasElement = ref(null)
const pingCanvasElement = ref(null)

let unsubscribes

onMounted(async () => {
  update()
  window.addEventListener('scroll', updateScroll)
  window.addEventListener('resize', update)
  window.addEventListener('pointerup', endPanningViewport, true) // capture, because parent dialogs can stop pointerup propagation
  window.addEventListener('pointermove', panViewport)

  const globalStoreActions = [
    'triggerEndDrawing'
  ]
  const boxStoreActions = [
    'updateBoxes',
    'createBox'
  ]
  const cardStoreActions = [
    'updateCards',
    'removeCards',
    'clearResizeCards',
    'moveCards',
    'createCard',
    'resizeCards',
    'pasteCards'
  ]
  const connectionStoreActions = [
    'createConnection',
    'updateConnections',
    'removeConnections'
  ]
  const lineStoreActions = [
    'createLine',
    'updateLines',
    'removeLines'
  ]
  const listStoreActions = [
    'createList',
    'updateLists',
    'removeLists'
  ]
  const spaceStoreActions = [
    'loadSpace'
  ]
  const globalActionUnsubscribe = globalStore.$onAction(
    async ({ name, args }) => {
      if (globalStoreActions.includes(name)) {
        await nextTick()
        updateThrottle()
      } else if (name === 'triggerSonarPing') {
        const ping = args[0]
        createPingRipples(ping)
      }
    }
  )
  const cardActionUnsubscribe = cardStore.$onAction(
    ({ name, args }) => {
      if (cardStoreActions.includes(name)) {
        updateThrottle()
      }
    }
  )
  const connectionActionUnsubscribe = connectionStore.$onAction(
    ({ name, args }) => {
      if (connectionStoreActions.includes(name)) {
        updateThrottle()
      }
    }
  )
  const boxActionUnsubscribe = boxStore.$onAction(
    ({ name, args }) => {
      if (boxStoreActions.includes(name)) {
        updateThrottle()
      }
    }
  )
  const lineActionUnsubscribe = lineStore.$onAction(
    ({ name, args }) => {
      if (lineStoreActions.includes(name)) {
        updateThrottle()
      }
    }
  )
  const listActionUnsubscribe = listStore.$onAction(
    ({ name, args }) => {
      if (listStoreActions.includes(name)) {
        updateThrottle()
      }
    }
  )
  const spaceActionUnsubscribe = spaceStore.$onAction(
    ({ name, args }) => {
      if (spaceStoreActions.includes(name)) {
        updateThrottle()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
    cardActionUnsubscribe()
    connectionActionUnsubscribe()
    boxActionUnsubscribe()
    lineActionUnsubscribe()
    listActionUnsubscribe()
    spaceActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScroll)
  window.removeEventListener('resize', update)
  window.removeEventListener('pointerup', endPanningViewport, true)
  window.removeEventListener('pointermove', panViewport)
  window.cancelAnimationFrame(pingFrameId)
  unsubscribes()
})

watch(() => globalStore.isLoadingSpace, async (value, prevValue) => {
  await nextTick()
  update()
})

const emit = defineEmits(['updateCount', 'updateViewportRectPosition'])

const props = defineProps({
  visible: Boolean,
  size: Number,
  pageHeight: Number,
  pageWidth: Number,
  space: Object,
  viewportIsHidden: Boolean,
  viewportRect: Object, // optional {x, y, width, height} in space coordinates, dragging emits a new position instead of scrolling
  backgroundColor: String,
  parentIsDialog: Boolean,
  preventAnimation: Boolean
})
const state = reactive({
  scrollX: 0,
  scrollY: 0,
  isPanningViewport: false,
  prevPosition: {}
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    update()
  }
})
watch(() => props.space, (value, prevValue) => {
  if (value) {
    update()
  }
})
watch(() => props.size, (value, prevValue) => {
  if (value) {
    update()
  }
})

const pageHeight = computed(() => {
  return props.pageHeight || globalStore.pageHeight
})
const pageWidth = computed(() => {
  return props.pageWidth || globalStore.pageWidth
})
const ratio = computed(() => {
  if (pageWidth.value > pageHeight.value) {
    return props.size / pageWidth.value
  } else {
    return props.size / pageHeight.value
  }
})
const shouldIncreaseUIContrast = computed(() => userStore.shouldIncreaseUIContrast)
const styles = computed(() => {
  let color = props.backgroundColor || globalStore.outsideSpaceBackgroundColor
  if (!props.parentIsDialog && !shouldIncreaseUIContrast.value) {
    color = colord(color).alpha(0.8).toRgbString()
  }
  return { backgroundColor: color }
})

// canvas

const updateThrottle = throttle((color) => {
  update()
}, 100) // 10fps

const update = async () => {
  await nextTick()
  if (!props.visible) { return }
  await updateCanvas()
  if (!canvas) { return }
  // draw everything to the offscreen canvas so all layers are composited before anything appears on screen.
  const visibleContext = context
  context = offscreenContext
  if (!context) { return }
  await drawDrawing()
  drawBoxes()
  drawConnections()
  drawLists()
  drawCards()
  drawLines()
  // Blit the fully-composited offscreen canvas to the visible canvas to prevent flickering
  context = visibleContext
  context.clearRect(0, 0, state.pageWidth, state.pageHeight)
  context.drawImage(offscreenCanvas, 0, 0, state.pageWidth, state.pageHeight)
}
const updateCanvas = async () => {
  await nextTick()
  state.pageWidth = Math.round(pageWidth.value * ratio.value)
  state.pageHeight = Math.round(pageHeight.value * ratio.value)
  updateScroll()
  canvas = canvasElement.value
  if (!canvas) { return }
  const targetWidth = state.pageWidth * window.devicePixelRatio
  const targetHeight = state.pageHeight * window.devicePixelRatio
  if (!targetWidth || !targetHeight) { return }
  // only resize when dimensions change to prevent flickering
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth
    canvas.height = targetHeight
    canvas.style.width = state.pageWidth + 'px'
    canvas.style.height = state.pageHeight + 'px'
    context = canvas.getContext('2d')
    context.scale(window.devicePixelRatio, window.devicePixelRatio)
  }
  // Reuse offscreen canvas when dimensions match, just clear it
  if (!offscreenCanvas || offscreenCanvas?.width !== targetWidth || offscreenCanvas?.height !== targetHeight) {
    offscreenCanvas = new OffscreenCanvas(targetWidth, targetHeight)
    offscreenContext = offscreenCanvas.getContext('2d')
    offscreenContext.scale(window.devicePixelRatio, window.devicePixelRatio)
  } else {
    offscreenContext.clearRect(0, 0, state.pageWidth, state.pageHeight)
  }
}

// drawing

const drawDrawing = () => {
  if (props.space) { return Promise.resolve() } // drawing only applies to the current space
  const dataUrl = globalStore.drawingDataUrl
  if (!dataUrl) { return Promise.resolve() }
  // Reuse cached image if the data URL hasn't changed
  if (cachedDrawingImage && cachedDrawingDataUrl === dataUrl) {
    const width = cachedDrawingImage.width * ratio.value
    const height = cachedDrawingImage.height * ratio.value
    context.drawImage(cachedDrawingImage, 0, 0, width, height)
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      cachedDrawingImage = image
      cachedDrawingDataUrl = dataUrl
      const width = image.width * ratio.value
      const height = image.height * ratio.value
      context.drawImage(image, 0, 0, width, height)
      resolve()
    }
    image.onerror = resolve
    image.src = dataUrl
  })
}

// connections

const mapConnections = computed(() => {
  return props.space?.connections || connectionStore.getAllConnections
})
const updatePointWithRatio = (point) => {
  point.x = point.x * ratio.value
  point.y = point.y * ratio.value
  return point
}
const connectionIsValid = (connection) => {
  if (!props.space) {
    return connectionStore.getConnectionIsValid(connection)
  }
  const items = mapCards.value.concat(mapBoxes.value, mapLists.value)
  const startItem = items.find(item => item.id === connection.startItemId)
  const endItem = items.find(item => item.id === connection.endItemId)
  return Boolean(startItem && endItem)
}
const drawConnections = () => {
  const connections = mapConnections.value
  if (!connections.length) { return }
  for (const connection of connections) {
    if (!connectionIsValid(connection)) { continue }
    context.lineWidth = 1
    context.lineCap = 'round'
    context.strokeStyle = connection.color
    // update path with ratio
    let path = connection.path
    if (!path) { continue }
    let startCoords = utils.startCoordsFromConnectionPath(path)
    let endCoords = utils.endCoordsFromConnectionPath(path)
    let controlPoint = utils.curveControlPointFromPath(path)
    startCoords = updatePointWithRatio(startCoords)
    endCoords = updatePointWithRatio(endCoords)
    controlPoint = updatePointWithRatio(controlPoint)
    path = `m${startCoords.x},${startCoords.y} q${controlPoint.x},${controlPoint.y} ${endCoords.x},${endCoords.y}`
    path = new Path2D(path)
    context.stroke(path)
  }
}

// boxes

const mapBoxes = computed(() => {
  return props.space?.boxes || boxStore.getAllBoxes
})
const drawBoxes = () => {
  const boxes = mapBoxes.value
  const r = ratio.value
  context.lineWidth = 1
  for (const box of boxes) {
    const x = box.x * r
    const y = box.y * r
    const width = box.resizeWidth * r
    const height = box.resizeHeight * r
    const rect = new Path2D()
    rect.roundRect(x, y, width, height, itemRadius)
    context.strokeStyle = box.color
    context.stroke(rect)
    if (box.fill === 'filled') {
      context.fillStyle = box.color
      context.globalAlpha = 0.5
      context.fill(rect)
      context.globalAlpha = 1
    }
  }
}

// lines

const mapLines = computed(() => {
  return props.space?.lines || lineStore.getAllLines
})
const drawLines = () => {
  const lines = mapLines.value
  if (!lines.length) { return }
  const r = ratio.value
  const width = Math.floor(pageWidth.value * r)
  context.lineWidth = 1
  for (const line of lines) {
    const y = Math.floor(line.y * r)
    context.strokeStyle = line.color
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  }
}

// lists

const mapLists = computed(() => {
  return props.space?.lists || listStore.getAllLists
})
const drawLists = () => {
  const lists = mapLists.value
  const r = ratio.value
  for (const list of lists) {
    const x = list.x * r
    const y = list.y * r
    const width = (list.resizeWidth || consts.normalCardWrapWidth) * r
    const height = (list.height || consts.listEmptyHeight) * r
    const rect = new Path2D()
    rect.roundRect(x, y, width, height, itemRadius)
    context.fillStyle = list.color
    context.fill(rect)
  }
}

// cards

const mapCards = computed(() => {
  return props.space?.cards || cardStore.getAllCards
})
const drawCards = () => {
  const defaultColor = utils.cssVariable('secondary-background')
  const cards = mapCards.value
  const r = ratio.value
  for (const card of cards) {
    const x = card.x * r
    const y = card.y * r
    const width = (card.width || 200) * r
    const height = (card.height || 50) * r
    const rect = new Path2D()
    rect.roundRect(x, y, width, height, itemRadius)
    context.fillStyle = card.backgroundColor || defaultColor
    context.fill(rect)
  }
}

// sonar pings

const shouldPreventPing = (ping) => {
  let user
  // check remote user
  if (ping.isFromBroadcast) {
    user = spaceStore.getSpaceCollaboratorById(ping.user.id)
  // check current user
  } else {
    user = userStore.getUserIsSpaceMember
  }
  if (!user) {
    return true
  }
}
const createPingRipples = (ping) => {
  if (!props.visible) { return }
  if (props.space) { return } // pings only apply to the current space
  if (shouldPreventPing(ping)) { return }
  const rippleCount = 4
  const { x, y } = ping
  const color = colord(ping.color).toHsl()
  for (let i = 1; i < rippleCount + 1; i++) {
    const decay = Math.pow(0.65, i)
    const ripple = {
      x,
      y,
      color,
      radius: 1,
      speed: 1,
      decay,
      lineWidth: 3,
      shouldDestroy: false,
      opacity: 1
    }
    pingRipples.push(ripple)
  }
  if (!pingFrameId) {
    pingFrameId = window.requestAnimationFrame(pingFrame)
  }
}
const updatePingCanvas = () => {
  pingCanvas = pingCanvasElement.value
  if (!pingCanvas) { return }
  const targetWidth = state.pageWidth * window.devicePixelRatio
  const targetHeight = state.pageHeight * window.devicePixelRatio
  if (pingCanvas.width !== targetWidth || pingCanvas.height !== targetHeight) {
    pingCanvas.width = targetWidth
    pingCanvas.height = targetHeight
    pingCanvas.style.width = state.pageWidth + 'px'
    pingCanvas.style.height = state.pageHeight + 'px'
    pingContext = pingCanvas.getContext('2d')
    pingContext.scale(window.devicePixelRatio, window.devicePixelRatio)
  }
}
const drawPingRipples = () => {
  const r = ratio.value
  pingContext.clearRect(0, 0, state.pageWidth, state.pageHeight)
  for (const ripple of pingRipples) {
    const { lineWidth, radius, color, opacity } = ripple
    const x = ripple.x * r
    const y = ripple.y * r
    pingContext.beginPath()
    pingContext.lineWidth = lineWidth
    pingContext.strokeStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${opacity})`
    pingContext.arc(x, y, radius, 0, 2 * Math.PI)
    pingContext.stroke()
    pingContext.closePath()
  }
}
const updatePingRipples = () => {
  const fadeRadius = 25
  const destroyRadius = 40
  for (const ripple of pingRipples) {
    ripple.radius += ripple.speed * ripple.decay
    if (ripple.lineWidth > 1) {
      ripple.lineWidth -= 0.1 * ripple.decay
    }
    if (ripple.radius > fadeRadius && ripple.opacity > 0) {
      ripple.opacity = Math.max(ripple.opacity - 0.1, 0)
    }
    if (ripple.radius > destroyRadius) {
      ripple.shouldDestroy = true
    }
  }
  pingRipples = pingRipples.filter(ripple => !ripple.shouldDestroy)
}
const pingFrame = () => {
  pingFrameId = null
  updatePingCanvas()
  if (!pingCanvas) {
    pingRipples = []
    return
  }
  drawPingRipples()
  updatePingRipples()
  // stop animating once the last frame has cleared the canvas
  if (pingRipples.length) {
    pingFrameId = window.requestAnimationFrame(pingFrame)
  } else {
    pingContext.clearRect(0, 0, state.pageWidth, state.pageHeight)
  }
}

// viewport

const updateScroll = () => {
  state.scrollX = window.scrollX
  state.scrollY = window.scrollY
}
const viewportRectStyle = computed(() => {
  const rect = props.viewportRect
  const r = ratio.value
  const styles = {
    left: `${rect.x * r}px`,
    top: `${rect.y * r}px`,
    width: `${rect.width * r}px`,
    height: `${rect.height * r}px`,
    borderColor: userStore.color
  }
  if (state.isPanningViewport) {
    styles.cursor = 'grabbing'
  }
  return styles
})
const viewportStyle = computed(() => {
  if (props.viewportRect) {
    return viewportRectStyle.value
  }
  const counterZoom = globalStore.getSpaceCounterZoomDecimal
  const offset = globalStore.spaceZoomOffset
  const color = userStore.color
  // viewport size in space coordinates
  const width = (globalStore.viewportWidth * counterZoom) * ratio.value
  const height = (globalStore.viewportHeight * counterZoom) * ratio.value
  // convert scroll position to space coordinates
  // the box is the intersection of the visible area with the space,
  // when zoomed out far enough to encompass the space it covers the whole minimap
  let left = ((state.scrollX - offset.x) * counterZoom) * ratio.value
  let top = ((state.scrollY - offset.y) * counterZoom) * ratio.value
  let right = Math.min(left + width, state.pageWidth)
  let bottom = Math.min(top + height, state.pageHeight)
  left = Math.max(left, 0)
  top = Math.max(top, 0)
  right = Math.max(right, left)
  bottom = Math.max(bottom, top)
  const styles = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${right - left}px`,
    height: `${bottom - top}px`,
    borderColor: color
  }
  if (state.isPanningViewport) {
    styles.cursor = 'grabbing'
  }
  return styles
})

// pan viewport

const positionInSpace = (event) => {
  const element = canvasElement.value
  if (!element) { return }
  const rect = element.getBoundingClientRect()
  let x = event.clientX - rect.left
  let y = event.clientY - rect.top
  x = x / ratio.value
  y = y / ratio.value
  return { x, y }
}
const spaceToScroll = (spacePos) => {
  // convert a space coordinate to a scroll position, inverse of the viewport mapping
  const zoom = globalStore.getSpaceZoomDecimal
  const offset = globalStore.spaceZoomOffset
  return {
    x: (zoom * spacePos.x) + offset.x,
    y: (zoom * spacePos.y) + offset.y
  }
}
const positionInViewportCenter = (position) => {
  const counterZoom = globalStore.getSpaceCounterZoomDecimal
  // offset by half the visible area in space coordinates
  let x = position.x - (globalStore.viewportWidth * counterZoom / 2)
  let y = position.y - (globalStore.viewportHeight * counterZoom / 2)
  x = Math.max(0, x)
  y = Math.max(0, y)
  return { x, y }
}
const panToPositionRightLeftClick = (event) => {
  if (props.viewportIsHidden) { return }
  const rightAndLeftButtons = 3
  const isRightAndLeftClick = rightAndLeftButtons === event.buttons
  if (!isRightAndLeftClick) { return }
  panToPosition(event)
}
const shouldPreventInteraction = computed(() => utils.isMobile() && !props.parentIsDialog)
const startPanningViewport = (event) => {
  if (props.viewportIsHidden) { return }
  state.isPanningViewport = true
  panToPosition(event)
}
const positionIsInViewportRect = (position) => {
  const rect = props.viewportRect
  const isInX = position.x >= rect.x && position.x <= rect.x + rect.width
  const isInY = position.y >= rect.y && position.y <= rect.y + rect.height
  return isInX && isInY
}
const moveViewportRectToPosition = (position) => {
  state.prevPosition = position
  if (positionIsInViewportRect(position)) { return }
  // center the rect on the position
  const rect = props.viewportRect
  emit('updateViewportRectPosition', {
    x: position.x - (rect.width / 2),
    y: position.y - (rect.height / 2)
  })
}
const panToPosition = (event) => {
  const position = positionInSpace(event)
  if (props.viewportRect) {
    moveViewportRectToPosition(position)
    return
  }
  const centerPosition = positionInViewportCenter(position)
  // convert space coordinates back to scroll coordinates
  const scroll = spaceToScroll(centerPosition)
  window.scrollTo({
    top: scroll.y,
    left: scroll.x,
    behavior: 'smooth'
  })
  state.prevPosition = position
}
const panViewport = (event) => {
  if (!state.isPanningViewport) { return }
  if (utils.isMobile()) { return } // disable touch pan because jittery
  if (event.touches) { return } // ^
  const position = positionInSpace(event)
  if (!position) { return }
  const delta = {
    x: position.x - state.prevPosition.x,
    y: position.y - state.prevPosition.y
  }
  if (props.viewportRect) {
    emit('updateViewportRectPosition', {
      x: props.viewportRect.x + delta.x,
      y: props.viewportRect.y + delta.y
    })
    state.prevPosition = position
    return
  }
  // delta is in space coordinates, scale to scroll coordinates
  const zoom = globalStore.getSpaceZoomDecimal
  window.scrollBy(delta.x * zoom, delta.y * zoom, 'instant')
  state.prevPosition = position
}
const endPanningViewport = (event) => {
  state.isPanningViewport = false
}
const viewportIsVisible = computed(() => {
  if (props.viewportIsHidden) { return }
  return true
})
</script>

<template lang="pug">
.minimap-canvas(v-if="props.visible" :style="styles" @pointerdown.stop="startPanningViewport" @mousedown.stop="panToPositionRightLeftClick" :class="{ 'translucent-minimap': !shouldIncreaseUIContrast, 'prevent-interaction': shouldPreventInteraction }")
  canvas#minimap-canvas(ref="canvasElement")
  canvas.sonar-pings(ref="pingCanvasElement")
  .viewport(v-if="viewportIsVisible" :style="viewportStyle" :class="{ blink: !props.preventAnimation }")
</template>

<style lang="stylus">
.minimap-canvas
  touch-action none
  border-radius var(--entity-radius)
  position relative
  margin 0
  padding 0
  &.translucent-minimap
    backdrop-filter blur(8px)
  &.prevent-interaction
    pointer-events none
  .sonar-pings
    position absolute
    top 0
    left 0
    pointer-events none
    border-radius var(--entity-radius)
  .viewport
    cursor grab
    position absolute
    border 2px solid
    border-radius 5px
    box-shadow var(--hover-shadow)
    max-width 100%
    max-height 100%

</style>
