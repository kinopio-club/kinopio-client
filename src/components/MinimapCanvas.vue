<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

// let unsubscribe

const canvasElement = ref(null)

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

const styles = computed(() => {
  return { backgroundColor: store.state.outsideSpaceBackgroundColor }
})

// canvas

const init = async () => {
  await initCanvas()
  if (!canvas) { return }
  drawCards()
  // drawboxes
  // drawConnections?
}
const initCanvas = async () => {
  await nextTick()
  const pageWidth = store.state.pageWidth
  const pageHeight = store.state.pageHeight
  const width = Math.round(pageWidth * ratio.value)
  const height = Math.round(pageHeight * ratio.value)
  canvas = canvasElement.value
  if (!canvas) { return }
  context = canvas.getContext('2d')
  canvas.width = width * window.devicePixelRatio
  canvas.height = height * window.devicePixelRatio
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  context.clearRect(0, 0, canvas.width, canvas.height)
}

// cards

// const cardImageUrl = (card) => {
//   // image url in card name
//   const urls = utils.urlsFromString(card.name)
//   if (!urls) { return }
//   const imageUrl = urls.find(url => utils.urlIsImage(url))
//   if (imageUrl) {
//     return imageUrl
//   }
//   // url preview image
//   const imageUrlIsUrlPreview = card.urlPreviewImage && card.urlPreviewIsVisible && !card.shouldHideUrlPreviewImage
//   if (imageUrlIsUrlPreview) {
//     return card.urlPreviewImage
//   }
// }
const drawCards = async () => {
  const defaultColor = utils.cssVariable('secondary-background')
  let cards = store.getters['currentCards/all']
  cards = utils.clone(cards)
  cards = cards.map(card => {
    card.x = card.x * ratio.value
    card.y = card.y * ratio.value
    card.width = card.width * ratio.value
    card.height = card.height * ratio.value
    return card
  })
  cards.forEach(card => {
    context.roundRect(card.x, card.y, card.width, card.height, 1)
    context.fillStyle = card.backgroundColor || defaultColor
    context.fill()
    // const imageUrl = cardImageUrl(card)
    // if (imageUrl) {
    // }
  })
}

</script>

<template lang="pug">
.minimap-canvas(v-if="props.visible" :style="styles")
  canvas#minimap-canvas(ref="canvasElement")
    //- viewport box is absolute div floating on top of canvas?
    //- @pointerup="endPanningViewport" @pointeremove="panViewport" :style="overlayStyle"
</template>

<style lang="stylus">
.minimap-canvas
  border-radius var(--entity-radius)
  position relative
  margin 0
  padding 0
</style>
