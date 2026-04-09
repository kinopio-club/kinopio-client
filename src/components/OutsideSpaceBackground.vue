<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useThemeStore } from '@/stores/useThemeStore'

import postMessage from '@/postMessage.js'
import utils from '@/utils.js'
import consts from '@/consts.js'

import { colord, extend } from 'colord'
import mixPlugin from 'colord/plugins/mix'
extend([mixPlugin])

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const themeStore = useThemeStore()

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

let canvas, context

let unsubscribes

// start, stop

onMounted(() => {
  canvas = document.getElementById('outside-space-background')
  context = canvas.getContext('2d')
  context.scale(window.devicePixelRatio, window.devicePixelRatio)
  start()

  const spaceActionUnsubscribe = spaceStore.$onAction(
    ({ name, args }) => {
      if (name === 'updateSpace') {
        if (args[0].backgroundTint) {
          updateBackgroundColor()
        }
      }
    }
  )
  unsubscribes = () => {
    spaceActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  cancel()
  unsubscribes()
})
const isTouching = computed(() => globalStore.isPinchZooming || globalStore.isTouchScrolling)
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
const spaceZoomDecimal = computed(() => globalStore.getSpaceZoomDecimal)
const outsideSpaceBackgroundIsStatic = computed(() => userStore.outsideSpaceBackgroundIsStatic)
const backgroundTintColor = computed(() => spaceStore.backgroundTint)
const isThemeDark = computed(() => themeStore.getIsThemeDark)
const preventTouchScrolling = (event) => {
  const shouldPrevent = globalStore.currentUserIsResizingBox || globalStore.currentUserIsPaintSelectingLocked
  if (shouldPrevent) {
    event.preventDefault()
  }
}

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
  // darken
  let darkness = 0.4
  if (isThemeDark.value) {
    darkness = 0.6
  }
  backgroundColor = colord(backgroundColor).darken(darkness).toHex()
  // mix in tint color
  if (backgroundTintColor.value) {
    const tint = backgroundTintColor.value
    backgroundColor = colord(backgroundColor).mix(tint, 0.5).toHex()
  }
  // save color
  globalStore.outsideSpaceBackgroundColor = backgroundColor
  updateMetaThemeColor(backgroundColor)
  // update canvas bk
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = backgroundColor
  context.fillRect(0, 0, canvas.width, canvas.height)
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
const styles = computed(() => {
  const canvasSize = 10
  const widthScale = globalStore.viewportWidth / canvasSize
  const heightScale = globalStore.viewportHeight / canvasSize
  const scale = Math.max(widthScale, heightScale)
  const styles = { transform: `scale(${scale})` }
  return styles
})
</script>

<template lang="pug">
canvas#outside-space-background(
  :style="styles"
  @touchmove="preventTouchScrolling"
)
</template>

<style lang="stylus">
#outside-space-background
  position fixed
  top 0
  left 0
  width 10px
  height 10px
  transform-origin left top
  user-select none
</style>
