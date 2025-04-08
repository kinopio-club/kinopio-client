<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

import debounce from 'lodash-es/debounce'
import { nanoid } from 'nanoid'

const store = useStore()

const canvasElement = ref(null)
let canvas, context
let isDrawing = false
let currentStroke = []
let currentStrokeId = ''
let currentUserStrokes = []
let remoteStrokes = []
let redoStrokes = []
let spaceDrawingImage = null

let unsubscribe, unsubscribeActions

onMounted(() => {
  canvas = canvasElement.value
  context = canvas.getContext('2d')
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  window.addEventListener('pointerup', endDrawing)
  window.addEventListener('scroll', scroll)
  window.addEventListener('resize', resize)
  updatePrevScroll()
  // TODO clear and restore canvas when loading/restoring space, clear redostrokes, currentuserstrokes
  clearCanvas()
  clearStrokes()
  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerStartDrawing') {
      startDrawing(mutation.payload)
    } else if (mutation.type === 'triggerDraw') {
      draw(mutation.payload)
    } else if (mutation.type === 'spaceZoomPercent') {
      updateCanvasSize()
    } else if (mutation.type === 'triggerAddRemoteDrawingStroke') {
      const stroke = mutation.payload.stroke
      remoteStrokes.push(stroke)
      renderStroke(stroke, true)
      store.commit('triggerUpdateDrawingBackground')
    } else if (mutation.type === 'triggerRemoveRemoteDrawingStroke') {
      const stroke = mutation.payload.stroke
      remoteStrokes = remoteStrokes.filter(points => {
        return points[0].id !== stroke[0].id
      })
      redraw()
      store.commit('triggerUpdateDrawingBackground')
    } else if (mutation.type === 'triggerDrawingUndo') {
      undo()
    } else if (mutation.type === 'triggerDrawingRedo') {
      redo()
    } else if (mutation.type === 'triggerRestoreSpaceLocalComplete' || mutation.type === 'triggerRestoreSpaceRemoteComplete') {
      clearCanvas()
      restoreSpaceDrawingImage()
    }
    unsubscribeActions = store.subscribeAction(action => {
      const actions = ['currentSpace/loadSpace', 'currentSpace/changeSpace', 'currentSpace/addSpace']
      if (actions.includes(action.type)) {
        clearStrokes()
      }
    })
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', endDrawing)
  window.removeEventListener('scroll', scroll)
  window.removeEventListener('resize', resize)
  unsubscribe()
  unsubscribeActions()
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
const clearCanvas = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)
  spaceDrawingImage = null
}
const clearStrokes = () => {
  redoStrokes = []
  currentUserStrokes = []
  remoteStrokes = []
}
const strokeColor = computed(() => store.getters['currentUser/drawingColor'])
const strokeDiameter = computed(() => {
  const diameter = store.state.currentUser.drawingBrushSize
  return consts.drawingBrushSizeDiameter[diameter]
})
const createPoint = (event) => {
  const { x, y } = utils.cursorPositionInSpace(event)
  return {
    id: currentStrokeId,
    x,
    y,
    color: strokeColor.value,
    diameter: strokeDiameter.value,
    isEraser: store.state.drawingEraserIsActive
  }
}
const updatePageSizes = (strokes) => {
  let x = 0
  let y = 0
  const drawingBrushSizeDiameter = consts.drawingBrushSizeDiameter.l // 40
  strokes.forEach(points => {
    points.forEach(point => {
      if (point.x > x) {
        x = point.x
      }
      if (point.y > y) {
        y = point.y
      }
    })
  })
  const padding = {
    width: store.state.viewportWidth / 2,
    height: store.state.viewportHeight / 2
  }
  const rect = {
    width: x + drawingBrushSizeDiameter + padding.width,
    height: y + drawingBrushSizeDiameter + padding.height
  }
  store.commit('updatePageSizes', rect)
}

// broadcast

const broadcastAddStroke = (stroke, shouldPreventBroadcast) => {
  if (shouldPreventBroadcast) { return }
  store.commit('broadcast/update', {
    updates: {
      userId: store.state.currentUser.id,
      stroke
    },
    type: 'addRemoteDrawingStroke',
    handler: 'triggerAddRemoteDrawingStroke'
  })
}
const broadcastRemoveStroke = (stroke, shouldPreventBroadcast) => {
  if (shouldPreventBroadcast) { return }
  store.commit('broadcast/update', {
    updates: {
      userId: store.state.currentUser.id,
      stroke
    },
    type: 'removeRemoteDrawingStroke',
    handler: 'triggerRemoveRemoteDrawingStroke'
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
  broadcastAddStroke([point], shouldPreventBroadcast)
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
  broadcastAddStroke(stroke, shouldPreventBroadcast)
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
  const blob = await offscreenCanvas.convertToBlob({ type: 'image/webp', quality: 0.5 }) // 35kb ~ 6 strokes
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
    // utils.downloadBlob(blob)
  })
}

// restore

const renderSpaceDrawingImage = () => {
  const { x, y } = viewportPosition({ x: 0, y: 0 })
  context.drawImage(spaceDrawingImage, x, y, pageWidth.value, pageHeight.value)
  store.commit('triggerUpdateDrawingBackground')
}
const restoreSpaceDrawingImage = async () => {
  let url = store.state.currentSpace.drawingImage
  if (!url) { return }
  const isDataUrl = url.startsWith('data:')
  if (!isDataUrl) {
    url = `${url}?q=${nanoid()}` // cache-busting
  }
  if (spaceDrawingImage) {
    renderSpaceDrawingImage()
  } else {
    spaceDrawingImage = new Image()
    spaceDrawingImage.onload = () => {
      renderSpaceDrawingImage()
    }
    spaceDrawingImage.src = url
  }
}

// start

const startDrawing = (event) => {
  if (!toolbarIsDrawing.value) { return }
  store.dispatch('closeAllDialogs')
  isDrawing = true
  currentStrokeId = nanoid()
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
const redraw = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)
  restoreSpaceDrawingImage()
  currentUserStrokes.forEach(stroke => {
    renderStroke(stroke, true)
  })
  remoteStrokes.forEach(stroke => {
    renderStroke(stroke, true)
  })
  store.commit('triggerUpdateDrawingBackground')
}

// stop

const updateCache = async (strokes) => {
  const dataUrl = await imageDataUrl(strokes)
  const currentSpaceId = store.state.currentSpace.id
  await cache.updateSpace('drawingImage', dataUrl, currentSpaceId)
}
const saveStroke = async ({ stroke, isRemovedStroke }) => {
  const strokes = currentUserStrokes.concat(remoteStrokes)
  updateCache(strokes)
  updatePageSizes(strokes)
  if (isRemovedStroke) {
    await store.dispatch('api/addToQueue', { name: 'removeDrawingStroke', body: { stroke } })
  } else {
    await store.dispatch('api/addToQueue', { name: 'createDrawingStroke', body: { stroke } })
  }
}
const endDrawing = async (event) => {
  if (!toolbarIsDrawing.value) { return }
  if (!currentStroke.length) {
    isDrawing = false
    return
  }
  store.commit('addToDrawingStrokeColors', currentStroke[0].color)
  currentUserStrokes.push(currentStroke)
  saveStroke({ stroke: currentStroke })
  currentStroke = []
  redoStrokes = []
  isDrawing = false
}

// undo redo

const undo = () => {
  const prevStroke = currentUserStrokes.pop() // remove last stroke
  redoStrokes.push(prevStroke) // append to redo stack
  redraw()
  saveStroke({ stroke: prevStroke, isRemovedStroke: true })
  broadcastRemoveStroke(prevStroke)
}
const redo = () => {
  if (!redoStrokes.length) { return }
  const prevStroke = redoStrokes.pop()
  currentUserStrokes.push(prevStroke)
  redraw()
  saveStroke({ stroke: prevStroke })
  broadcastAddStroke(prevStroke)
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
