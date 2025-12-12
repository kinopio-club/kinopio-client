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

// clear
const clearDrawing = () => {
  globalStore.drawingDataUrl = ''
  globalStore.drawingStrokeColors = []
  globalStore.drawingEraserIsActive = false
  redoStack = []
  undoStack = []
  spaceStrokes = []
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
  const point = utils.cursorPositionInSpace(event)
  const svg = document.querySelector('svg.drawing-strokes')
  const svgPoint = svg.createSVGPoint()
  svgPoint.x = point.x
  svgPoint.y = point.y
  state.paths.forEach(path => {
    const element = document.querySelector(`.drawing-strokes path[data-id="${path.id}"]`)
    const data = element.dataset
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
  :width="pageWidth"
  :height="pageHeight"
)
  defs
    //- eraserMask is legacy
    //- current version does not have isEraser strokes
    mask#eraserMask
      rect(:width="pageWidth" :height="pageHeight" fill="white")
      template(v-for="path in state.paths" :key="path.id")
        template(v-if="path.isEraser")
          path(
            :d="path.d"
            stroke="black"
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
  //- drawing strokes
  g(:mask="'url(#eraserMask)'")
    template(v-for="path in state.paths" :key="path.id")
      template(v-if="!path.isEraser")
        path(
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
teleport(to="#drawing-strokes-background" v-if="spaceComponentIsMounted")
  svg.drawing-strokes(
    :width="pageWidth"
    :height="pageHeight"
  )
    defs
      //- eraserMask is legacy
      //- current version does not have isEraser strokes
      mask#eraserMask
        rect(:width="pageWidth" :height="pageHeight" fill="white")
        template(v-for="path in state.paths" :key="path.id")
          template(v-if="path.isEraser")
            path(
              :d="path.d"
              stroke="black"
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
    //- drawing strokes
    g(:mask="'url(#eraserMask)'")
      template(v-for="path in state.paths" :key="path.id")
        template(v-if="!path.isEraser")
          path(
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
#drawing-strokes-background
  svg.drawing-strokes
    mix-blend-mode normal
    z-index 0
</style>
