<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import postMessage from '@/postMessage.js'

const globalStore = useGlobalStore()
const spaceStore = useSpaceStore()

const visible = computed(() => globalStore.isSpacePage)
// image backgrounds are tinted in SpaceBackground with background-blend-mode instead,
// because a page sized mix-blend-mode layer costs hundreds of MB on ios
const isGradient = computed(() => spaceStore.backgroundIsGradient)

// tint

const backgroundTint = computed(() => {
  const color = spaceStore.getBackgroundTintColor
  if (!color) { return }
  postMessage.send({ name: 'setBackgroundTintColor', value: color })
  return color
})

// styles

const spaceZoomDecimal = computed(() => globalStore.getSpaceZoomDecimal)
const pageHeight = computed(() => globalStore.pageHeight)
const pageWidth = computed(() => globalStore.pageWidth)
const styles = computed(() => {
  const zoom = 1 / spaceZoomDecimal.value
  let styles = {
    width: `${pageWidth.value}px`,
    height: `${pageHeight.value}px`,
    background: backgroundTint.value
  }
  styles = globalStore.updateSpaceBorderRadiusStyles(styles)
  return styles
})

</script>

<template lang="pug">
#space-background-tint(v-if="visible && backgroundTint && isGradient" :style="styles")
</template>

<style lang="stylus">
#space-background-tint
  position absolute
  pointer-events none
  z-index 0
  mix-blend-mode multiply
  transform-origin top left
</style>
