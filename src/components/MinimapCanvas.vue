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
import { colord, extend } from 'colord'

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
const itemRadius = 1
const canvasElement = ref(null)

let unsubscribes

onMounted(async () => {
  update()
  window.addEventListener('scroll', updateScroll)
  window.addEventListener('resize', update)
  window.addEventListener('pointerup', endPanningViewport)
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
  window.removeEventListener('pointerup', endPanningViewport)
  window.removeEventListener('pointermove', panViewport)
  unsubscribes()
})

watch(() => globalStore.isLoadingSpace, async (value, prevValue) => {
  await nextTick()
  update()
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean,
  size: Number,
  pageHeight: Number,
  pageWidth: Number,
  space: Object,
  viewportIsHidden: Boolean,
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
const drawConnections = () => {
  const connections = mapConnections.value
  if (!connections.length) { return }
  for (const connection of connections) {
    if (!connectionStore.getConnectionIsValid(connection)) { continue }
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
  const width = Math.floor(globalStore.pageWidth * r)
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

// viewport

const updateScroll = () => {
  state.scrollX = window.scrollX
  state.scrollY = window.scrollY
}
const viewportStyle = computed(() => {
  const counterZoom = globalStore.getSpaceCounterZoomDecimal
  const origin = globalStore.zoomOrigin
  const color = userStore.color
  // viewport size in space coordinates (correct regardless of origin)
  let width = (globalStore.viewportWidth * counterZoom) * ratio.value
  let height = (globalStore.viewportHeight * counterZoom) * ratio.value
  // convert scroll position to space coordinates, accounting for zoom origin offset
  let left = (state.scrollX * counterZoom - origin.x * (counterZoom - 1)) * ratio.value
  let top = (state.scrollY * counterZoom - origin.y * (counterZoom - 1)) * ratio.value
  // constraints
  if (Math.round(left + width) > state.pageWidth) {
    left = Math.min(left, state.pageWidth)
    width = state.pageWidth - left
  }
  if (Math.round(top + height) > state.pageHeight) {
    top = Math.min(top, state.pageHeight)
    height = state.pageHeight - top
  }
  const styles = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    borderColor: color
  }
  if (state.isPanningViewport) {
    styles.cursor = 'grabbing'
  }
  return styles
})

// pan viewport

const positionInSpace = (event) => {
  const element = document.querySelector('#minimap-canvas')
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
  const origin = globalStore.zoomOrigin
  return {
    x: origin.x * (1 - zoom) + zoom * spacePos.x,
    y: origin.y * (1 - zoom) + zoom * spacePos.y
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
const startPanningViewport = (event) => {
  if (props.viewportIsHidden) { return }
  state.isPanningViewport = true
  panToPosition(event)
}
const panToPosition = (event) => {
  const position = positionInSpace(event)
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
  if (utils.isMobile(event)) { return } // disable touch pan because jittery
  if (event.touches) { return } // ^
  const position = positionInSpace(event)
  if (!position) { return }
  const delta = {
    x: position.x - state.prevPosition.x,
    y: position.y - state.prevPosition.y
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
.minimap-canvas(v-if="props.visible" :style="styles" @pointerdown.stop="startPanningViewport" @mousedown.stop="panToPositionRightLeftClick" :class="{ 'translucent-minimap': !shouldIncreaseUIContrast }")
  canvas#minimap-canvas(ref="canvasElement")
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
  .viewport
    cursor grab
    position absolute
    border 2px solid
    border-radius 5px
    box-shadow var(--hover-shadow)
    max-width 100%
    max-height 100%

</style>
