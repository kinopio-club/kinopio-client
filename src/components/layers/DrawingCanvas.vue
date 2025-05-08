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
let currentStrokes = []
let remoteStrokes = []
let redoStrokes = []
let drawingImage, drawingImageUrl

let unsubscribe, unsubscribeActions

onMounted(() => {
  canvas = canvasElement.value
  context = canvas.getContext('2d')
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  window.addEventListener('pointerup', endDrawing)
  window.addEventListener('scroll', scroll)
  window.addEventListener('resize', updateCanvasSize)
  updatePrevScroll()
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
    } else if (mutation.type === 'triggerDrawingUndo') {
      undo()
    } else if (mutation.type === 'triggerDrawingRedo') {
      redo()
    } else if (mutation.type === 'triggerRestoreSpaceLocalComplete') { // TODO replace w spaceStore restoreSpace watcher
      clearCanvas()
      redraw()
    } else if (mutation.type === 'triggerDrawingRedraw') {
      redraw()
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
  window.removeEventListener('resize', updateCanvasSize)
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
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const toolbarIsDrawing = computed(() => store.state.currentUserToolbar === 'drawing')
const styles = computed(() => {
  const value = {
    top: state.prevScroll.y + 'px',
    left: state.prevScroll.x + 'px'
  }
  return value
})

// clear

const clearCanvas = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)
}
const clearStrokes = () => {
  redoStrokes = []
  currentStrokes = []
  remoteStrokes = []
}

// points

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
const dataUrlFromOffscreenCanvas = (offscreenCanvas, type, quality) => {
  type = type || 'image/png'
  quality = quality || 0.8
  // cannot use canvas.toDataUrl() with offscreen canvas
  return new Promise((resolve, reject) => {
    offscreenCanvas.convertToBlob({ type, quality })
      .then(blob => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      })
      .catch(reject)
  })
}

const imageDataUrl = async (strokes) => {
  const offscreenCanvas = new OffscreenCanvas(pageWidth.value, pageHeight.value)
  const offscreenContext = offscreenCanvas.getContext('2d')
  offscreenContext.clearRect(0, 0, pageWidth.value, pageHeight.value)
  // render prev drawingImage
  if (drawingImage) {
    offscreenContext.drawImage(drawingImage, 0, 0)
  }
  // render strokes
  strokes.forEach(stroke => {
    if (!stroke || stroke.length === 0) { return }
    stroke.forEach((point, index) => {
      offscreenContext.globalCompositeOperation = 'source-over'
      if (point.isEraser) {
        offscreenContext.globalCompositeOperation = 'destination-out'
      }
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
  let dataUrl
  if (currentUserIsSignedIn.value) {
    dataUrl = dataUrlFromOffscreenCanvas(offscreenCanvas, 'image/webp', 0.5)
  } else {
    // anon users use png because dataUrl is saved to server on sign up/in
    dataUrl = dataUrlFromOffscreenCanvas(offscreenCanvas)
  }
  return dataUrl
}

// restore

const redrawSpaceDrawingImage = () => {
  const { x, y } = viewportPosition({ x: 0, y: 0 })
  context.drawImage(drawingImage, x, y)
}
const restoreSpaceDrawingImage = async () => {
  return new Promise((resolve, reject) => {
    let url = store.state.currentSpace.drawingImage
    if (!url) {
      resolve()
      return
    }
    if (url === drawingImageUrl) {
      redrawSpaceDrawingImage()
      resolve()
      return
    }
    try {
      const isDataUrl = url.startsWith('data:')
      const prevUrl = url
      if (!isDataUrl) {
        url = `${url}?q=${nanoid()}` // cache-busting
      }
      drawingImage = new Image()
      drawingImage.crossOrigin = 'anonymous' // cors
      drawingImage.onload = () => {
        redrawSpaceDrawingImage()
        drawingImageUrl = prevUrl
        resolve()
      }
      drawingImage.onerror = (error) => {
        console.error('🚒 drawingImage.onerror', error, url)
        reject(error)
      }
      drawingImage.src = url
    } catch (error) {
      console.error('🚒 restoreSpaceDrawingImage', error, url)
      reject(error)
    }
  })
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
  if (utils.isMultiTouch(event)) { return }
  if (!isDrawing) { return }
  currentStroke.push(createPoint(event))
  renderStroke(currentStroke)
  store.commit('triggerUpdateDrawingBackground')
}
const redraw = async () => {
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.globalCompositeOperation = 'source-over'
  await restoreSpaceDrawingImage()
  currentStrokes.forEach(stroke => {
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
  store.commit('triggerEndDrawing')
  store.dispatch('currentSpace/updateSpacePreviewImage')
}
const saveStroke = async ({ stroke, isRemovedStroke }) => {
  const strokes = currentStrokes.concat(remoteStrokes)
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
  currentStrokes.push(currentStroke)
  saveStroke({ stroke: currentStroke })
  currentStroke = []
  redoStrokes = []
  isDrawing = false
}

// undo redo

const undo = () => {
  const prevStroke = currentStrokes.pop() // remove last stroke
  redoStrokes.push(prevStroke) // append to redo stack
  redraw()
  saveStroke({ stroke: prevStroke, isRemovedStroke: true })
  broadcastRemoveStroke(prevStroke)
}
const redo = () => {
  if (!redoStrokes.length) { return }
  const prevStroke = redoStrokes.pop()
  currentStrokes.push(prevStroke)
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
const updateCanvasSize = debounce(() => {
  const zoom = store.getters.spaceCounterZoomDecimal
  canvas.width = viewportWidth.value * zoom
  canvas.height = viewportHeight.value * zoom
  redraw()
}, 20)
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
