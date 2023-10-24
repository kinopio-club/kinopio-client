<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()
let canvas, context
const width = 2400
const height = 1350

const element = ref(null)

// TODO move to SERVER, triggered on space load by member, and space unload by member (debounce n mins)
onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'isLoadingSpace' && !mutation.payload) {
      update()
    }
  })
})

const boxes = computed(() => store.getters['currentBoxes/all'])
const cards = computed(() => store.getters['currentCards/all'])
const connections = computed(() => store.getters['currentConnections/all'])

const update = async () => {
  console.time('👩‍🎨 update screenshot')
  initCanvas()
  await drawBackground()
  await drawBackgroundTint()
  await drawConnections()
  await drawCards()

  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/save
  console.timeEnd('👩‍🎨 update screenshot')
}

const initCanvas = () => {
  canvas = element.value
  if (!canvas) { return }
  context = canvas.getContext('2d')
  canvas.width = width * window.devicePixelRatio
  canvas.height = height * window.devicePixelRatio
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  context.clearRect(0, 0, canvas.width, canvas.height)
}
const drawBackground = async () => {
  const backgroundUrl = store.state.spaceBackgroundUrl
  const isRetina = backgroundUrl.includes('-2x.') || backgroundUrl.includes('@2x.')
  let image = new Image()
  image.src = backgroundUrl
  const pattern = context.createPattern(image, 'repeat')
  if (isRetina) {
    const matrix = new DOMMatrix()
    pattern.setTransform(matrix.scale(0.5))
  }
  context.fillStyle = pattern
  context.fillRect(0, 0, width, height)
}
const drawBackgroundTint = async () => {
  const color = store.state.currentSpace.backgroundTint
  let tint = new Path2D()
  tint.rect(0, 0, width, height)
  context.fillStyle = color
  context.globalCompositeOperation = 'multiply'
  context.fill(tint)
  context.globalCompositeOperation = 'source-over' // default blend mode
}
const drawCards = async () => {
  await nextTick()
  const css = {
    secondaryBackground: utils.cssVariable('secondary-background'),
    entityRadius: parseInt(utils.cssVariable('entity-radius'))
  }
  for (const card of cards.value) {
    if (card.y > height) { continue }
    let rect = new Path2D()
    rect.roundRect(card.x, card.y, card.width, card.height, css.entityRadius)
    context.fillStyle = card.backgroundColor || css.secondaryBackground
    context.fill(rect)
    await drawCardConnector(card)
  }
}
const drawCardConnector = async (card) => {
  await nextTick()
  const css = {
    primaryBorder: utils.cssVariable('primary-border')
  }
  const connectionTypes = store.getters['currentConnections/typesByCardId'](card.id)
  let typeColor = 'transparent'
  if (connectionTypes.length) {
    typeColor = connectionTypes[0].color
  }
  const radius = 7
  const margin = 16
  const x = card.x + card.width - margin
  const y = card.y + margin
  let circle = new Path2D()
  circle.arc(x, y, radius, 0, 2 * Math.PI)
  context.strokeStyle = css.primaryBorder
  context.lineWidth = 1
  context.stroke(circle)
  context.fillStyle = typeColor
  context.fill(circle)
}
const drawConnections = async () => {
  await nextTick()
  connections.value.forEach(connection => {
    context.lineWidth = 5
    context.lineCap = 'round'
    const type = store.getters['currentConnections/typeByTypeId'](connection.connectionTypeId)
    context.strokeStyle = type.color
    const path = new Path2D(connection.path)
    context.stroke(path)
  })
}
const drawBoxes = async () => {
  // TODO ignore items that are outside canvas
  // if (box.y > height) { continue }
  // filled or not filled, info area
}

// TODO FUTURE draw Lines

</script>

<template lang="pug">
canvas.minimap(ref='element')
</template>

<style lang="stylus">
.minimap
  background rgba(110, 48, 75, .5) // temp
  position fixed
  top 0
  left 0
</style>
