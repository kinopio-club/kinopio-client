<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

import throttle from 'lodash-es/throttle'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

onMounted(() => {
  window.addEventListener('pointerup', endDrawing)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', endDrawing)
})

const props = defineProps({
  visible: Boolean
})

const viewportHeight = computed(() => globalStore.viewportHeight)
const viewportWidth = computed(() => globalStore.viewportWidth)
const toolbarIsDrawing = computed(() => globalStore.getToolbarIsDrawing)
const strokeColor = computed(() => userStore.getUserDrawingColor)

const strokeDiameter = computed(() => {
  const diameter = userStore.drawingBrushSize
  return consts.drawingBrushSizeDiameter[diameter]
})

const drawingCursorStyles = (styles) => {
  if (!toolbarIsDrawing.value) { return }
  const strokeWidth = 1
  const diameter = strokeDiameter.value
  const radius = diameter / 2
  const color = strokeColor.value
  let svg
  // eraser cursor
  if (globalStore.drawingEraserIsActive) {
    const crossScale = 0.25
    const crossSize = diameter * crossScale // cross size relative to circle size
    const crossOffset = (diameter - crossSize) / 2 // center the ✕
    svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='${diameter}' height='${diameter}' viewBox='0 0 ${diameter} ${diameter}'>
        <circle cx='${radius}' cy='${radius}' r='${radius - 2}' fill='none' stroke='${color}' stroke-width='${strokeWidth}'/>
        <line x1='${crossOffset}' y1='${crossOffset}' x2='${crossOffset + crossSize}' y2='${crossOffset + crossSize}' stroke='${color}' stroke-width='${strokeWidth}'/>
        <line x1='${crossOffset + crossSize}' y1='${crossOffset}' x2='${crossOffset}' y2='${crossOffset + crossSize}' stroke='${color}' stroke-width='${strokeWidth}'/>
      </svg>`
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

const preventTouchScrolling = (event) => {
  if (toolbarIsDrawing.value) {
    event.preventDefault()
  }
}

const startDrawing = (event) => {
  if (utils.isMultiTouch(event)) { return }
  globalStore.currentUserIsDrawing = true
  globalStore.triggerStartDrawing(event)
}
const draw = throttle((event) => {
  globalStore.triggerDraw(event)
}, 16) // 60fps

const endDrawing = () => {
  globalStore.currentUserIsDrawing = false
}
</script>

<template lang="pug">
#drawing-handler(
  :width="viewportWidth"
  :height="viewportHeight"
  :style="styles"
  @touchmove="preventTouchScrolling"
  @mousedown.left="startDrawing"
  @touchstart="startDrawing"
  @pointermove="draw"
)
</template>

<style lang="stylus">
#drawing-handler
  position fixed
  background transparent
  top 0
  left 0
  width 100dvw
  height 100dvh
  opacity 1
</style>
