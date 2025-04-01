<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import debounce from 'lodash-es/debounce'

const store = useStore()

const canvasElement = ref(null)
let canvas, context

let unsubscribe

onMounted(() => {
  canvas = canvasElement.value
  context = canvas.getContext('2d')
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  window.addEventListener('scroll', scroll)
  window.addEventListener('resize', resize)
  updatePrevScroll()

  // TODO clear and restore canvas when loading/restoring space

  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerUpdateDrawingBackgroundlayer') {
      update()
    } else if (mutation.type === 'spaceZoomPercent') {
      updateCanvasSize()
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', scroll)
  window.removeEventListener('resize', resize)
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
  value.mixBlendMode = 'color'
  return value
})

const update = () => {
  console.log('🔮')
}

// // Image Url

// const kinopioBackgroundImageData = computed(() => {
//   const data = backgroundImages.find(item => {
//     const background = currentSpace.value.background
//     return background === item.url
//   })
//   return data
// })
// const backgroundUrl = computed(() => {
//   let data = kinopioBackgroundImageData.value
//   let url
//   // darkUrl
//   if (data && isThemeDark.value) {
//     url = data.darkUrl || data.url
//   // url
//   } else if (data) {
//     url = data.url
//   } else {
//     url = currentSpace.value.background
//   }
//   return url
// })

// Background Gradient

// const gradientLayers = computed(() => {
//   if (!currentSpace.value.backgroundIsGradient) { return }
//   const layers = currentSpace.value.backgroundGradient
//   return layers
// })

// scroll and resize

const updatePrevScroll = () => {
  state.prevScroll = {
    x: window.scrollX,
    y: window.scrollY
  }
}
const scroll = () => {
  updatePrevScroll()
  update()
}
const resize = debounce(() => {
  update()
}, 20)
const updateCanvasSize = debounce(() => {
  const zoom = store.getters.spaceCounterZoomDecimal
  canvas.width = viewportWidth.value * zoom
  canvas.height = viewportHeight.value * zoom
  update()
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
  background pink
  pointer-events none
  top 0
  left 0
</style>
