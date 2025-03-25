<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()

let canvas, context
let isDrawing = false
let stroke = []
let strokes = []

let unsubscribe

// TODO handle remote drawing broadcast received

onMounted(() => {
  canvas = document.getElementById('drawing-canvas')
  context = canvas.getContext('2d')
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  window.addEventListener('pointerup', endDrawing)
  window.addEventListener('scroll', scroll)
  updatePrevScroll()

  // TODO handle resize. clear and restore from rasterized

  // TODO clear and restore canvas when loading/restoring space

  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerStartDrawing') {
      startDrawing(mutation.payload)
    } else if (mutation.type === 'triggerDraw') {
      draw(mutation.payload)
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', endDrawing)
  window.removeEventListener('scroll', scroll)
  unsubscribe()
})

const state = reactive({
  prevScroll: { x: 0, y: 0 }
})

const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)

const toolbarIsDrawing = computed(() => store.state.currentUserToolbar === 'drawing')

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

// render

const viewportPosition = (point) => {
  return {
    x: point.x - state.prevScroll.x,
    y: point.y - state.prevScroll.y
  }
}
const renderPoint = (point) => {
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
}
const renderStroke = (stroke) => {
  if (stroke.length === 1) {
    renderPoint(stroke[0])
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
}

// start

const startDrawing = (event) => {
  if (!toolbarIsDrawing.value) { return }
  store.dispatch('closeAllDialogs')
  isDrawing = true
  stroke = []
  const point = createPoint(event)
  renderPoint(point)
  stroke.push(point)
}

// draw

const draw = (event) => {
  if (!isDrawing) { return }
  context.lineCap = context.lineJoin = 'round'
  stroke.push(createPoint(event))
  renderStroke(stroke)
  // TODO broadcast
}

const clear = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)
}
const redraw = () => {
  clear()
  strokes.forEach(stroke => {
    renderStroke(stroke)
  })
}

// stop

const endDrawing = (event) => {
  if (!toolbarIsDrawing.value) { return }
  strokes.push(stroke)
  stroke = []
  isDrawing = false

  // TODO await? save to api operation (saves strokes, rasterizes and saves latest.
  // re-rasterize on demand to prevent conflicts??) - only rasterize on server to maintain correct order
}

// scroll

const updatePrevScroll = () => {
  state.prevScroll = {
    x: window.scrollX,
    y: window.scrollY
  }
}
const scroll = (event) => {
  const scrollDelta = {
    x: window.scrollX - state.prevScroll.x,
    y: window.scrollY - state.prevScroll.y
  }
  updatePrevScroll()
  redraw()
}

const styles = computed(() => {
  return {
    top: state.prevScroll.y + 'px',
    left: state.prevScroll.x + 'px'
  }
})
</script>

<template lang="pug">
canvas#drawing-canvas(
  :width="viewportWidth"
  :height="viewportHeight"
  :style="styles"
)
</template>

<style lang="stylus" scoped>
canvas
  position fixed
  background transparent
  top 0
  left 0
  width 100dvw
  height 100dvh
  opacity 1
  pointer-events none
  z-index var(--max-z) // because card z
  // mix-blend-mode color-dodge
</style>
