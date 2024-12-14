<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

let unsubscribe

onMounted(() => {
  window.addEventListener('mousemove', mouseMove)
  window.addEventListener('mouseup', mouseUp)
  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerPanningStart') {
      shouldStartPanning = true
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', mouseMove)
  window.removeEventListener('mouseup', mouseUp)
  unsubscribe()
})

// mouse events

const mouseUp = () => {
  shouldCancelPanningTimer = true
}
const mouseMove = (event) => {
  // panning triggered in KeyboardShortcutsHandler
  if (store.state.currentUserIsPanning) {
    event.preventDefault()
    updatePanningPosition(event)
    initPanning(event)
  }
}

// panning

let shouldStartPanning, startPosition, currentPosition, panningTimer, shouldCancelPanningTimer, panningDelta, shouldPanNextFrame

const updatePanningPosition = (event) => {
  const position = utils.cursorPositionInPage(event)
  if (startPosition) {
    panningDelta = {
      x: startPosition.x - position.x,
      y: startPosition.y - position.y
    }
    shouldPanNextFrame = true
  }
}
const initPanning = (event) => {
  const position = utils.cursorPositionInPage(event)
  if (shouldStartPanning) {
    startPosition = position
    shouldStartPanning = false
    shouldCancelPanningTimer = false
    panningTimer = window.requestAnimationFrame(panningFrame)
  }
}
const panningFrame = () => {
  if (shouldPanNextFrame) {
    window.scrollBy(panningDelta.x, panningDelta.y, 'instant')
    shouldPanNextFrame = false
  }
  panningTimer = window.requestAnimationFrame(panningFrame)
  if (shouldCancelPanningTimer) {
    window.cancelAnimationFrame(panningTimer)
    panningTimer = null
    startPosition = null
  }
}
</script>

<template lang="pug">
</template>

<style lang="stylus">
</style>
