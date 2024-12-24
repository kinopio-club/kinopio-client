<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

let unsubscribe

onMounted(() => {
  window.addEventListener('mousemove', handleMoveEvent)
  window.addEventListener('mouseup', handleEndEvent)

  window.addEventListener('touchstart', touchStart)
  window.addEventListener('touchmove', handleMoveEvent)
  window.addEventListener('touchend', handleEndEvent)

  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerPanningStart') {
      shouldStartPanning = true
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMoveEvent)
  window.removeEventListener('mouseup', handleEndEvent)

  window.removeEventListener('touchmove', handleMoveEvent)
  window.removeEventListener('touchend', handleEndEvent)

  unsubscribe()
})

// handle pointer events

const touchStart = (event) => {
  shouldStartPanning = true
  initPanning(event)
}
const handleMoveEvent = (event) => {
  // mouse panning triggered in KeyboardShortcutsHandler
  if (store.state.currentUserIsPanning) {
    event.preventDefault()
    updatePanningPosition(event)
    initPanning(event)
  }
}
const handleEndEvent = () => {
  shouldCancelPanningTimer = true
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
