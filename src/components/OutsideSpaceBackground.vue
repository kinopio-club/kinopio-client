<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import postMessage from '@/postMessage.js'
import utils from '@/utils.js'
const store = useStore()

// adapted from https://gist.github.com/pketh/3f62b807db3835d564c1
let colorCycleTimer
let colorCycleIteration = 0
const colorCycleDuration = 200
const max = 239
const min = 150

// initial rgb values
let r = Math.floor(Math.random() * 241)
let g = Math.floor(Math.random() * 241)
let b = Math.floor(Math.random() * 241)
r = Math.max(r, min)
g = Math.max(g, min)
b = Math.max(b, min)
r = Math.min(r, max)
g = Math.min(g, max)
b = Math.min(b, max)

// random intervals used to calculate the changing RGB values
let ri = Math.floor(Math.random() * 4)
let gi = Math.floor(Math.random() * 4)
let bi = Math.floor(Math.random() * 4)

let shouldNotUpdate

// start, stop

onMounted(() => {
  start()
})
onBeforeUnmount(() => {
  cancel()
})
const isTouching = computed(() => store.state.isPinchZooming || store.state.isTouchScrolling)
watch(() => isTouching.value, (value, prevValue) => {
  if (value) {
    shouldNotUpdate = true
  } else {
    shouldNotUpdate = false
  }
})
const start = () => {
  updateBackgroundColor()
  colorCycleIteration = 0
  if (colorCycleTimer) { return }
  colorCycleTimer = window.requestAnimationFrame(colorCycleFrame)
}
const cancel = () => {
  window.cancelAnimationFrame(colorCycleTimer)
  colorCycleTimer = undefined
}

const spaceZoomDecimal = computed(() => store.getters.spaceZoomDecimal)
const outsideSpaceBackgroundIsStatic = computed(() => store.state.currentUser.outsideSpaceBackgroundIsStatic)
const styles = computed(() => {
  return {
    backgroundColor: store.state.outsideSpaceBackgroundColor
  }
})

// update color

const updateBackgroundColor = () => {
  if (r > max || r < min) {
    ri = ri * -1
  }
  if (g > max || g < min) {
    gi = gi * -1
  }
  if (b > max || b < min) {
    bi = bi * -1
  }
  r += ri
  g += gi
  b += bi
  let backgroundColor = `rgb(${r}, ${g}, ${b})`
  if (outsideSpaceBackgroundIsStatic.value) {
    backgroundColor = utils.cssVariable('secondary-active-background')
  }
  store.commit('outsideSpaceBackgroundColor', backgroundColor)
  updateMetaThemeColor(backgroundColor)
}
const shouldUpdate = () => {
  if (shouldNotUpdate) { return }
  const result = colorCycleIteration / colorCycleDuration
  return result === parseInt(result)
}
const colorCycleFrame = () => {
  colorCycleIteration++
  if (shouldUpdate()) {
    updateBackgroundColor()
  }
  window.requestAnimationFrame(colorCycleFrame)
}
const updateMetaThemeColor = (color) => {
  const metaThemeColor = document.querySelector('meta[name=theme-color]')
  metaThemeColor.setAttribute('content', color)
  postMessage.send({ name: 'setBackgroundColor', value: color })
}
</script>

<template lang="pug">
.outside-space-background(:style="styles")
</template>

<style lang="stylus">
.outside-space-background
  position fixed
  top 0
  left 0
  width 110%
  height 110%
  background-color var(--secondary-active-background)
</style>
