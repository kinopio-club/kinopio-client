<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import postMessage from '@/postMessage.js'
import utils from '@/utils.js'

import { colord, extend } from 'colord'

const store = useStore()

const visible = computed(() => store.getters.isSpacePage)
const isThemeDark = computed(() => store.state.currentUser.theme === 'dark')
const currentSpace = computed(() => store.state.currentSpace)

// tint

const backgroundTint = computed(() => {
  let color = currentSpace.value.backgroundTint || 'white'
  let darkness = 0
  const colorIsDark = utils.colorIsDark(color, 0.2)
  if (shouldDarkenTint.value && colorIsDark) {
    darkness = 0.5
  }
  color = colord(color).darken(darkness).toRgbString()
  postMessage.send({ name: 'setBackgroundTintColor', value: color })
  return color
})
const isNoBackgroundTint = computed(() => {
  const color = currentSpace.value.backgroundTint
  return !color || color === 'rgb(255, 255, 255)' || color === 'white'
})
const shouldDarkenTint = computed(() => isThemeDark.value && !spaceBackgroundTintIsDark.value)
const spaceBackgroundTintIsDark = computed(() => utils.colorIsDark(backgroundTint.value))

// styles

const spaceShouldHaveBorderRadius = computed(() => store.getters.spaceShouldHaveBorderRadius)
const spaceZoomDecimal = computed(() => store.getters.spaceZoomDecimal)
const pageHeight = computed(() => store.state.pageHeight)
const pageWidth = computed(() => store.state.pageWidth)
const styles = computed(() => {
  const zoom = 1 / spaceZoomDecimal.value
  return {
    width: `${pageWidth.value}px`,
    height: `${pageHeight.value}px`,
    transform: store.getters.zoomTransform,
    background: backgroundTint.value
  }
})

</script>

<template lang="pug">
.space-background-tint(v-if="visible" :style="styles" :class="{'space-border-radius': spaceShouldHaveBorderRadius}")
.space-background-tint.dark-tint(v-if="visible && isThemeDark && isNoBackgroundTint" :style="styles")
</template>

<style lang="stylus">
.space-background-tint
  position absolute
  pointer-events none
  z-index 0
  mix-blend-mode multiply
  transform-origin top left
  &.dark-tint
    background-color black
    opacity 0.6
</style>
