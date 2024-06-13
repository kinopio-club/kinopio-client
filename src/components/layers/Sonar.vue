<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import { nanoid } from 'nanoid'
import { colord } from 'colord'

const store = useStore()

// const maxRadius = 150

let canvas, context

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

// adapted from https://codepen.io/pillowmermaid/details/xrwVPQ

const state = reactive({
  ripples: [] // { x, y, color, radius, shadowRadius, speed, decay, lineWidth, shouldDestroy, opacity }

  // waves: [] // [ { id, {wave} }, ... ]

  // color, opacity, ripples, speed, rippleCount

  // wave = color, [ripples]
  // ripples
})

const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)
// const init = () => {
//   if (rippleTimer) { return }
//   rippleTimer = window.requestAnimationFrame(rippleFrame)
// }

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
    state.ripples.push(ripple)
  }

  console.log('🚛🚛🚛', state.ripples)
}

const rippleFrame = () => {
  if (state.ripples.length) {
  }
  // console.log('✝️ rippleFrame', state.ripples.length)
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
