<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

import throttle from 'lodash-es/throttle'

const store = useStore()

// let unsubscribe

onMounted(() => {
  // unsubscribe = store.subscribe(mutation => {
  //   if (mutation.type === 'triggerUpdateOtherCard') {
  //     mutation.payload
  //   }
  // })
})
// onBeforeUnmount(() => {
//   unsubscribe()
// })

const props = defineProps({
  visible: Boolean
})
// const state = reactive({
//   count: 0
// })

const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)

const toolbarIsDrawing = computed(() => store.state.currentUserToolbar === 'drawing')
// TODO if toolbarIsDrawing, disable select all below, toright, selectall

const strokeColor = computed(() => store.getters['currentUser/drawingColor'])
const strokeDiameter = computed(() => {
  const diameter = store.state.currentUser.drawingBrushSize
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

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     console.info('💁‍♀️', value)
//   }
// })

// const themeName = computed(() => store.state.currentUser.theme)
// const incrementBy = () => {
//   const theme = themeName.value
//   console.info('🧢', theme)
//   state.count = state.count + 1
//   emit('updateCount', state.count)
//   // store.dispatch('themes/isSystem', false)
// }

const startDrawing = (event) => {
  store.commit('triggerStartDrawing', event)
}
const draw = throttle((event) => {
  store.commit('triggerDraw', event)
}, 16) // 60fps
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
