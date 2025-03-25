<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()

let canvas, context, prevScroll
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

const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)

const toolbarIsDrawing = computed(() => store.state.currentUserToolbar === 'drawing')

const strokeColor = computed(() => store.getters['currentUser/drawingColor'])
const strokeDiameter = computed(() => {
  const diameter = store.state.currentUser.drawingBrushSize
  return consts.drawingBrushSizeDiameter[diameter]
})

// start

const startDrawing = (event) => {
  if (!toolbarIsDrawing.value) { return }
  store.dispatch('closeAllDialogs')
  isDrawing = true
  stroke = []
  const { x, y } = utils.cursorPositionInViewport(event)
  const startPoint = createPoint(x, y)
  drawStartPoint(startPoint)
  stroke.push(startPoint)
}

// draw

const createPoint = (x, y) => {
  return {
    x,
    y,
    color: strokeColor.value,
    diameter: strokeDiameter.value,
    isEraser: store.state.drawingEraserIsActive,
    scrollX: prevScroll.x,
    scrollY: prevScroll.y
  }
}
const positionWithScroll = (point) => {
  let { x, y, scrollX, scrollY } = point
  x = x + scrollX
  y = y + scrollY
  return { x, y }
}
const drawStartPoint = (point) => {
  context.globalCompositeOperation = 'source-over'
  if (point.isEraser) {
    context.globalCompositeOperation = 'destination-out'
  }
  const { x, y } = positionWithScroll(point)
  const radius = point.diameter.value / 2
  context.beginPath()
  context.arc(x, y, radius, 0, 2 * Math.PI)
  context.closePath()
  context.fillStyle = point.color
  context.fill()
}
const drawStroke = (stroke) => {
  context.globalCompositeOperation = 'source-over'
  if (stroke[0].isEraser) {
    context.globalCompositeOperation = 'destination-out'
  }
  context.strokeStyle = stroke[0].color
  context.lineWidth = stroke[0].diameter
  stroke = stroke.map(point => {
    const { x, y } = positionWithScroll(point)
    point.x = x
    point.y = y
    return point
  })
  context.beginPath()
  context.moveTo(stroke[0].x, stroke[0].y)
  stroke.forEach((point) => {
    context.lineTo(point.x, point.y)
  })
  context.stroke()
}
const draw = (event) => {
  if (!isDrawing) { return }
  const { x, y } = utils.cursorPositionInViewport(event)
  context.lineCap = context.lineJoin = 'round'
  stroke.push(createPoint(x, y))
  drawStroke(stroke)
  // TODO broadcast
}

const clear = () => {
  const pageWidth = store.state.pageWidth
  const pageHeight = store.state.pageHeight
  context.clearRect(0, 0, pageWidth.value, pageHeight.value)
}
const redraw = () => {
  clear()
  strokes.forEach(stroke => {
    console.log('🅰️', stroke)

    //   context.beginPath()
    //   context.moveTo(stroke[0].x, stroke[0].y)
    //   stroke.forEach((point) => {
    //     context.lineTo(point.x, point.y)
    //   })
    //   context.stroke()
  })
}

// stop

const endDrawing = (event) => {
  if (!toolbarIsDrawing.value) { return }
  strokes.push(stroke)
  stroke = []
  isDrawing = false

  // await? save to api operation (saves strokes, rasterizes and saves latest.
  // re-rasterize on demand to prevent conflicts??) - only rasterize on server to maintain correct order
}

// scroll

const updatePrevScroll = () => {
  prevScroll = {
    x: window.scrollX,
    y: window.scrollY
  }
}
const scroll = (event) => {
  const scrollDelta = {
    x: window.scrollX - prevScroll.x,
    y: window.scrollY - prevScroll.y
  }
  updatePrevScroll()
  redraw()
}

</script>

<template lang="pug">
canvas#drawing-canvas(
  :width="viewportWidth"
  :height="viewportHeight"

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
