<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import backgroundImages from '@/data/backgroundImages.json'
// import SpaceBackgroundGradients from '@/components/SpaceBackgroundGradients.vue'
// import utils from '@/utils.js'
// import consts from '@/consts.js'

const store = useStore()

let unsubscribe

onMounted(() => {
  // canvas = canvasElement.value
  // context = canvas.getContext('2d')
  // context.scale(window.devicePixelRatio, window.devicePixelRatio)
  // window.addEventListener('pointerup', endDrawing)
  // window.addEventListener('scroll', scroll)
  // window.addEventListener('resize', resize)
  // updatePrevScroll()

  // TODO handle zoom, slider
  // TODO clear and restore canvas when loading/restoring space

  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerUpdateDrawingBackgroundlayer') {
      update()
    }
  })
})
onBeforeUnmount(() => {
  // window.removeEventListener('pointerup', endDrawing)
  // window.removeEventListener('scroll', scroll)
  // window.removeEventListener('resize', resize)
  unsubscribe()
})

const update = () => {
  const canvas = document.querySelector('#drawing-canvas')
  console.log(canvas)
}
// const spaceShouldHaveBorderRadius = computed(() => store.getters.spaceShouldHaveBorderRadius)
// const isSecureAppContext = computed(() => consts.isSecureAppContext)
// const isSpacePage = computed(() => {
//   const isOther = store.state.isAddPage
//   const isSpace = !isOther
//   return isSpace
// })
// const isThemeDark = computed(() => store.state.currentUser.theme === 'dark')
// const currentSpace = computed(() => store.state.currentSpace)
// const backgroundIsDefault = computed(() => !currentSpace.value.background)
const pageHeight = computed(() => store.state.pageHeight)
const pageWidth = computed(() => store.state.pageWidth)

// // Styles

const styles = computed(() => {
  // styles.backgroundImage = backgroundImage
  const value = {}
  value.width = `${pageWidth.value}px`
  value.height = `${pageHeight.value}px`
  return value
})

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
</script>

<template lang="pug">
//- gradient
//- SpaceBackgroundGradients(:visible="true" :layers="gradientLayers" :styles="backgroundStyles")
//- or image
.drawing-background(:style="styles")
</template>

<style lang="stylus">
#drawing-background
  position absolute
  pointer-events none
  z-index 0
  // transform-origin top left
</style>
