<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Slider from '@/components/Slider.vue'
import consts from '@/consts.js'
import utils from '@/utils.js'
const store = useStore()

const increment = 10

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerSpaceZoomReset') {
      updateSpaceZoomFromTrigger(max.value)
      window.scrollTo(0, 0)
    } else if (mutation.type === 'triggerCenterZoomOrigin') {
      centerZoomOrigin()
    } else if (mutation.type === 'triggerSpaceZoomOutMax') {
      zoomOutOrInMax()
    }
  })
})

const state = reactive({
  animateJiggleRight: false,
  animateJiggleLeft: false
})

const max = computed(() => consts.spaceZoom.max) // 100
const min = computed(() => consts.spaceZoom.min) // 20
const spaceZoomPercent = computed(() => store.state.spaceZoomPercent)
const minKeyboardShortcut = computed(() => 'Z')

const isMobileOrTouch = computed(() => {
  const isMobile = utils.isMobile()
  return store.isTouchDevice || isMobile
})
const closeAllDialogs = () => {
  store.dispatch('clearMultipleSelected')
  store.dispatch('closeAllDialogs')
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
  store.commit('spaceZoomPercent', percent)
}
const updateSpaceZoomPercent = (percent) => {
  percent = percent / 100
  percent = Math.round(min.value + (max.value - min.value) * percent)
  store.commit('spaceZoomPercent', percent)
}
const centerZoomOrigin = () => {
  const scroll = store.state.windowScroll
  const origin = {
    x: scroll.x + (store.state.viewportWidth / 6),
    y: scroll.y + (store.state.viewportHeight / 6)
  }
  store.dispatch('zoomOrigin', origin)
}
const zoomOutOrInMax = () => {
  centerZoomOrigin()
  if (store.state.spaceZoomPercent === min.value) {
    store.commit('spaceZoomPercent', max.value)
  } else {
    store.commit('spaceZoomPercent', min.value)
  }
}

// slider

const updateSpaceZoom = (percent) => {
  centerZoomOrigin()
  updateSpaceZoomPercent(percent)
}
const resetZoomOrigin = () => {
  store.commit('zoomOrigin', { x: 0, y: 0 })
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
    @resetPlayhead="resetZoomOrigin"
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
