<script setup>

// stroke → paths [{ id, x, y, color }]

import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

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
let undoStack = [] // [{ type: 'add'|'remove', stroke }]
let redoStack = []
let movedStrokeIds = new Set()

let unsubscribes

onMounted(async () => {
  window.addEventListener('pointerup', endDrawing)
  clearDrawing()
  const globalActionUnsubscribe = globalStore.$onAction(
    async ({ name, args }) => {
      if (name === 'triggerStartDrawing') {
        startDrawing(args[0])
      } else if (name === 'triggerDraw') {
        draw(args[0])
      } else if (name === 'triggerAddDrawingStroke') {
        const stroke = args[0]
        spaceStrokes.push(stroke)
        renderStroke(stroke, true)
      } else if (name === 'triggerRemoveDrawingStroke') {
        const id = args[0].id
        state.paths = state.paths.filter(path => path.id !== id)
        spaceStrokes = spaceStrokes.filter(stroke => stroke[0].id !== id)
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
      } else if (name === 'triggerUpdateDrawingStrokes') {
        spaceStore.drawingStrokes = spaceStrokes
      } else if (name === 'triggerSelectDrawingStrokes') {
        selectStrokes(args[0])
      } else if (name === 'triggerMoveDrawingStrokes') {
        moveSelectedStrokes(args[0])
      } else if (name === 'triggerEndMoveDrawingStrokes') {
        await saveMovedStrokes()
      } else if (name === 'triggerUpdateRemoteDrawingStrokes') {
        const updates = args[0]
        updates.forEach(update => updateStroke(update.stroke))
      }
    }
  )
  const spaceActionUnsubscribe = spaceStore.$onAction(
    ({ name, args }) => {
      const actions = ['loadSpace', 'changeSpace', 'createSpace']
      if (actions.includes(name)) {
        clearDrawing()
      }
      if (name === 'duplicateSpace') {
        spaceStore.drawingStrokes = spaceStrokes
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

const pageHeight = computed(() => globalStore.pageHeight)
const pageWidth = computed(() => globalStore.pageWidth)
const viewportHeight = computed(() => globalStore.viewportHeight)
const viewportWidth = computed(() => globalStore.viewportWidth)
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const toolbarIsDrawing = computed(() => globalStore.getToolbarIsDrawing)
const spaceComponentIsMounted = computed(() => globalStore.spaceComponentIsMounted)
const strokesAreVisible = computed(() => Boolean(state.paths.length))

// clear
const clearDrawing = () => {
  globalStore.drawingDataUrl = ''
  globalStore.drawingStrokeColors = []
  globalStore.drawingEraserIsActive = false
  redoStack = []
  undoStack = []
  movedStrokeIds = new Set()
  spaceStrokes = []
  state.paths = []
  globalStore.multipleDrawingStrokesSelectedIds = []
  globalStore.remoteDrawingStrokesSelected = []
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
    diameter: strokeDiameter.value
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
    action: 'triggerAddDrawingStroke'
  })
}
const broadcastRemoveStroke = (stroke, shouldPreventBroadcast) => {
  if (shouldPreventBroadcast) { return }
  broadcastStore.update({
    updates: stroke,
    action: 'triggerRemoveDrawingStroke'
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
    width: stroke[0].diameter
  }
  // For a single point, complete the path by adding a line to the start point
  if (stroke.length === 1) {
    const line = path.d.replace('M', 'L')
    path.d = `${path.d} ${line}`
  }
  return path
}
const updatePaths = (path) => {
  path.rect = utils.rectFromDrawingStrokePath(path)
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
  let dataUrl = '' // no strokes
  if (element) {
    const svgString = new XMLSerializer().serializeToString(element)
    dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)))
  }
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
  if (globalStore.drawingEraserIsActive) { return }
  currentStrokeId = nanoid()
  currentStroke = []
  const point = createPoint(event)
  startPoint = point
  currentStroke.push(point)
  renderStroke([point])
}

// erase

const erasePath = (id) => {
  state.paths = state.paths.filter(path => path.id !== id)
  const stroke = spaceStrokes.find(stroke => stroke[0].id === id)
  if (!stroke) { return }
  undoStack.push({ type: 'remove', stroke })
  redoStack = []
  apiStore.addToQueue({ name: 'removeDrawingStroke', body: { stroke } })
  spaceStrokes = spaceStrokes.filter(stroke => stroke[0].id !== id)
  broadcastRemoveStroke({ id })
}
const erase = (event) => {
  const svg = document.querySelector('svg.drawing-strokes')
  if (!svg) { return }
  const point = utils.cursorPositionInSpace(event)
  const svgPoint = svg.createSVGPoint()
  svgPoint.x = point.x
  svgPoint.y = point.y
  state.paths.forEach(path => {
    const element = document.querySelector(`.drawing-strokes path[data-id="${path.id}"]`)
    if (!element) { return }
    if (element.isPointInStroke(svgPoint)) {
      erasePath(path.id)
    }
  })
}

// draw

const draw = (event) => {
  if (utils.isMultiTouch(event)) { return }
  if (!isDrawing) { return }
  if (globalStore.drawingEraserIsActive) {
    erase(event)
  } else {
    currentStroke.push(createPoint(event))
    renderStroke(currentStroke)
  }
}
const redrawStrokes = async () => {
  state.paths = []
  spaceStrokes.forEach(stroke => {
    renderStroke(stroke, true)
  })
  updatePageSizes()
}

// stop

const saveStroke = async ({ stroke, isUndoStroke }) => {
  await updateDrawingDataUrl()
  globalStore.triggerEndDrawing()
  updatePageSizes()
  if (isUndoStroke) {
    await apiStore.addToQueue({ name: 'removeDrawingStroke', body: { stroke } })
  } else {
    await apiStore.addToQueue({ name: 'createDrawingStroke', body: { stroke } })
  }
  await cache.updateSpace('drawingStrokes', spaceStrokes, spaceStore.id)
}
const endDrawing = async (event) => {
  if (!toolbarIsDrawing.value) { return }
  isDrawing = false
  // erase
  if (globalStore.drawingEraserIsActive) {
    await updateDrawingDataUrl()
    globalStore.triggerEndDrawing()
    await cache.updateSpace('drawingStrokes', spaceStrokes, spaceStore.id)
    startPoint = null
    currentStroke = []
  // no stroke
  } else if (!currentStroke.length) {
    startPoint = null
  } else {
  // stroke
    globalStore.addToDrawingStrokeColors(currentStroke[0].color)
    spaceStrokes.push(currentStroke)
    undoStack.push({ type: 'add', stroke: currentStroke })
    redoStack = []
    saveStroke({ stroke: currentStroke })
    currentStroke = []
  }
}

// select

const selectedStrokeColor = (path) => utils.invertColor(path.color)
const strokeIsSelected = (id) => {
  const isSelected = globalStore.multipleDrawingStrokesSelectedIds.includes(id)
  const isRemoteSelected = globalStore.remoteDrawingStrokesSelected.some(stroke => stroke.strokeId === id)
  return isSelected || isRemoteSelected
}
const selectStrokes = ({ position, zoom, direction }) => {
  const paths = state.paths.filter(path => {
    const x = path.rect.x * zoom
    const y = path.rect.y * zoom
    if (direction === 'above') {
      return y < position.y
    } else if (direction === 'below') {
      return y > position.y
    } else if (direction === 'right') {
      return x >= position.x
    } else if (direction === 'left') {
      return x <= position.x
    }
  })
  const ids = paths.map(path => path.id)
  globalStore.updateMultipleDrawingStrokesSelectedIds(ids)
}

// move

const updateStroke = (stroke) => {
  const id = stroke[0].id
  spaceStrokes = spaceStrokes.map(prevStroke => {
    if (prevStroke[0].id === id) { return stroke }
    return prevStroke
  })
  updatePaths(createPathFromStroke(stroke))
}
const moveSelectedStrokes = ({ endCursor, prevCursor }) => {
  const ids = globalStore.multipleDrawingStrokesSelectedIds
  if (!ids.length) { return }
  if (!endCursor || !prevCursor) { return }
  if (!userStore.getUserCanEditSpace) { return }
  const zoom = globalStore.getSpaceCounterZoomDecimal
  const delta = {
    x: (endCursor.x - prevCursor.x) * zoom,
    y: (endCursor.y - prevCursor.y) * zoom
  }
  if (!delta.x && !delta.y) { return }
  const updates = []
  ids.forEach(id => {
    const stroke = spaceStrokes.find(stroke => stroke[0].id === id)
    const path = state.paths.find(path => path.id === id)
    if (!stroke || !path) { return }
    // keep stroke inside the space
    const x = Math.max(delta.x, -path.rect.x)
    const y = Math.max(delta.y, -path.rect.y)
    const movedStroke = stroke.map(point => {
      return { ...point, x: point.x + x, y: point.y + y }
    })
    updateStroke(movedStroke)
    movedStrokeIds.add(id)
    updates.push({ id, stroke: movedStroke })
  })
  broadcastStore.update({
    updates,
    action: 'triggerUpdateRemoteDrawingStrokes'
  })
}
const saveMovedStrokes = async () => {
  if (!movedStrokeIds.size) { return }
  const strokes = spaceStrokes.filter(stroke => movedStrokeIds.has(stroke[0].id))
  movedStrokeIds = new Set()
  updatePageSizes()
  await updateDrawingDataUrl()
  globalStore.triggerEndDrawing()
  // there's no update stroke operation, so replace the saved stroke
  for (const stroke of strokes) {
    await apiStore.addToQueue({ name: 'removeDrawingStroke', body: { stroke } })
    await apiStore.addToQueue({ name: 'createDrawingStroke', body: { stroke } })
  }
  await cache.updateSpace('drawingStrokes', spaceStrokes, spaceStore.id)
}

// undo redo

const undo = () => {
  if (!undoStack.length) { return }
  const operation = undoStack.pop()
  redoStack.push(operation)
  if (operation.type === 'add') {
    // undo an add operation (remove the stroke)
    const stroke = operation.stroke
    spaceStrokes = spaceStrokes.filter(s => s[0].id !== stroke[0].id)
    state.paths = state.paths.filter(path => path.id !== stroke[0].id)
    saveStroke({ stroke, isUndoStroke: true })
    broadcastRemoveStroke(stroke)
  } else if (operation.type === 'remove') {
    // undo a remove operation (restore the stroke)
    const stroke = operation.stroke
    spaceStrokes.push(stroke)
    renderStroke(stroke, false)
    saveStroke({ stroke, isUndoStroke: false })
    broadcastAddStroke(stroke)
  }
  redrawStrokes()
}

const redo = () => {
  if (!redoStack.length) { return }
  const operation = redoStack.pop()
  undoStack.push(operation)
  if (operation.type === 'add') {
    // redo an add operation (restore the stroke)
    const stroke = operation.stroke
    spaceStrokes.push(stroke)
    renderStroke(stroke, false)
    saveStroke({ stroke, isUndoStroke: false })
    broadcastAddStroke(stroke)
  } else if (operation.type === 'remove') {
    // redo a remove operation (remove the stroke again)
    const stroke = operation.stroke
    spaceStrokes = spaceStrokes.filter(s => s[0].id !== stroke[0].id)
    state.paths = state.paths.filter(path => path.id !== stroke[0].id)
    saveStroke({ stroke, isUndoStroke: true })
    broadcastRemoveStroke(stroke)
  }
  redrawStrokes()
}

// page size

const updatePageSizes = () => {
  let x = 0
  let y = 0
  const drawingBrushSizeDiameter = consts.drawingBrushSizeDiameter.l // 40
  spaceStrokes.forEach(points => {
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
svg.drawing-strokes(
  v-if="strokesAreVisible"
  :width="pageWidth"
  :height="pageHeight"
)
  //- drawing strokes
  template(v-for="path in state.paths" :key="path.id")
    path(
      :class="{ selected: strokeIsSelected(path.id) }"
      :style="{ '--selected-stroke-color': selectedStrokeColor(path) }"
      :d="path.d"
      :stroke="path.color"
      :stroke-width="path.width"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      :data-id="path.id"
      :data-rect-x="path.rect.x"
      :data-rect-y="path.rect.y"
      :data-rect-width="path.rect.width"
      :data-rect-height="path.rect.height"
    )

//- duplicate ^ into Space.vue
teleport(to="#drawing-strokes-background" v-if="spaceComponentIsMounted && strokesAreVisible")
  svg.drawing-strokes(
    :width="pageWidth"
    :height="pageHeight"
    )
    //- drawing strokes
    template(v-for="path in state.paths" :key="path.id")
      path(
        :class="{ selected: strokeIsSelected(path.id) }"
        :style="{ '--selected-stroke-color': selectedStrokeColor(path) }"
        :d="path.d"
        :stroke="path.color"
        :stroke-width="path.width"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        :data-id="path.id"
        :data-rect-x="path.rect.x"
        :data-rect-y="path.rect.y"
        :data-rect-width="path.rect.width"
        :data-rect-height="path.rect.height"
      )
</template>

<style lang="stylus">
svg.drawing-strokes
  position absolute
  transform-origin top left
  background transparent
  top 0
  left 0
  opacity 1
  pointer-events none
  z-index var(--max-z)
  mix-blend-mode hard-light
  path.selected
    // css overrides the stroke attribute, but isn't included in the minimap data url
    stroke var(--selected-stroke-color)
#drawing-strokes-background
  svg.drawing-strokes
    mix-blend-mode normal
    z-index 0
</style>
