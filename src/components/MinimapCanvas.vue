<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

// let unsubscribe

const canvasElement = ref(null)

const itemRadius = 1

let canvas, context
let startPanningPosition

onMounted(() => {
  init()
  window.addEventListener('scroll', updateScroll)
  window.addEventListener('resize', init)
  window.addEventListener('pointerup', endPanningViewport)
})
onBeforeUnmount(() => {
  // unsubscribe()
  window.removeEventListener('scroll', updateScroll)
  window.removeEventListener('resize', init)
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean,
  size: Number
})
const state = reactive({
  scrollX: 0,
  scrollY: 0,
  isPanningViewport: false,
  wasPanned: false
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
  let pageWidth = store.state.pageWidth
  let pageHeight = store.state.pageHeight
  state.pageWidth = Math.round(pageWidth * ratio.value)
  state.pageHeight = Math.round(pageHeight * ratio.value)

  updateScroll()
  canvas = canvasElement.value
  if (!canvas) { return }
  context = canvas.getContext('2d')
  canvas.width = state.pageWidth * window.devicePixelRatio
  canvas.height = state.pageHeight * window.devicePixelRatio
  canvas.style.width = state.pageWidth + 'px'
  canvas.style.height = state.pageHeight + 'px'
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  context.clearRect(0, 0, canvas.width, canvas.height)
}

// cards

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
    context.roundRect(card.x, card.y, card.width, card.height, itemRadius)
    context.fillStyle = card.backgroundColor || defaultColor
    context.fill()
  })
}

// viewport

const updateScroll = () => {
  state.scrollX = window.scrollX
  state.scrollY = window.scrollY
}
const viewportStyle = computed(() => {
  const zoom = store.getters.spaceCounterZoomDecimal
  const color = store.state.currentUser.color
  // viewport box
  let width = (store.state.viewportWidth * zoom) * ratio.value
  let height = (store.state.viewportHeight * zoom) * ratio.value
  let left = (state.scrollX * zoom) * ratio.value
  let top = (state.scrollY * zoom) * ratio.value
  // constraints
  if (Math.round(left + width) > state.pageWidth) {
    left = 0
    width = state.pageWidth
  }
  if (Math.round(top + height) > state.pageHeight) {
    top = 0
    height = state.pageHeight
  }
  let styles = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    borderColor: color
  }
  if (state.isPanningViewport) {
    styles.cursor = 'grabbing'
  }
  return styles
})

// pan viewport

// TODO
const scrollToPosition = (event) => {
  if (state.wasPanned) { return }
  state.wasPanned = false
  console.log(event)
}
const startPanningViewport = (event) => {
  state.isPanningViewport = true
  // startPanningPosition = utils.cursorPositionInPage(event)
  // jump to pos
  // hold and drag to pan , via window.scrollBy
  console.log('🌺', state.isPanningViewport)
}
const panViewport = (event) => {
  state.wasPanned = true
}
const endPanningViewport = (event) => {
  state.isPanningViewport = false
}
</script>

<template lang="pug">
.minimap-canvas(v-if="props.visible" :style="styles" @click.stop="scrollToPosition")
  canvas#minimap-canvas(ref="canvasElement")
  .viewport.blink(:style="viewportStyle" @pointerdown="startPanningViewport" @pointermove="panViewport")
</template>

<style lang="stylus">
.minimap-canvas
  border-radius var(--entity-radius)
  position relative
  margin 0
  padding 0
  .viewport
    cursor grab
    position absolute
    border 2px solid
    border-radius 5px
    box-shadow var(--hover-shadow)
    max-width 100%
    max-height 100%
  .blink
    animation-duration 0.2s
    animation-name blink
    animation-iteration-count infinite
    animation-direction alternate
    animation-timing-function ease-out
  @keyframes blink
    0%
      opacity 1
    100%
      opacity 0.6

</style>
