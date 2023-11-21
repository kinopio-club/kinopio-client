<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'
const store = useStore()

onMounted(() => {
  window.addEventListener('wheel', handleMouseWheelEvents, { passive: false })
  window.addEventListener('scroll', handleScrollEvents)
  store.dispatch('updateWindowScroll')
})
onUnmounted(() => {
  window.removeEventListener('wheel', handleMouseWheelEvents, { passive: false })
  window.removeEventListener('scroll', handleScrollEvents)
})

// wheel

const handleMouseWheelEvents = (event) => {
  const min = consts.spaceZoom.min
  const max = consts.spaceZoom.max
  const isMeta = event.metaKey || event.ctrlKey // event.ctrlKey is true for trackpad pinch
  if (!isMeta) { return }
  event.preventDefault()
  const deltaY = event.deltaY
  let shouldZoomIn = deltaY < 0
  let shouldZoomOut = deltaY > 0
  const invertZoom = event.webkitDirectionInvertedFromDevice
  if (invertZoom) {
    shouldZoomIn = deltaY > 0
    shouldZoomOut = deltaY < 0
  }
  let speed = Math.max(Math.abs(deltaY), 1)
  updateZoomOrigin(event)
  store.dispatch('zoomSpace', { shouldZoomIn, shouldZoomOut, speed })
}

// scroll

const handleScrollEvents = (event) => {
  store.dispatch('updateWindowScroll')
}
const updateZoomOrigin = (event) => {
  const cursor = utils.cursorPositionInPage(event)
  store.dispatch('zoomOrigin', cursor)
}
</script>

<template lang="pug">
</template>

<style lang="stylus">
</style>
