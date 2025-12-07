<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import drawingStrokesDOM from '@/components/layers/drawingStrokesDOM.vue'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

import { nanoid } from 'nanoid'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()
const broadcastStore = useBroadcastStore()

let isDrawing = false
let startPoint
let currentStroke = []
let currentStrokeId = ''
let spaceStrokes = []
let remoteStrokes = []
let redoStrokes = []

let unsubscribes

onMounted(async () => {
  window.addEventListener('pointerup', endDrawing)
  window.addEventListener('mouseup', endDrawing)
  window.addEventListener('touchend', endDrawing)
  clearDrawing()
  const globalActionUnsubscribe = globalStore.$onAction(
    async ({ name, args }) => {
      if (name === 'triggerStartDrawing') {
        startDrawing(args[0])
      } else if (name === 'triggerDraw') {
        draw(args[0])
      } else if (name === 'triggerAddRemoteDrawingStroke') {
        const stroke = args[0]
        remoteStrokes.push(stroke)
        renderStroke(stroke, true)
      } else if (name === 'triggerRemoveRemoteDrawingStroke') {
        const stroke = args[0].stroke
        remoteStrokes = remoteStrokes.filter(points => {
          return points[0].id !== stroke[0].id
        })
        redrawStrokes()
      } else if (name === 'triggerDrawingUndo') {
        undo()
      } else if (name === 'triggerDrawingRedo') {
        redo()
      } else if (name === 'triggerDrawingInitialize') {
        // perf: save spaceStore.drawingStrokes to var, and clear state
        spaceStrokes = utils.clone(spaceStore.drawingStrokes)
        spaceStrokes.reverse()
        spaceStore.drawingStrokes = []
        redrawStrokes()
        await updateDrawingDataUrl()
      } else if (name === 'triggerDrawingReset') {
        clearDrawing()
      } else if (name === 'triggerUpdateDrawingDataUrl') {
        await updateDrawingDataUrl()
        globalStore.triggerEndDrawing()
      }
    }
  )
  const spaceActionUnsubscribe = spaceStore.$onAction(
    ({ name, args }) => {
      const actions = ['loadSpace', 'changeSpace', 'createSpace']
      if (actions.includes(name)) {
        clearDrawing()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
    spaceActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', endDrawing)
  window.removeEventListener('mouseup', endDrawing)
  window.removeEventListener('touchend', endDrawing)
  unsubscribes()
})

const state = reactive({
  paths: []
})

const viewportHeight = computed(() => globalStore.viewportHeight)
const viewportWidth = computed(() => globalStore.viewportWidth)
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const toolbarIsDrawing = computed(() => globalStore.getToolbarIsDrawing)
const spaceComponentIsMounted = computed(() => globalStore.spaceComponentIsMounted)

// clear
const clearDrawing = () => {
  globalStore.drawingDataUrl = ''
  globalStore.drawingStrokeColors = []
  globalStore.drawingEraserIsActive = false
  redoStrokes = []
  spaceStrokes = []
  remoteStrokes = []
  state.paths = []
}

// points
const strokeColor = computed(() => userStore.getUserDrawingColor)
const strokeDiameter = computed(() => {
  const diameter = userStore.drawingBrushSize
  return consts.drawingBrushSizeDiameter[diameter]
})
const createPoint = (event) => {
  const { x, y } = utils.cursorPositionInSpace(event)
  const point = {
    id: currentStrokeId,
    x,
    y,
    color: strokeColor.value,
    diameter: strokeDiameter.value,
    isEraser: globalStore.drawingEraserIsActive
  }
  const isStraightLine = startPoint && event.shiftKey
  if (isStraightLine) {
    const xDelta = Math.abs(startPoint.x - point.x)
    const yDelta = Math.abs(startPoint.y - point.y)
    if (yDelta > xDelta) {
      point.x = startPoint.x
    } else {
      point.y = startPoint.y
    }
  }
  return point
}

// broadcast
const broadcastAddStroke = (stroke, shouldPreventBroadcast) => {
  if (shouldPreventBroadcast) { return }
  broadcastStore.update({
    updates: stroke,
    action: 'triggerAddRemoteDrawingStroke'
  })
}
const broadcastRemoveStroke = (stroke, shouldPreventBroadcast) => {
  if (shouldPreventBroadcast) { return }
  broadcastStore.update({
    updates: stroke,
    action: 'triggerRemoveRemoteDrawingStroke'
  })
}

// render

const createPathFromStroke = (stroke) => {
  if (!stroke || stroke.length === 0) return null
  let pathData = ''
  stroke.forEach((point, index) => {
    const { x, y } = point
    if (index === 0) {
      pathData = `M ${x} ${y}` // Move point to
    } else {
      pathData += ` L ${x} ${y}` // draw Line to
    }
  })
  const path = {
    id: stroke[0].id,
    type: 'path',
    d: pathData,
    color: stroke[0].color,
    width: stroke[0].diameter,
    isEraser: stroke[0].isEraser
  }
  // For a single point, complete the path by adding a line to the start point
  if (stroke.length === 1) {
    const line = path.d.replace('M', 'L')
    path.d = `${path.d} ${line}`
  }
  return path
}
const updatePaths = (path) => {
  const index = state.paths.findIndex(prevPath => prevPath.id === path.id)
  if (index !== -1) {
    state.paths[index] = path
  } else {
    state.paths.push(path)
  }
}
const renderStroke = (stroke, shouldPreventBroadcast) => {
  const path = createPathFromStroke(stroke)
  if (path) {
    updatePaths(path)
    broadcastAddStroke(stroke, shouldPreventBroadcast)
  }
}
// for minimap
const updateDrawingDataUrl = async () => {
  await nextTick()
  const element = document.querySelector('svg.drawing-strokes')
  const svgString = new XMLSerializer().serializeToString(element)
  const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))
  globalStore.drawingDataUrl = dataUrl
  broadcastStore.update({
    action: 'triggerUpdateDrawingDataUrl'
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
  startPoint = point
  currentStroke.push(point)
  renderStroke([point])
}

// draw

const allStrokes = () => {
  return spaceStrokes.concat(remoteStrokes)
}
const draw = (event) => {
  if (utils.isMultiTouch(event)) { return }
  if (!isDrawing) { return }
  currentStroke.push(createPoint(event))
  renderStroke(currentStroke)
}
const redrawStrokes = async () => {
  state.paths = []
  const allStrokes = [...spaceStrokes, ...remoteStrokes]
  allStrokes.forEach(stroke => {
    renderStroke(stroke, true)
  })
  updatePageSizes()
}

// stop

const saveStroke = async ({ stroke, isRemovedStroke }) => {
  const strokes = allStrokes()
  await updateDrawingDataUrl()
  globalStore.triggerEndDrawing()
  updatePageSizes()
  if (isRemovedStroke) {
    await apiStore.addToQueue({ name: 'removeDrawingStroke', body: { stroke } })
  } else {
    await apiStore.addToQueue({ name: 'createDrawingStroke', body: { stroke } })
  }
  await cache.updateSpace('drawingStrokes', strokes, spaceStore.id)
}
const endDrawing = async (event) => {
  if (!toolbarIsDrawing.value) { return }
  if (!currentStroke.length) {
    isDrawing = false
    startPoint = null
    return
  }
  // Only add to stroke colors if it's not an eraser
  if (!globalStore.drawingEraserIsActive) {
    globalStore.addToDrawingStrokeColors(currentStroke[0].color)
  }
  spaceStrokes.push(currentStroke)
  saveStroke({ stroke: currentStroke })
  currentStroke = []
  redoStrokes = []
  isDrawing = false
}

// undo redo

const undo = () => {
  const prevStroke = spaceStrokes.pop() // remove last stroke
  redoStrokes.push(prevStroke) // append to redo stack
  redrawStrokes()
  saveStroke({ stroke: prevStroke, isRemovedStroke: true })
  broadcastRemoveStroke(prevStroke)
}
const redo = () => {
  if (!redoStrokes.length) { return }
  const prevStroke = redoStrokes.pop()
  spaceStrokes.push(prevStroke)
  redrawStrokes()
  saveStroke({ stroke: prevStroke })
  broadcastAddStroke(prevStroke)
}

// page size

const updatePageSizes = () => {
  const strokes = allStrokes()
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
drawingStrokesDOM(:paths="state.paths")

//- duplicate ^ into Space.vue
teleport(to="#drawing-strokes-background" v-if="spaceComponentIsMounted")
  drawingStrokesDOM(:paths="state.paths")
</template>

<style lang="stylus">
</style>
