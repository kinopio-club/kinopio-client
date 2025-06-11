<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

import debounce from 'lodash-es/debounce'
import { nanoid } from 'nanoid'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()
const broadcastStore = useBroadcastStore()

const canvasElement = ref(null)
let canvas, context
let isDrawing = false
let currentStroke = []
let currentStrokeId = ''
let currentStrokes = []
let remoteStrokes = []
let redoStrokes = []
let drawingImage, drawingImageUrl

let unsubscribes

onMounted(() => {
  window.addEventListener('pointerup', endDrawing)
  window.addEventListener('mouseup', endDrawing)
  window.addEventListener('touchend', endDrawing)
  window.addEventListener('scroll', scroll)
  window.addEventListener('resize', updateCanvasSize)
  canvas = canvasElement.value
  context = canvas.getContext('2d')
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  updatePrevScroll()
  clearCanvas()
  clearStrokes()

  const globalStateUnsubscribe = globalStore.$subscribe(
    (mutation, state) => {
      const name = mutation.events.key
      const value = mutation.events.newValue
      if (name === 'spaceZoomPercent') {
        updateCanvasSize()
      }
    }
  )
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerStartDrawing') {
        startDrawing(args[0])
      } else if (name === 'triggerDraw') {
        draw(args[0])
      } else if (name === 'triggerAddRemoteDrawingStroke') {
        const stroke = args[0].stroke
        remoteStrokes.push(stroke)
        renderStroke(stroke, true)
        globalStore.triggerUpdateDrawingBackground()
      } else if (name === 'triggerRemoveRemoteDrawingStroke') {
        const stroke = args[0].stroke
        remoteStrokes = remoteStrokes.filter(points => {
          return points[0].id !== stroke[0].id
        })
        redraw()
      } else if (name === 'triggerDrawingUndo') {
        undo()
      } else if (name === 'triggerDrawingRedo') {
        redo()
      } else if (name === 'triggerRestoreSpaceLocalComplete') { // TODO replace w spaceStore restoreSpace watcher
        clearCanvas()
        redraw()
      } else if (name === 'triggerDrawingRedraw') {
        redraw()
      }
    }
  )
  const spaceActionUnsubscribe = spaceStore.$onAction(
    ({ name, args }) => {
      const actions = ['loadSpace', 'changeSpace', 'createSpace']
      if (actions.includes(name)) {
        clearStrokes()
      }
    }
  )
  unsubscribes = () => {
    globalStateUnsubscribe()
    globalActionUnsubscribe()
    spaceActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', endDrawing)
  window.removeEventListener('mouseup', endDrawing)
  window.removeEventListener('touchend', endDrawing)
  window.removeEventListener('scroll', scroll)
  window.removeEventListener('resize', updateCanvasSize)
  unsubscribes()
})

const state = reactive({
  prevScroll: { x: 0, y: 0 }
})

const viewportHeight = computed(() => globalStore.viewportHeight)
const viewportWidth = computed(() => globalStore.viewportWidth)
const pageHeight = computed(() => globalStore.pageHeight)
const pageWidth = computed(() => globalStore.pageWidth)
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const toolbarIsDrawing = computed(() => globalStore.getToolbarIsDrawing)
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

const strokeColor = computed(() => userStore.getUserDrawingColor)
const strokeDiameter = computed(() => {
  const diameter = userStore.drawingBrushSize
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
    isEraser: globalStore.drawingEraserIsActive
  }
}

// broadcast

const broadcastAddStroke = (stroke, shouldPreventBroadcast) => {
  if (shouldPreventBroadcast) { return }
  broadcastStore.update({
    updates: {
      userId: userStore.id,
      stroke
    },
    type: 'addRemoteDrawingStroke',
    handler: 'triggerAddRemoteDrawingStroke'
  })
}
const broadcastRemoveStroke = (stroke, shouldPreventBroadcast) => {
  if (shouldPreventBroadcast) { return }
  broadcastStore.update({
    updates: {
      userId: userStore.id,
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
    let url = spaceStore.drawingImage
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
  globalStore.closeAllDialogs()
  isDrawing = true
  currentStrokeId = nanoid()
  currentStroke = []
  const point = createPoint(event)
  renderStroke([point])
  currentStroke.push(point)
  globalStore.triggerUpdateDrawingBackground()
}

// draw

const draw = (event) => {
  if (utils.isMultiTouch(event)) { return }
  if (!isDrawing) { return }
  currentStroke.push(createPoint(event))
  renderStroke(currentStroke)
  globalStore.triggerUpdateDrawingBackground()
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
  globalStore.triggerUpdateDrawingBackground()
}

// stop

const updateCache = async (strokes) => {
  const dataUrl = await imageDataUrl(strokes)
  const currentSpaceId = spaceStore.id
  await cache.updateSpace('drawingImage', dataUrl, currentSpaceId)
  globalStore.triggerEndDrawing()
  spaceStore.updateSpacePreviewImage()
}
const saveStroke = async ({ stroke, isRemovedStroke }) => {
  const strokes = currentStrokes.concat(remoteStrokes)
  updateCache(strokes)
  updatePageSizes(strokes)
  if (isRemovedStroke) {
    await apiStore.addToQueue({ name: 'removeDrawingStroke', body: { stroke } })
  } else {
    await apiStore.addToQueue({ name: 'createDrawingStroke', body: { stroke } })
  }
}
const endDrawing = async (event) => {
  if (!toolbarIsDrawing.value) { return }
  if (!currentStroke.length) {
    isDrawing = false
    return
  }
  globalStore.addToDrawingStrokeColors(currentStroke[0].color)
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
  const zoom = globalStore.getSpaceCounterZoomDecimal
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
    width: globalStore.viewportWidth / 2,
    height: globalStore.viewportHeight / 2
  }
  const rect = {
    width: x + drawingBrushSizeDiameter + padding.width,
    height: y + drawingBrushSizeDiameter + padding.height
  }
  globalStore.updatePageSizesFromRect(rect)
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
