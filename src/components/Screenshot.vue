<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import UserLabelCursor from '@/components/UserLabelCursor.vue'
import utils from '@/utils.js'

// import debounce from 'lodash-es/debounce'

const store = useStore()
// const offset = 10 // container margin / 2
let canvas, context
const element = ref(null)

onMounted(() => {
  // TEMP: change to being manually triggered after n mins on a space, and n mins after last change,
  // if member
  //
  store.subscribe((mutation, state) => {
    if (mutation.type === 'isLoadingSpace' && !mutation.payload) {
      update()
    }
  })
})

// const props = defineProps({
//   visible: Boolean
// })
// const state = reactive({
// boundary: {},
// scale: 1,
// cards: [],
// viewport: {},
// isPanningViewport: false,
// connections: []
// })
// const emit = defineEmits(['updateCount'])

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     console.log('💁‍♀️', value)
//   }
// })
// const overlayBackgroundStyle = computed(() => {
//   const backgroundColor = store.state.currentSpace.backgroundTint
//   return {
//     backgroundColor
//   }
// })

const boxes = computed(() => store.getters['currentBoxes/all'])
const cards = computed(() => store.getters['currentCards/all'])
const connections = computed(() => store.getters['currentConnections/all'])

const update = async () => {
  console.log('👩‍🎨 update screenshot')
  initCanvas()
  // await drawBackground() // tile
  await drawConnections()
  await drawCards()

  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/save
}

const initCanvas = () => {
  canvas = element.value
  if (!canvas) { return }
  context = canvas.getContext('2d')
  // TODO use fixed canvas size/screenshot area , instead of user viewport based
  const viewportWidth = store.state.viewportWidth
  const viewportHeight = store.state.viewportHeight
  canvas.width = viewportWidth * window.devicePixelRatio
  canvas.height = viewportHeight * window.devicePixelRatio
  canvas.style.width = viewportWidth + 'px'
  canvas.style.height = viewportHeight + 'px'
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  context.clearRect(0, 0, canvas.width, canvas.height)
}

const drawCards = async () => {
  await nextTick()
  const secondaryBackground = utils.cssVariable('secondary-background')
  const entityRadius = parseInt(utils.cssVariable('entity-radius'))
  cards.value.forEach(card => {
    context.fillStyle = secondaryBackground
    context.roundRect(card.x, card.y, card.width, card.height, entityRadius)
    context.fill()
    drawCardConnector(card)
  })
}

const drawCardConnector = async (card) => {
  await nextTick()
  const primaryBorder = utils.cssVariable('primary-border')
  const connectionTypes = store.getters['currentConnections/typesByCardId'](card.id)
  let typeColor = 'transparent'
  if (connectionTypes.length) {
    typeColor = connectionTypes[0].color
  }
  const radius = 7
  const margin = 16
  const x = card.x + card.width - margin
  const y = card.y + margin
  context.beginPath()
  context.arc(x, y, radius, 0, 2 * Math.PI)
  context.strokeStyle = primaryBorder
  context.lineWidth = 1
  context.stroke()
  context.fillStyle = typeColor
  context.fill()
}

const drawConnections = async () => {
  await nextTick()
  connections.value.forEach(connection => {
    context.lineWidth = 5
    context.lineCap = 'round'
    const type = store.getters['currentConnections/typeByTypeId'](connection.connectionTypeId)
    context.strokeStyle = type.color
    console.log('🌍🌍🌍', connection)
    const path = new Path2D(connection.path)
    context.stroke(path)
  })
}

</script>

<template lang="pug">
canvas.minimap(ref='element')
  //-     .box(:style="boxStyle(box)" :data-box-minimap-id="box.id")
  //-       .box-background.filled(v-if="boxFillIsFilled(box)" :style="{ backgroundColor: box.color }")

</template>

<style lang="stylus">
.minimap
  background var(--primary-background)
  position fixed
  top 0
  left 0
  width 100vw
  height 100vh
  // cursor pointer
  // backdrop-filter blur(8px)

  // .overlay-background
  //   background-color var(--primary-background)
  //   opacity 0.5
  // canvas#connections
  //   opacity 0.99
  // .cards-wrap,
  // canvas#connections,
  // .boxes-wrap
  //   position absolute
  //   left 0
  //   margin 20px
  // .box
  //   position absolute
  //   border-radius 3px
  //   border-width 2px
  //   border-style solid
  //   z-index -1
  // .box-background
  //   position absolute
  //   left 0px
  //   top 0px
  //   width 100%
  //   height 100%
  //   &.filled
  //     opacity 0.6
  // .card
  //   position absolute
  //   background-color var(--secondary-background)
  //   border-radius 3px
  //   background-size cover
  //   transition 0.5s box-shadow
  //   &.transparent-background
  //     background-color transparent !important
  //   &.is-in-viewport
  //     box-shadow 5px 5px 0 var(--light-shadow)

</style>
