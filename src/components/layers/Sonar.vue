<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import { colord } from 'colord'

const store = useStore()

// adapted from https://codepen.io/pillowmermaid/details/xrwVPQ
let canvas, context
let ripples = [] // { x, y, color, radius, shadowRadius, speed, decay, lineWidth, shouldDestroy, opacity }

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'triggerSonar') {
      const card = mutation.payload
      createRipples(card)
    }
  })
  canvas = document.getElementById('sonar')
  context = canvas.getContext('2d')
  window.requestAnimationFrame(rippleFrame)
})

const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)

const createRipples = (card) => {
  const rippleCount = 4
  const { x, y, userId } = card
  const user = store.getters['currentSpace/userById'](userId)
  let color = user.color
  color = colord(color).toHsl() // { h: 240, s: 100, l: 50, a: 0.5 }
  // create initial ripples
  for (var i = 1; i < rippleCount + 1; i++) {
    const decay = Math.pow(0.65, i)
    const ripple = {
      x,
      y,
      color,
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

const destroyRipples = () => {
  ripples = ripples.filter(ripple => !ripples.shouldDestroy)
}

const drawRipples = () => {
  ripples.forEach(ripple => {

  })
  destroyRipples()
}

const rippleFrame = () => {
  // console.log('✝️ rippleFrame', ripples.length)
  if (ripples.length) {
    drawRipples()
  }
  requestAnimationFrame(rippleFrame)
}

</script>

<template lang="pug">
aside
  canvas#sonar(
    :width="viewportWidth"
    :height="viewportHeight"
  )
</template>

<style lang="stylus" scoped>
canvas
  background-color pink
  pointer-events none
  position fixed
  top 0
</style>
