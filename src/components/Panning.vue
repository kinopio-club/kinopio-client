<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import { usePanMomentum } from '@/composables/usePanMomentum'
import utils from '@/utils.js'

const globalStore = useGlobalStore()

const panMomentum = usePanMomentum()

let shouldStartPanning,
  startPosition,
  panningTimer,
  shouldCancelPanningTimer,
  panningDelta,
  shouldPanNextFrame,
  velocity

let unsubscribes

onMounted(() => {
  window.addEventListener('mousedown', cancelMomentum)
  window.addEventListener('mousemove', checkIfShouldStartPanning)
  window.addEventListener('mouseup', checkIfShouldStartMomentum)
  window.addEventListener('wheel', cancelMomentum)

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerPanningStart') {
        shouldStartPanning = true
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', cancelMomentum)
  window.removeEventListener('mousemove', checkIfShouldStartPanning)
  window.removeEventListener('mouseup', checkIfShouldStartMomentum)
  window.removeEventListener('wheel', cancelMomentum)
  unsubscribes()
})

// handle pointer events

const checkIfShouldStartPanning = (event) => {
  if (globalStore.currentUserIsPanning) {
    event.preventDefault()
    updatePanningPosition(event)
    initPanning(event)
  }
}
const checkIfShouldStartMomentum = () => {
  if (panningDelta) {
    panMomentum.start(velocity)
  }
  shouldCancelPanningTimer = true
}
const cancelMomentum = (event) => {
  panMomentum.cancel()
  if (event?.type === 'wheel') {
    shouldCancelPanningTimer = true
    startPosition = null
    panningDelta = null
    shouldPanNextFrame = false
  }
}

// panning

const initPanning = (event) => {
  const position = utils.cursorPositionInPage(event)
  if (shouldStartPanning) {
    panMomentum.cancel()
    startPosition = position
    shouldStartPanning = false
    shouldCancelPanningTimer = false
    panningTimer = window.requestAnimationFrame(panningFrame)
  }
}
const updatePanningPosition = (event) => {
  const position = utils.cursorPositionInPage(event)
  if (startPosition) {
    const delta = {
      x: startPosition.x - position.x,
      y: startPosition.y - position.y
    }
    velocity = { x: delta.x, y: delta.y }
    panningDelta = delta
    shouldPanNextFrame = true
  }
}
const panningFrame = () => {
  // scroll frame
  if (shouldPanNextFrame) {
    window.scrollBy(panningDelta.x, panningDelta.y, 'instant')
    shouldPanNextFrame = false
  }
  panningTimer = window.requestAnimationFrame(panningFrame)
  // cancel
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
