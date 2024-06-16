<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

import { colord } from 'colord'

const store = useStore()

// adapted from https://codepen.io/pillowmermaid/details/xrwVPQ
let canvas, context
let ripples = [] // { x, y, color, radius, shadowRadius, speed, decay, lineWidth, shouldDestroy, opacity }

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'triggerSonarPing') {
      const ping = mutation.payload
      createRipples(ping)
    } else if (mutation.type === 'spaceZoomPercent') {
      updateScroll()
    }
  })
  updateScroll()
  canvas = document.getElementById('sonar')
  context = canvas.getContext('2d')
  window.requestAnimationFrame(rippleFrame)
  window.addEventListener('scroll', updateScroll)
  window.addEventListener('resize', updateScroll)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScroll)
  window.removeEventListener('resize', updateScroll)
})

const state = reactive({
  scroll: { x: 0, y: 0 }
})

const updateScroll = () => {
  state.scroll = store.getters.windowScrollWithSpaceOffset()
}

const spaceCounterZoomDecimal = computed(() => store.getters.spaceCounterZoomDecimal)
const viewportHeight = computed(() => store.state.viewportHeight * spaceCounterZoomDecimal.value)
const viewportWidth = computed(() => store.state.viewportWidth * spaceCounterZoomDecimal.value)
const isDarkTheme = computed(() => store.getters['themes/isThemeDark'])

const styles = computed(() => {
  return {
    left: state.scroll.x + 'px',
    top: state.scroll.y + 'px'
  }
})

const createRipples = (ping) => {
  const rippleCount = 4
  let { x, y } = ping
  // const user = store.getters['currentSpace/userById'](userId)
  // let color = user.color
  const color = colord(ping.color).toHsl() // { h: 240, s: 100, l: 50, a: 0.5 }
  const shadowColorDelta = 0.2
  let shadowColor
  if (isDarkTheme.value) {
    shadowColor = colord(ping.color).lighten(shadowColorDelta).toHsl()
  } else {
    shadowColor = colord(ping.color).darken(shadowColorDelta).toHsl()
  }
  // create initial ripples
  for (var i = 1; i < rippleCount + 1; i++) {
    const decay = Math.pow(0.65, i)
    const ripple = {
      x,
      y,
      color,
      shadowColor,
      radius: 1,
      shadowRadius: 0,
      speed: 10,
      decay,
      lineWidth: 10,
      shouldDestroy: false,
      opacity: 1
    }
    ripples.push(ripple)
  }
  console.log('🚛🚛🚛createRipples', ripples)
}

const drawRipples = () => {
  context.clearRect(0, 0, viewportWidth.value, viewportHeight.value)
  ripples.forEach(ripple => {
    let { x, y, lineWidth, shadowRadius, radius, color, shadowColor, opacity } = ripple
    x = x - state.scroll.x
    y = y - state.scroll.y
    // shadow
    context.beginPath()
    context.lineWidth = lineWidth + 2
    context.strokeStyle = `hsla(${shadowColor.h}, ${shadowColor.s}%, ${shadowColor.l}%, ${opacity / 2})`
    context.arc(x, y, shadowRadius, 0, 2 * Math.PI)
    context.stroke()
    context.closePath()
    // ripple
    context.beginPath()
    context.lineWidth = lineWidth
    context.strokeStyle = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${opacity})`
    context.arc(x, y, radius, 0, 2 * Math.PI)
    context.stroke()
    context.closePath()
  })
}

const destroyRipples = () => {
  ripples = ripples.filter(ripple => !ripple.shouldDestroy)
}
const updateRipples = () => {
  const fadeRadius = 250
  const destroyRadius = 400
  ripples = ripples.map(ripple => {
    const radiusDelta = ripple.speed * ripple.decay
    ripple.radius += radiusDelta
    ripple.shadowRadius += radiusDelta
    if (ripple.lineWidth > 1) {
      ripple.lineWidth -= 0.35 * ripple.decay
    }
    if (ripple.radius > fadeRadius && ripple.opacity > 0) {
      ripple.opacity -= 0.1
    }
    if (ripple.radius > destroyRadius) {
      ripple.shouldDestroy = true
    }
    return ripple
  })
  destroyRipples()
}

const rippleFrame = () => {
  if (ripples.length) {
    drawRipples()
    updateRipples()
  }
  requestAnimationFrame(rippleFrame)
}

</script>

<template lang="pug">
aside
  canvas#sonar(
    :width="viewportWidth"
    :height="viewportHeight"
    :style="styles"
  )
</template>

<style lang="stylus" scoped>
canvas
  background-color rgba(0,128,128, 0.5) //temp
  pointer-events none
  position fixed
  top 0
  left 0
</style>
