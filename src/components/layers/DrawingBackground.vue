<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import debounce from 'lodash-es/debounce'

const store = useStore()

// this canvas is a rasterized duplicate of DrawingCanvas above it
const canvasElement = ref(null)
let canvas, context

let unsubscribe

onMounted(() => {
  canvas = canvasElement.value
  context = canvas.getContext('2d')
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  window.addEventListener('scroll', scroll)
  updatePrevScroll()
  // TODO clear and restore canvas when loading/restoring space
  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerUpdateDrawingBackground') {
      update()
    } else if (mutation.type === 'spaceZoomPercent') {
      updateCanvasSize()
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', scroll)
  unsubscribe()
})

const state = reactive({
  prevScroll: { x: 0, y: 0 }
})

const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)
const styles = computed(() => {
  let value = {
    top: state.prevScroll.y + 'px',
    left: state.prevScroll.x + 'px'
  }
  return value
})

const clear = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)
}
const update = () => {
  const sourceCanvas = document.getElementById('drawing-canvas')
  clear()
  context.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height)
}

// scroll and resize

const updatePrevScroll = () => {
  state.prevScroll = {
    x: window.scrollX,
    y: window.scrollY
  }
}
const scroll = () => {
  updatePrevScroll()
}
const updateCanvasSize = debounce(() => {
  const zoom = store.getters.spaceCounterZoomDecimal
  canvas.width = viewportWidth.value * zoom
  canvas.height = viewportHeight.value * zoom
}, 20)

</script>

<template lang="pug">
canvas.drawing-background(
  ref="canvasElement"
  :width="viewportWidth"
  :height="viewportHeight"
  :style="styles"
)
</template>

<style lang="stylus">
canvas.drawing-background
  position fixed
  background transparent
  pointer-events none
  top 0
  left 0
</style>
