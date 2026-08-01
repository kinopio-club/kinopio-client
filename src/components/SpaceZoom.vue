<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import Slider from '@/components/Slider.vue'
import consts from '@/consts.js'

const globalStore = useGlobalStore()

const increment = 10
let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerSpaceZoomReset') {
        resetSpaceZoom()
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

const max = computed(() => consts.spaceZoom.max) // 180
const min = computed(() => consts.spaceZoom.min) // 20
const defaultValue = computed(() => consts.spaceZoom.default) // 100
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

const resetSpaceZoom = async () => {
  await globalStore.zoomSpaceTo({ percent: defaultValue.value })
  globalStore.spaceZoomOffset = { x: 0, y: 0 }
  window.scrollTo(0, 0)
}
const zoomOutOrInMax = () => {
  const isMin = globalStore.spaceZoomPercent === min.value
  const isMax = globalStore.spaceZoomPercent === max.value
  const isMiddle = !isMin && !isMax
  if (isMiddle) {
    globalStore.zoomSpaceTo({ percent: min.value })
  } else if (isMin) {
    globalStore.zoomSpaceTo({ percent: max.value })
  } else if (isMax) {
    globalStore.zoomSpaceTo({ percent: defaultValue.value })
  }
}

// slider

const updateSpaceZoom = (percent) => {
  percent = percent / 100
  percent = Math.round(min.value + (max.value - min.value) * percent)
  globalStore.zoomSpaceTo({ percent })
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
    :minValue="min"
    :value="spaceZoomPercent"
    :maxValue="max"
    :defaultValue="defaultValue"
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
