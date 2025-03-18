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

onMounted(() => {
  window.addEventListener('pointerup', endDrawing)
  canvas = document.getElementById('drawing-canvas')
  context = canvas.getContext('2d')
  context.scale(window.devicePixelRatio, window.devicePixelRatio)

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
  const { x, y } = utils.cursorPositionInPage(event)
  // console.log('💐💐', x, y)
  const color = strokeColor.value
  const radius = strokeDiameter.value / 2
  context.beginPath()
  context.arc(x, y, radius, 0, 2 * Math.PI)
  context.closePath()
  context.fillStyle = color
  context.fill()
  stroke.push({
    x,
    y,
    color
    // scrollX: window.scrollX,
    // scrollY: window.scrollY,
    // elapsedTime: Date.now() - recordStartTime,
  })
}

// draw

const draw = (event) => {
  if (!isDrawing) { return }
  const drawingEraserIsActive = store.state.drawingEraserIsActive
  const { x, y } = utils.cursorPositionInPage(event)
  // console.log('💐💐', x, y)
  const color = strokeColor.value
  context.lineCap = context.lineJoin = 'round'
  context.strokeStyle = color
  context.lineWidth = strokeDiameter.value
  stroke.push({
    x,
    y,
    color
    // scrollX: window.scrollX,
    // scrollY: window.scrollY,
    // elapsedTime: Date.now() - recordStartTime,
  })
  context.beginPath()
  context.moveTo(stroke[0].x, stroke[0].y)
  stroke.forEach((point) => {
    context.lineTo(point.x, point.y)
  })
  context.stroke()

  // TODO broadcast
}

// stop

const endDrawing = (event) => {
  if (!toolbarIsDrawing.value) { return }
  strokes.push(stroke)
  stroke = []
  isDrawing = false
  // pageCanvas.getContext('2d').drawImage(canvas, prevScroll.x / 2, prevScroll.y / 2, canvas.width / 2, canvas.height / 2)
  // context.clearRect(0,0, canvas.width, canvas.height)

  // if (!stroke.length) { }
  // await? save to api operation (saves strokes, rasterizes and saves latest.
  // re-rasterize on demand to prevent conflicts??)
  // await? rasterize and save cached version
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
