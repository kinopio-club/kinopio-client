<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const maxRadius = 150

// import utils from '@/utils.js'

// adapted from https://codepen.io/pillowmermaid/details/xrwVPQ

let canvas, context

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'triggerSonar') {
      const card = mutation.payload
      createWave(card)
    }
  })
  canvas = document.getElementById('sonar')
  context = canvas.getContext('2d')
})

const state = reactive({
  // a wave is a group of ripple circles
  waves: [] // { hue, saturation, luminance, opacity, iterations, ripples, rippleSpeed, rippleCount }
})

const viewportHeight = computed(() => store.state.viewportHeight)
const viewportWidth = computed(() => store.state.viewportWidth)

const createWave = (card) => {
  const { x, y, userId } = card
  const user = store.getters['currentSpace/userById'](userId)
  let color = user.color
  console.log('🚛🚛🚛', x, y, userId, card, user, color)
// { hue, saturation, luminance, opacity, iterations, ripples, rippleSpeed, rippleCount }
  // ripples
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
