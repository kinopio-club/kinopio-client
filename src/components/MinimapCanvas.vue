<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'

const store = useStore()

// let unsubscribe

let canvas, context

onMounted(() => {
  init()
})
// onBeforeUnmount(() => {
//   unsubscribe()
// })

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean,
  size: Number
})
const state = reactive({
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    init()
  }
})

const ratio = computed(() => {
  const pageWidth = store.state.pageWidth
  const pageHeight = store.state.pageHeight
  if (pageWidth > pageHeight) {
    return props.size / pageWidth
  } else {
    return props.size / pageHeight
  }
})

const init = () => {
  initCanvas()
  if (!canvas) { }

  // drawCards
  // drawCardImage
  // drawboxes
  // drawConnections?
}

const initCanvas = async () => {
  await nextTick()
  const pageWidth = store.state.pageWidth
  const pageHeight = store.state.pageHeight
  const width = Math.round(pageWidth * ratio.value)
  const height = Math.round(pageHeight * ratio.value)

  console.log('🅰️🅰️🅰️', ratio.value, width, height)

  canvas = document.getElementById('minimap-canvas')
  if (!canvas) { return }
  context = canvas.getContext('2d')
  canvas.width = width * window.devicePixelRatio
  canvas.height = height * window.devicePixelRatio
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  context.clearRect(0, 0, canvas.width, canvas.height)
}

</script>

<template lang="pug">
.minimap-canvas(v-if="props.visible")
  canvas#minimap-canvas
    //- viewport box is absolute div floating on top of canvas?
    //- @pointerup="endPanningViewport" @pointeremove="panViewport" :style="overlayStyle"
</template>

<style lang="stylus">
.minimap-canvas
  border-radius var(--entity-radius)
  background pink
  position relative
  margin 0
  padding 0
  // canvas
  //   border-radius var(--entity-radius)
</style>
