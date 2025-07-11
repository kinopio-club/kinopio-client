<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useThemeStore } from '@/stores/useThemeStore'

import postMessage from '@/postMessage.js'
import utils from '@/utils.js'

import { colord, extend } from 'colord'

const globalStore = useGlobalStore()
const spaceStore = useSpaceStore()
const themeStore = useThemeStore()

const visible = computed(() => globalStore.getIsSpacePage)
const isThemeDark = computed(() => themeStore.getIsThemeDark)
const currentSpace = computed(() => spaceStore.getSpaceAllState)

// tint

const backgroundTint = computed(() => {
  let color = currentSpace.value.backgroundTint
  if (!color) { return }
  const colorIsDark = utils.colorIsDark(color, 0.8)
  if (isThemeDark.value) {
    let darkness = 0.4
    if (colorIsDark) {
      darkness = 0.1
    }
    color = colord(color).darken(darkness).toRgbString()
  } else {
    color = colord(color).toRgbString()
  }
  postMessage.send({ name: 'setBackgroundTintColor', value: color })
  return color
})

// styles

const spaceShouldHaveBorderRadius = computed(() => globalStore.getSpaceShouldHaveBorderRadius)
const spaceZoomDecimal = computed(() => globalStore.getSpaceZoomDecimal)
const pageHeight = computed(() => globalStore.pageHeight)
const pageWidth = computed(() => globalStore.pageWidth)
const styles = computed(() => {
  const zoom = 1 / spaceZoomDecimal.value
  return {
    width: `${pageWidth.value}px`,
    height: `${pageHeight.value}px`,
    background: backgroundTint.value
  }
})

</script>

<template lang="pug">
#space-background-tint(v-if="visible" :style="styles" :class="{'space-border-radius': spaceShouldHaveBorderRadius}")
</template>

<style lang="stylus">
#space-background-tint
  position absolute
  pointer-events none
  z-index 0
  mix-blend-mode multiply
  transform-origin top left
</style>
