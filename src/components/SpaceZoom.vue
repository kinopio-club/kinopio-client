<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import Slider from '@/components/Slider.vue'
import consts from '@/consts.js'
import utils from '@/utils.js'

const globalStore = useGlobalStore()

const increment = 10
let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerSpaceZoomReset') {
        updateSpaceZoomFromTrigger(max.value)
        window.scrollTo(0, 0)
      } else if (name === 'triggerCenterZoomOrigin') {
        centerZoomOrigin()
      } else if (name === 'triggerSpaceZoomOutMax') {
        zoomOutOrInMax()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})

onBeforeUnmount(() => {
  unsubscribes()
})

const state = reactive({
  animateJiggleRight: false,
  animateJiggleLeft: false
})

const max = computed(() => consts.spaceZoom.max) // 100
const min = computed(() => consts.spaceZoom.min) // 20
const spaceZoomPercent = computed(() => globalStore.spaceZoomPercent)
const minKeyboardShortcut = computed(() => 'Z')

const isMobileOrTouch = computed(() => {
  return globalStore.getIsTouchDevice
})
const closeAllDialogs = () => {
  globalStore.clearMultipleSelected()
  globalStore.closeAllDialogs()
}

// zoom

const updateSpaceZoomFromTrigger = (percent) => {
  if (percent > max.value) {
    state.animateJiggleRight = true
  } else if (percent < min.value) {
    state.animateJiggleLeft = true
  }
  percent = Math.max(percent, min.value)
  percent = Math.min(percent, max.value)
  globalStore.spaceZoomPercent = percent
}
const updateSpaceZoomPercent = (percent) => {
  percent = percent / 100
  percent = Math.round(min.value + (max.value - min.value) * percent)
  globalStore.spaceZoomPercent = percent
}
const centerZoomOrigin = () => {
  const scroll = { x: window.scrollX, y: window.scrollY }
  const origin = {
    x: scroll.x + (globalStore.viewportWidth / 6),
    y: scroll.y + (globalStore.viewportHeight / 6)
  }
  globalStore.updateZoomOrigin(origin)
}
const zoomOutOrInMax = () => {
  centerZoomOrigin()
  if (globalStore.spaceZoomPercent === min.value) {
    globalStore.spaceZoomPercent = max.value
  } else {
    globalStore.spaceZoomPercent = min.value
  }
}

// slider

const updateSpaceZoom = (percent) => {
  centerZoomOrigin()
  updateSpaceZoomPercent(percent)
}
const resetZoom = () => {
  globalStore.zoomOrigin = { x: 0, y: 0 }
}
const removeAnimations = () => {
  state.animateJiggleRight = false
  state.animateJiggleLeft = false
}

</script>

<template lang="pug">
.space-zoom(v-if="!isMobileOrTouch")
  Slider(
    @updatePlayhead="updateSpaceZoom"
    @resetPlayhead="resetZoom"
    :minValue="min"
    :value="spaceZoomPercent"
    :maxValue="max"
    :animateJiggleRight="state.animateJiggleRight"
    :animateJiggleLeft="state.animateJiggleLeft"
    @removeAnimations="removeAnimations"
    @pointerdown="closeAllDialogs"
    :minKeyboardShortcut="minKeyboardShortcut"
  )
</template>

<style lang="stylus">
.space-zoom
  display block
  width 100px
</style>
