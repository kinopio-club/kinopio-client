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
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUpdateDrawingBackground') {
        update()
      } else if (name === 'triggerDrawingReset') {
        clear()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

watch(() => globalStore.currentUserToolbar, (value, prevValue) => {
  update()
})
watch(
  [
    () => globalStore.spaceZoomPercent,
    () => globalStore.zoomOrigin
  ],
  async () => {
    await nextTick()
    update()
  }
)

const state = reactive({
  prevScroll: { x: 0, y: 0 }
})

const pageHeight = computed(() => globalStore.pageHeight)
const pageWidth = computed(() => globalStore.pageWidth)

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
  const zoom = globalStore.getSpaceZoomDecimal
  state.prevScroll = {
    x: window.scrollX * zoom,
    y: window.scrollY * zoom
  }
}

</script>

<template lang="pug">
canvas.drawing-background(
  ref="canvasElement"
  :width="pageWidth"
  :height="pageHeight"
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
