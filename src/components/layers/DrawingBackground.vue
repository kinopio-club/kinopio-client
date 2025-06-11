<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import debounce from 'lodash-es/debounce'

const globalStore = useGlobalStore()

// this canvas is a rasterized duplicate of DrawingCanvas above it
const canvasElement = ref(null)
let canvas, context

let unsubscribes

onMounted(() => {
  canvas = canvasElement.value
  context = canvas.getContext('2d')
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  updatePrevScroll()
  window.addEventListener('scroll', updatePrevScroll)

  const globalStateUnsubscribe = globalStore.$subscribe(
    (mutation, state) => {
      const name = mutation.events.key
      const value = mutation.events.newValue
      if (name === 'spaceZoomPercent') {
        updateCanvasSize()
      }
    }
  )
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUpdateDrawingBackground') {
        update()
      } else if (name === 'spaceZoomPercent') {
        updateCanvasSize()
      }
    }
  )
  unsubscribes = () => {
    globalStateUnsubscribe()
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updatePrevScroll())
  unsubscribes()
})

const state = reactive({
  prevScroll: { x: 0, y: 0 }
})

const viewportHeight = computed(() => globalStore.viewportHeight)
const viewportWidth = computed(() => globalStore.viewportWidth)

const clear = () => {
  context.clearRect(0, 0, canvas.width, canvas.height)
}
const update = () => {
  const sourceCanvas = document.getElementById('drawing-canvas')
  clear()
  context.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height)
}

const styles = computed(() => {
  const value = {
    top: state.prevScroll.y + 'px',
    left: state.prevScroll.x + 'px'
  }
  return value
})

// scroll and resize

const updatePrevScroll = () => {
  state.prevScroll = {
    x: window.scrollX,
    y: window.scrollY
  }
}
const updateCanvasSize = debounce(() => {
  const zoom = globalStore.getSpaceCounterZoomDecimal
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
