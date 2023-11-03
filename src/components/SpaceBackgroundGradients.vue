<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import random from 'lodash-es/random'
import randomColor from 'randomcolor'
import { colord, extend } from 'colord'

const store = useStore()

onMounted(() => {
  generate()
})
const props = defineProps({
  visible: Boolean
})

const state = reactive({
  layer1: {
    positionX: 0,
    positionY: 0,
    color1: '',
    color2: ''
  },
  layer2: {
    positionX: 0,
    positionY: 0,
    color1: '',
    color2: ''
  },
  layer3: {
    positionX: 0,
    positionY: 0,
    color1: '',
    color2: ''
  },
  layer4: {
    positionX: 0,
    positionY: 0,
    color1: '',
    color2: ''
  },
  layer5: {
    positionX: 0,
    positionY: 0,
    color1: '',
    color2: ''
  },
  layer6: {
    positionX: 0,
    positionY: 0,
    color1: '',
    color2: ''
  },
  layer7: {
    color: ''
  }
})

// generate new

const randomRGBA = (alpha) => {
  const hex = randomColor({ hue: 'random', luminosity: 'random' })
  // const alpha = random(1, true)
  const rgba = colord(hex).alpha(alpha).toRgbString()
  return rgba
}
const generate = () => {
  const gradientLayers = ['layer1', 'layer2', 'layer3', 'layer4', 'layer5', 'layer6']
  const backgroundLayer = 'layer7'
  gradientLayers.forEach(layer => generateLayer(layer))
  console.log('🐸 background gradient layers', state)
  state[backgroundLayer].color = randomRGBA(1)
}
const generateLayer = (layer) => {
  state[layer].positionX = random(140, true)
  state[layer].positionY = random(140, true)
  state[layer].color1 = randomRGBA(1)
  state[layer].color2 = randomRGBA(0)
}

// layers

const stylesLayer1 = computed(() => {
  const layer = 'layer1'
  const positionX = state[layer].positionX
  const positionY = state[layer].positionY
  const color1 = state[layer].color1
  const color2 = state[layer].color2
  return {
    background: `radial-gradient(at ${positionX}% ${positionY}%, ${color1} 0%, ${color2} 80%)`
  }
})
const stylesLayer2 = computed(() => {
  const layer = 'layer2'
  const positionX = state[layer].positionX
  const positionY = state[layer].positionY
  const color1 = state[layer].color1
  const color2 = state[layer].color2
  return {
    background: `radial-gradient(at ${positionX}% ${positionY}%, ${color1} 0%, ${color2} 80%)`
  }
})
const stylesLayer3 = computed(() => {
  const layer = 'layer3'
  const positionX = state[layer].positionX
  const positionY = state[layer].positionY
  const color1 = state[layer].color1
  const color2 = state[layer].color2
  return {
    background: `radial-gradient(at ${positionX}% ${positionY}%, ${color1} 0%, ${color2} 80%)`
  }
})

const stylesLayer4 = computed(() => {
  const layer = 'layer4'
  const positionX = state[layer].positionX
  const positionY = state[layer].positionY
  const color1 = state[layer].color1
  const color2 = state[layer].color2
  return {
    background: `radial-gradient(at ${positionX}% ${positionY}%, ${color1} 0%, ${color2} 80%)`
  }
})
const stylesLayer5 = computed(() => {
  const layer = 'layer5'
  const positionX = state[layer].positionX
  const positionY = state[layer].positionY
  const color1 = state[layer].color1
  const color2 = state[layer].color2
  return {
    background: `radial-gradient(at ${positionX}% ${positionY}%, ${color1} 0%, ${color2} 80%)`
  }
})
const stylesLayer6 = computed(() => {
  const layer = 'layer6'
  const positionX = state[layer].positionX
  const positionY = state[layer].positionY
  const color1 = state[layer].color1
  const color2 = state[layer].color2
  return {
    background: `radial-gradient(at ${positionX}% ${positionY}%, ${color1} 0%, ${color2} 80%)`
  }
})
const stylesLayer7 = computed(() => {
  const layer = 'layer7'
  return {
    background: state[layer].color
  }
})

</script>

<template lang="pug">
.space-background-gradients(v-if="visible")
  .gradients-layer.layer-1(:style="stylesLayer1")
  .gradients-layer.layer-2(:style="stylesLayer2")
  .gradients-layer.layer-3(:style="stylesLayer3")
  .gradients-layer.layer-4(:style="stylesLayer4")
  .gradients-layer.layer-5(:style="stylesLayer5")
  .gradients-layer.layer-6(:style="stylesLayer6")
  .gradients-layer.layer-7(:style="stylesLayer7")
</template>

<style lang="stylus">
.space-background-gradients
  overflow hidden
  position absolute
  width 100%
  height 100%
  pointer-events none
  z-index 0
  transform-origin top left
  background var(--primary-background)

  .gradients-layer
    position absolute
    height 100%
    width 100%
    transition opacity 4000ms

  .layer-1
    opacity 0
    z-index 100
  .layer-2
    opacity 1
    z-index 99
  .layer-3
    opacity 0
    z-index 98
  .layer-4
    opacity 1
    z-index 97
  .layer-5
    opacity 0
    z-index 96
  .layer-6
    opacity 1
    z-index 95
  .layer-7
    transition background 2000ms
    opacity 1
    z-index 5
</style>
