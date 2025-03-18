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

const preventTouchScrolling = (event) => {
  if (toolbarIsDrawing.value) {
    event.preventDefault()
  }
}

// styles

const drawingCursorStyles = (styles) => {
  if (!toolbarIsDrawing.value) { return }
  let diameter = store.state.currentUser.drawingBrushSize
  diameter = consts.drawingBrushSizeDiameter[diameter]
  const strokeWidth = 1
  const radius = diameter / 2
  const color = store.getters['currentUser/drawingColor']
  let svg
  // eraser cursor
  if (store.state.drawingEraserIsActive) {
    const crossScale = 0.25
    const crossSize = diameter * crossScale // cross size relative to circle size
    const crossOffset = (diameter - crossSize) / 2 // center the ✕
    svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='${diameter}' height='${diameter}' viewBox='0 0 ${diameter} ${diameter}'>
        <circle cx='${radius}' cy='${radius}' r='${radius - 2}' fill='none' stroke='${color}' stroke-width='${strokeWidth}'/>
        <line x1='${crossOffset}' y1='${crossOffset}' x2='${crossOffset + crossSize}' y2='${crossOffset + crossSize}' stroke='${color}' stroke-width='${strokeWidth}'/>
        <line x1='${crossOffset + crossSize}' y1='${crossOffset}' x2='${crossOffset}' y2='${crossOffset + crossSize}' stroke='${color}' stroke-width='${strokeWidth}'/>
      </svg>`
    styles.mixBlendMode = 'difference'
  // drawing cursor
  } else {
    svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='${diameter}' height='${diameter}' viewBox='0 0 ${diameter} ${diameter}'>
        <circle cx='${radius}' cy='${radius}' r='${radius - 2}' fill='none' stroke='${color}' stroke-width='${strokeWidth}'/>
      </svg>
    `
  }
  const dataUri = `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`
  styles.cursor = `url("${dataUri}") ${radius} ${radius}, auto`
  return styles
}
const styles = computed(() => {
  let styles = {}
  if (toolbarIsDrawing.value) {
    styles = drawingCursorStyles(styles)
  } else {
    styles.pointerEvents = 'none'
  }
  return styles
})

// drawing

const startDrawing = (event) => {
  if (!toolbarIsDrawing.value) { return }
  store.dispatch('closeAllDialogs')
  isDrawing = true
  currentStroke = []
  console.log('💐')
}
const draw = throttle((event) => {
  if (!isDrawing) { return }
  const drawingEraserIsActive = store.state.drawingEraserIsActive
  const { x, y } = utils.cursorPositionInPage(event)
  console.log('💐💐', isDrawing, drawingEraserIsActive, x, y)
  // addPointTo currentStroke

  // TODO broadcast
}, 16) // 60fps
const endDrawing = (event) => {
  if (!toolbarIsDrawing.value) { return }
  console.log('💐💐💐')
  isDrawing = false
  if (!currentStroke.length) { }
  // await? save to api operation (saves strokes, rasterizes and saves latest.
  // re-rasterize on demand to prevent conflicts??)
  // await? rasterize and save cached version
}
</script>

<template lang="pug">
canvas#drawing-canvas(
  :width="viewportWidth"
  :height="viewportHeight"
  :style="styles"
  @touchmove="preventTouchScrolling"
  @pointerdown="startDrawing"
  @pointermove="draw"
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
</style>
