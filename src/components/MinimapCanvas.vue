<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

let unsubscribe

const canvasElement = ref(null)

const itemRadius = 1

let canvas, context
let startPanningPosition

onMounted(async () => {
  init()
  window.addEventListener('scroll', updateScroll)
  window.addEventListener('resize', init)
  window.addEventListener('pointerup', endPanningViewport)
  window.addEventListener('pointermove', panViewport)
  unsubscribe = store.subscribe(async mutation => {
    const type = mutation.type
    const mutations = [
      'isLoadingSpace',
      'currentSpace/loadSpace',
      'currentCards/update',
      'currentCards/updateMultiple',
      'currentCards/remove',
      'currentCards/removeResize',
      'currentCards/move',
      'currentCards/resize',
      'currentCards/paste',
      'currentCards/add',
      'currentBoxes/add',
      'currentBoxes/update',
      'currentBoxes/resize',
      'currentBoxes/move',
      'currentConnections/add',
      'currentConnections/update',
      'currentConnections/updatePaths',
      'currentConnections/updateMultiplePaths',
      'currentConnections/remove'
    ]
    if (mutations.includes(mutation.type)) {
      await nextTick()
      init()
    }
  })
})
onBeforeUnmount(() => {
  unsubscribe()
  window.removeEventListener('scroll', updateScroll)
  window.removeEventListener('resize', init)
  window.removeEventListener('pointerup', endPanningViewport)
  window.removeEventListener('pointermove', panViewport)
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
  return props.pageHeight || store.state.pageHeight
})
const pageWidth = computed(() => {
  return props.pageWidth || store.state.pageWidth
})
const ratio = computed(() => {
  if (pageWidth.value > pageHeight.value) {
    return props.size / pageWidth.value
  } else {
    return props.size / pageHeight.value
  }
})

const styles = computed(() => {
  let color = props.backgroundColor || store.state.outsideSpaceBackgroundColor
  return { backgroundColor: color }
})

// canvas

const init = async () => {
  if (!props.visible) { return }
  await initCanvas()
  if (!canvas) { return }
  drawBoxes()
  drawConnections()
  drawCards()
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

// connections

const mapConnections = computed(() => {
  return props.space?.connections || store.getters['currentConnections/all']
})
const mapConnectionTypes = computed(() => {
  return props.space?.connectionTypes || store.getters['currentConnections/allTypes']
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
  return props.space?.boxes || store.getters['currentBoxes/all']
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
    let rect = new Path2D()
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

// cards

const mapCards = computed(() => {
  return props.space?.cards || store.getters['currentCards/all']
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
    let rect = new Path2D()
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
  const zoom = store.getters.spaceCounterZoomDecimal
  const color = store.state.currentUser.color
  // viewport box
  let width = (store.state.viewportWidth * zoom) * ratio.value
  let height = (store.state.viewportHeight * zoom) * ratio.value
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
  let styles = {
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
  let x = position.x - (store.state.viewportWidth / 2)
  let y = position.y - (store.state.viewportHeight / 2)
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
  .blink
    animation-duration 0.2s
    animation-name blink
    animation-iteration-count infinite
    animation-direction alternate
    animation-timing-function ease-out
  @keyframes blink
    0%
      opacity 1
    100%
      opacity 0.6

</style>
