<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useLineStore } from '@/stores/useLineStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import cache from '@/cache.js'

import throttle from 'lodash-es/throttle'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const lineStore = useLineStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let canvas, context
let startPanningPosition
const itemRadius = 1
const canvasElement = ref(null)

let unsubscribes

onMounted(async () => {
  init()
  window.addEventListener('scroll', updateScroll)
  window.addEventListener('resize', init)
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
  const spaceStoreActions = [
    'loadSpace'
  ]
  const globalActionUnsubscribe = globalStore.$onAction(
    async ({ name, args }) => {
      if (globalStoreActions.includes(name)) {
        await nextTick()
        initThrottle()
      }
    }
  )
  const cardActionUnsubscribe = cardStore.$onAction(
    ({ name, args }) => {
      if (cardStoreActions.includes(name)) {
        initThrottle()
      }
    }
  )
  const connectionActionUnsubscribe = connectionStore.$onAction(
    ({ name, args }) => {
      if (connectionStoreActions.includes(name)) {
        initThrottle()
      }
    }
  )
  const boxActionUnsubscribe = boxStore.$onAction(
    ({ name, args }) => {
      if (boxStoreActions.includes(name)) {
        initThrottle()
      }
    }
  )
  const lineActionUnsubscribe = lineStore.$onAction(
    ({ name, args }) => {
      if (lineStoreActions.includes(name)) {
        initThrottle()
      }
    }
  )
  const spaceActionUnsubscribe = spaceStore.$onAction(
    ({ name, args }) => {
      if (spaceStoreActions.includes(name)) {
        initThrottle()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
    cardActionUnsubscribe()
    connectionActionUnsubscribe()
    boxActionUnsubscribe()
    lineActionUnsubscribe()
    spaceActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScroll)
  window.removeEventListener('resize', init)
  window.removeEventListener('pointerup', endPanningViewport)
  window.removeEventListener('pointermove', panViewport)
  unsubscribes()
})

watch(() => globalStore.isLoadingSpace, async (value, prevValue) => {
  await nextTick()
  init()
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean,
  size: Number,
  pageHeight: Number,
  pageWidth: Number,
  space: Object,
  viewportIsHidden: Boolean,
  backgroundColor: String
})
const state = reactive({
  scrollX: 0,
  scrollY: 0,
  isPanningViewport: false,
  prevPosition: {}
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    init()
  }
})
watch(() => props.space, (value, prevValue) => {
  if (value) {
    init()
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

const styles = computed(() => {
  const color = props.backgroundColor || globalStore.outsideSpaceBackgroundColor
  return { backgroundColor: color }
})

// canvas

const initThrottle = throttle((color) => {
  init()
}, 100) // 10fps

const init = async () => {
  await nextTick()
  if (!props.visible) { return }
  await initCanvas()
  if (!canvas) { return }
  await drawDrawing()
  drawBoxes()
  drawConnections()
  drawCards()
  drawLines()
}
const initCanvas = async () => {
  await nextTick()
  state.pageWidth = Math.round(pageWidth.value * ratio.value)
  state.pageHeight = Math.round(pageHeight.value * ratio.value)
  updateScroll()
  canvas = canvasElement.value
  if (!canvas) { return }
  context = canvas.getContext('2d')
  canvas.width = state.pageWidth * window.devicePixelRatio
  canvas.height = state.pageHeight * window.devicePixelRatio
  canvas.style.width = state.pageWidth + 'px'
  canvas.style.height = state.pageHeight + 'px'
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  context.clearRect(0, 0, canvas.width, canvas.height)
}

// drawing

const drawDrawing = async () => {
  if (!globalStore.drawingImageUrl) { return }
  const image = new Image()
  image.onload = () => {
    const width = image.width * ratio.value
    const height = image.height * ratio.value
    context.drawImage(image, 0, 0, width, height)
  }
  image.src = globalStore.drawingImageUrl
}

// connections

const mapConnections = computed(() => {
  return props.space?.connections || connectionStore.getAllConnections
})
const mapConnectionTypes = computed(() => {
  return props.space?.connectionTypes || connectionStore.getAllConnectionTypes
})
const updatePointWithRatio = (point) => {
  point.x = point.x * ratio.value
  point.y = point.y * ratio.value
  return point
}
const drawConnections = () => {
  const connectionTypes = mapConnectionTypes.value
  const connections = mapConnections.value
  for (const connection of connections) {
    context.lineWidth = 1
    context.lineCap = 'round'
    const type = connectionTypes.find(connectionType => connectionType.id === connection.connectionTypeId)
    if (!type) { continue }
    context.strokeStyle = type.color
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
  let boxes = mapBoxes.value
  boxes = utils.clone(boxes)
  boxes = boxes.map(box => {
    box.x = box.x * ratio.value
    box.y = box.y * ratio.value
    box.width = box.resizeWidth * ratio.value
    box.height = box.resizeHeight * ratio.value
    return box
  })
  boxes.forEach(box => {
    const rect = new Path2D()
    rect.roundRect(box.x, box.y, box.width, box.height, itemRadius)
    context.strokeStyle = box.color
    context.lineWidth = 1
    context.stroke(rect)
    if (box.fill === 'filled') {
      context.fillStyle = box.color
      context.globalAlpha = 0.5
      context.fill(rect)
      context.globalAlpha = 1
    }
  })
}

// lines

const mapLines = computed(() => {
  return props.space?.lines || lineStore.getAllLines
})
const drawLines = () => {
  const lines = mapLines.value
  lines.forEach(line => {
    const width = Math.floor(globalStore.pageWidth * ratio.value)
    const y = Math.floor(line.y * ratio.value)
    context.strokeStyle = line.color
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  })
}

// cards

const mapCards = computed(() => {
  return props.space?.cards || cardStore.getAllCards
})
const drawCards = () => {
  const defaultColor = utils.cssVariable('secondary-background')
  let cards = mapCards.value
  cards = utils.clone(cards)
  cards = cards.map(card => {
    const width = card.width || 200
    const height = card.height || 50
    card.x = card.x * ratio.value
    card.y = card.y * ratio.value
    card.width = width * ratio.value
    card.height = height * ratio.value
    return card
  })
  cards.forEach(card => {
    const rect = new Path2D()
    rect.roundRect(card.x, card.y, card.width, card.height, itemRadius)
    context.fillStyle = card.backgroundColor || defaultColor
    context.fill(rect)
  })
}

// viewport

const updateScroll = () => {
  state.scrollX = window.scrollX
  state.scrollY = window.scrollY
}
const viewportStyle = computed(() => {
  const zoom = globalStore.getSpaceCounterZoomDecimal
  const color = userStore.color
  // viewport box
  let width = (globalStore.viewportWidth * zoom) * ratio.value
  let height = (globalStore.viewportHeight * zoom) * ratio.value
  let left = (state.scrollX * zoom) * ratio.value
  let top = (state.scrollY * zoom) * ratio.value
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
const positionInViewportCenter = (position) => {
  let x = position.x - (globalStore.viewportWidth / 2)
  let y = position.y - (globalStore.viewportHeight / 2)
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
  window.scrollTo({
    top: centerPosition.y,
    left: centerPosition.x,
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
  window.scrollBy(delta.x, delta.y, 'instant')
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
.minimap-canvas(v-if="props.visible" :style="styles" @pointerdown="startPanningViewport" @mousedown="panToPositionRightLeftClick")
  canvas#minimap-canvas(ref="canvasElement")
  .viewport.blink(v-if="viewportIsVisible" :style="viewportStyle")
</template>

<style lang="stylus">
.minimap-canvas
  touch-action none
  border-radius var(--entity-radius)
  position relative
  margin 0
  padding 0
  .viewport
    cursor grab
    position absolute
    border 2px solid
    border-radius 5px
    box-shadow var(--hover-shadow)
    max-width 100%
    max-height 100%

</style>
