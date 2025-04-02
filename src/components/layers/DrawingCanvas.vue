<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

import debounce from 'lodash-es/debounce'

const store = useStore()

const canvasElement = ref(null)
let canvas, context
let isDrawing = false
let currentStroke = []
let currentStrokes = []
let remoteStrokes = []
let dataUrl

let unsubscribe

onMounted(() => {
  canvas = canvasElement.value
  context = canvas.getContext('2d')
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  window.addEventListener('pointerup', endDrawing)
  window.addEventListener('scroll', scroll)
  window.addEventListener('resize', resize)
  updatePrevScroll()

  // TODO clear and restore canvas when loading/restoring space

  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerStartDrawing') {
      startDrawing(mutation.payload)
    } else if (mutation.type === 'triggerDraw') {
      draw(mutation.payload)
    } else if (mutation.type === 'spaceZoomPercent') {
      updateCanvasSize()
    } else if (mutation.type === 'triggerRenderRemoteDrawingStroke') {
      const stroke = mutation.payload.stroke
      remoteStrokes.push(stroke)
      renderStroke(stroke, true)
      store.commit('triggerUpdateDrawingBackground')
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', endDrawing)
  window.removeEventListener('scroll', scroll)
  window.removeEventListener('resize', resize)
  unsubscribe()
})

const state = reactive({
  prevScroll: { x: 0, y: 0 }
})

const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)
const pageHeight = computed(() => store.state.pageHeight)
const pageWidth = computed(() => store.state.pageWidth)

const toolbarIsDrawing = computed(() => store.state.currentUserToolbar === 'drawing')
const styles = computed(() => {
  let value = {
    top: state.prevScroll.y + 'px',
    left: state.prevScroll.x + 'px'
  }
  return value
})

const strokeColor = computed(() => store.getters['currentUser/drawingColor'])
const strokeDiameter = computed(() => {
  const diameter = store.state.currentUser.drawingBrushSize
  return consts.drawingBrushSizeDiameter[diameter]
})
const createPoint = (event) => {
  const { x, y } = utils.cursorPositionInSpace(event)
  return {
    x,
    y,
    color: strokeColor.value,
    diameter: strokeDiameter.value,
    isEraser: store.state.drawingEraserIsActive
  }
}

// broadcast

const broadcastStroke = (stroke, shouldPreventBroadcast) => {
  if (shouldPreventBroadcast) { return }
  store.commit('broadcast/update', {
    updates: {
      userId: store.state.currentUser.id,
      stroke
    },
    type: 'renderRemoteDrawingStroke',
    handler: 'triggerRenderRemoteDrawingStroke'
  })
}

// render

const viewportPosition = (point) => {
  return {
    x: point.x - state.prevScroll.x,
    y: point.y - state.prevScroll.y
  }
}
const renderPoint = (point, shouldPreventBroadcast) => {
  context.lineCap = context.lineJoin = 'round'
  const { x, y } = viewportPosition(point)
  context.globalCompositeOperation = 'source-over'
  if (point.isEraser) {
    context.globalCompositeOperation = 'destination-out'
  }
  const radius = point.diameter / 2
  context.beginPath()
  context.arc(x, y, radius, 0, 2 * Math.PI)
  context.closePath()
  context.fillStyle = point.color
  context.fill()
  broadcastStroke([point], shouldPreventBroadcast)
}
const renderStroke = (stroke, shouldPreventBroadcast) => {
  context.lineCap = context.lineJoin = 'round'
  if (stroke.length === 1) {
    renderPoint(stroke[0], shouldPreventBroadcast)
    return
  }
  const { x: x0, y: y0 } = viewportPosition(stroke[0])
  context.globalCompositeOperation = 'source-over'
  if (stroke[0].isEraser) {
    context.globalCompositeOperation = 'destination-out'
  }
  context.strokeStyle = stroke[0].color
  context.lineWidth = stroke[0].diameter
  context.beginPath()
  context.moveTo(x0, y0)
  stroke.forEach((point) => {
    const { x, y } = viewportPosition(point)
    context.lineTo(x, y)
  })
  context.stroke()
  broadcastStroke(stroke, shouldPreventBroadcast)
}
const imageDataUrl = async (strokes) => {
  const offscreenCanvas = new OffscreenCanvas(pageWidth.value, pageHeight.value)
  const offscreenContext = offscreenCanvas.getContext('2d')
  offscreenContext.clearRect(0, 0, pageWidth.value, pageHeight.value)
  strokes.forEach(stroke => {
    if (!stroke || stroke.length === 0) { return }
    stroke.forEach((point, index) => {
      if (index === 0) {
        offscreenContext.beginPath()
        offscreenContext.moveTo(point.x, point.y)
        return
      }
      offscreenContext.lineTo(point.x, point.y)
      offscreenContext.strokeStyle = point.color
      offscreenContext.lineWidth = point.diameter
      offscreenContext.lineCap = 'round'
      offscreenContext.lineJoin = 'round'
      offscreenContext.stroke()
      offscreenContext.moveTo(point.x, point.y)
    })
  })
  const blob = await offscreenCanvas.convertToBlob({ type: 'image/png' })
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// start

const startDrawing = (event) => {
  if (!toolbarIsDrawing.value) { return }
  store.dispatch('closeAllDialogs')
  isDrawing = true
  currentStroke = []
  const point = createPoint(event)
  renderStroke([point])
  currentStroke.push(point)
  store.commit('triggerUpdateDrawingBackground')
}

// draw

const draw = (event) => {
  if (!isDrawing) { return }
  currentStroke.push(createPoint(event))
  renderStroke(currentStroke)
  store.commit('triggerUpdateDrawingBackground')
}

const clear = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)
}
const redraw = () => {
  clear()
  currentStrokes.forEach(stroke => {
    renderStroke(stroke, true)
  })
  remoteStrokes.forEach(stroke => {
    renderStroke(stroke, true)
  })
  store.commit('triggerUpdateDrawingBackground')
}

// stop

const endDrawing = async (event) => {
  if (!toolbarIsDrawing.value) { return }
  if (!currentStroke.length) {
    isDrawing = false
    return
  }
  currentStrokes.push(currentStroke)
  const strokes = currentStrokes.concat(remoteStrokes)
  dataUrl = await imageDataUrl(strokes)
  console.log('🅰️', dataUrl.length, dataUrl)
  // TODO cache dataUrl space.drawing ?
  store.commit('addToDrawingStrokeColors', currentStroke[0].color)
  // TODO save to api operation (not await)
  currentStroke = []
  isDrawing = false
}

// scroll and resize

const updatePrevScroll = () => {
  state.prevScroll = {
    x: window.scrollX,
    y: window.scrollY
  }
}
const scroll = () => {
  updatePrevScroll()
  redraw()
}
const resize = debounce(() => {
  redraw()
}, 20)
const updateCanvasSize = debounce(() => {
  const zoom = store.getters.spaceCounterZoomDecimal
  canvas.width = viewportWidth.value * zoom
  canvas.height = viewportHeight.value * zoom
  redraw()
}, 20)
</script>

<template lang="pug">
canvas#drawing-canvas.drawing-canvas(
  ref="canvasElement"
  :width="viewportWidth"
  :height="viewportHeight"
  :style="styles"
)
</template>

<style lang="stylus">
canvas.drawing-canvas
  position fixed
  background transparent
  top 0
  left 0
  opacity 1
  pointer-events none
  z-index var(--max-z) // because card z
  mix-blend-mode hard-light
</style>
