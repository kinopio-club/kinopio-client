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

const props = defineProps({
  isForeground: Boolean
})

const drawingImageUrl = computed(() => globalStore.drawingImageUrl)

// styles

const spaceZoomDecimal = computed(() => globalStore.getSpaceZoomDecimal)
const pageHeight = computed(() => globalStore.pageHeight)
const pageWidth = computed(() => globalStore.pageWidth)
const styles = computed(() => {
  const zoom = 1 / spaceZoomDecimal.value
  const value = {
    backgroundImage: `url('${drawingImageUrl.value}')`
  }
  if (globalStore.getToolbarIsDrawing) {
    value.display = 'none'
  }
  return value
})

</script>

<template lang="pug">
.drawing-background-static(:style="styles" :class="{ 'is-foreground': props.isForeground }")
</template>

<style lang="stylus">
.drawing-background-static
  position absolute
  pointer-events none
  z-index 0
  width 100%
  height 100%
  &.is-foreground
    mix-blend-mode hard-light
    z-index var(--max-z)
</style>
