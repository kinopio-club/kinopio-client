<script setup>
import utils from '@/utils.js'
// let isTouch = false

import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'
// import throttle from 'lodash-es/throttle'

let lineWidth = 22
let canvas, context, canvasImage, prevScroll
// let pageCanvas, pageContext
let currentPaintStroke = []
let allStrokes = []
prevScroll = {
  x: window.scrollX,
  y: window.scrollY
}
let isDrawing = false
const store = useStore()

const isTouch = computed(() => store.state.isTouchDevice)
const color = computed(() => store.state.currentUser.color)

// const throttle = (ms, fn) => {
//   let lastCallTime
//   return function () {
//     const now = Date.now()
//     if (!lastCallTime || now - lastCallTime > ms) {
//       lastCallTime = now
//       fn.apply(this, arguments)
//     }
//   }
// }

// init
onMounted(() => {
  initCanvas()
  // initPageCanvas()
  // start
  window.addEventListener('mousedown', startStroke)
  window.addEventListener('touchstart', startStroke)
  // draw
  window.addEventListener('mousemove', addPointToStrokeFromEvent)
  window.addEventListener('touchmove', addPointToStrokeFromEvent)
  window.addEventListener('scroll', updatePrevScroll)
  // stop
  window.addEventListener('mouseup', endStroke)
  window.addEventListener('touchend', endStroke)
  console.log('🌸 paint select ready')
  // todo handle window resize
})
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', startStroke)
  window.removeEventListener('touchstart', startStroke)
  window.removeEventListener('mousemove', addPointToStrokeFromEvent)
  window.removeEventListener('touchmove', addPointToStrokeFromEvent)
  window.removeEventListener('scroll', updatePrevScroll)
  window.removeEventListener('mouseup', endStroke)
  window.removeEventListener('touchend', endStroke)
})
const initCanvas = () => {
  canvas = document.getElementById('background')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  context = canvas.getContext('2d')
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  context.strokeStyle = color
  context.lineWidth = lineWidth
  context.lineCap = context.lineJoin = 'round'
}
// const initPageCanvas = () => {
//   pageCanvas = document.getElementById('page-background')
//   pageCanvas.classList.add('hidden')
//   const body = document.body
//   const html = document.documentElement
//   const pageWidth = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
//   const pageHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
//   pageCanvas.width = pageWidth
//   pageCanvas.height = pageHeight
//   pageContext = pageCanvas.getContext('2d')
//   pageContext.scale(2,2)
//   pageContext.strokeStyle = color
//   pageContext.lineWidth = lineWidth
//   pageContext.lineCap = pageContext.lineJoin = 'round'
//   pageCanvas.classList.remove('hidden')
// }

// drawing strokes

const drawCurrentStroke = () => {
  if (currentPaintStroke.length === 0) { return }
  // console.log(currentPaintStroke)
  context.beginPath()
  context.moveTo(currentPaintStroke[0].x, currentPaintStroke[0].y)
  currentPaintStroke.forEach((point) => {
    context.lineTo(point.x, point.y)
  })
  context.stroke()
}
const redrawAllStrokes = () => {
  if (allStrokes.length === 0) { return }
  allStrokes = allStrokes.filter(stroke => {
    return stroke.length
  })
  // allStrokes.forEach(stroke => {
  //   pageContext.beginPath()
  //   pageContext.moveTo(stroke[0].x + stroke[0].scrollX, stroke[0].y + stroke[0].scrollY)
  //   stroke.forEach((point) => {
  //     pageContext.lineTo(point.x + point.scrollX, point.y + point.scrollY)
  //   })
  //   pageContext.stroke()
  // })
}
const startStroke = () => {
  currentPaintStroke = []
  isDrawing = true
}
const endStroke = () => {
  allStrokes.push(currentPaintStroke)
  // pageCanvas.getContext('2d').drawImage(canvas, prevScroll.x / 2, prevScroll.y / 2, canvas.width / 2, canvas.height / 2)
  currentPaintStroke = []
  isDrawing = false
  context.clearRect(0, 0, canvas.width, canvas.height)
}
const addPointToStrokeFromEvent = (event) => {
  const position = utils.cursorPositionInSpace(event)

  // throttle(function() {
  // console.log('🐸')
  addPointToStroke({ x: position.x, y: position.y })
  // }, 10)
}
const addPointToStroke = ({ x, y }) => {
  if (!isDrawing) { return }
  console.log('🐸', x)

  currentPaintStroke.push({
    x,
    y,
    scrollX: prevScroll.x / 2,
    scrollY: prevScroll.y / 2
  })
  drawCurrentStroke()
}

// frame position updates

const updateCanvas = () => {
  if (isTouch.value) { return }
  initCanvas()
  // initPageCanvas()
  redrawAllStrokes()
}
const updatePrevScroll = () => {
  prevScroll = {
    x: window.scrollX,
    y: window.scrollY
  }
}

</script>

<template lang="pug">
canvas#background
canvas#page-background
</template>

<style lang="stylus">
canvas#background
  position fixed
  background-color transparent
  top 0
  left 0
  z-index 0
  background-color teal
  // pointer-events none
// canvas#page-background
//   position absolute
//   background-color transparent
//   top 0
//   left 0
//   z-index -2
</style>
