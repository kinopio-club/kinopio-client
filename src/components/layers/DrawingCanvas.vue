<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

import throttle from 'lodash-es/throttle'

const store = useStore()

let canvas, context
let isDrawing = false
let currentStroke = []
let strokes = []

onMounted(() => {
  window.addEventListener('pointerup', endDrawing)
  canvas = document.getElementById('drawing-canvas')
  context = canvas.getContext('2d')
  context.scale(window.devicePixelRatio, window.devicePixelRatio)

  // TODO handle resize. clear and restore from rasterized

  // TODO subscribe: clear and restore canvas when loading/restoring space
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', endDrawing)
  // TODO unsubscribe
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
  currentStroke = []
}

// draw

const draw = throttle((event) => {
  if (!isDrawing) { return }
  const drawingEraserIsActive = store.state.drawingEraserIsActive
  const { x, y } = utils.cursorPositionInPage(event)
  console.log('💐💐', x, y)
  const color = strokeColor.value
  context.lineCap = context.lineJoin = 'round'
  context.strokeStyle = color
  context.lineWidth = strokeDiameter.value
  currentStroke.push({
    x,
    y,
    color
    // scrollX: window.scrollX,
    // scrollY: window.scrollY,
    // elapsedTime: Date.now() - recordStartTime,
  })
  context.beginPath()
  context.moveTo(currentStroke[0].x, currentStroke[0].y)
  currentStroke.forEach((point) => {
    context.lineTo(point.x, point.y)
  })
  context.stroke()

  // TODO broadcast
}, 16) // 60fps

// stop

const endDrawing = (event) => {
  if (!toolbarIsDrawing.value) { return }
  strokes.push(currentStroke)
  currentStroke = []
  isDrawing = false
  // pageCanvas.getContext('2d').drawImage(canvas, prevScroll.x / 2, prevScroll.y / 2, canvas.width / 2, canvas.height / 2)
  // context.clearRect(0,0, canvas.width, canvas.height)

  // if (!currentStroke.length) { }
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
  // mix-blend-mode multiply
</style>
