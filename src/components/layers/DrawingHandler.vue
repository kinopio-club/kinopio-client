<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

import throttle from 'lodash-es/throttle'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

onMounted(() => {
  window.addEventListener('pointerup', endDrawing)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', endDrawing)
})

const props = defineProps({
  visible: Boolean
})

const viewportHeight = computed(() => globalStore.viewportHeight)
const viewportWidth = computed(() => globalStore.viewportWidth)
const toolbarIsDrawing = computed(() => globalStore.getToolbarIsDrawing)
const styles = computed(() => {
  const styles = {}
  if (toolbarIsDrawing.value) {
    styles.cursor = 'crosshair'
  } else {
    styles.pointerEvents = 'none'
  }
  return styles
})

const preventTouchScrolling = (event) => {
  if (toolbarIsDrawing.value) {
    event.preventDefault()
  }
}

const startDrawing = (event) => {
  if (utils.isMultiTouch(event)) { return }
  if (globalStore.currentUserIsPanningReady) { return }
  globalStore.currentUserIsDrawing = true
  globalStore.triggerStartDrawing(event)
}
const draw = throttle((event) => {
  if (globalStore.currentUserIsPanningReady) { return }
  globalStore.triggerDraw(event)
}, 16) // 60fps

const endDrawing = () => {
  globalStore.currentUserIsDrawing = false
}
</script>

<template lang="pug">
#drawing-handler(
  :width="viewportWidth"
  :height="viewportHeight"
  :style="styles"
  @touchmove="preventTouchScrolling"
  @mousedown.left="startDrawing"
  @touchstart="startDrawing"
  @pointermove="draw"
)
</template>

<style lang="stylus">
#drawing-handler
  position fixed
  background transparent
  top 0
  left 0
  width 100dvw
  height 100dvh
  opacity 1
</style>
