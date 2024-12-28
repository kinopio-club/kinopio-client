<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

let shouldStartPanning,
  startPosition,
  currentPosition,
  panningTimer,
  shouldCancelPanningTimer,
  panningDelta,
  shouldPanNextFrame,
  velocity,
  momentumTimer,
  shouldCancelMomentumTimer

let unsubscribe

onMounted(() => {
  window.addEventListener('mousedown', cancelMomentum)
  window.addEventListener('mousemove', checkIfShouldStartPanning)
  window.addEventListener('mouseup', checkIfShouldStartMomentum)
  window.addEventListener('wheel', cancelMomentum)
  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'triggerPanningStart') {
      shouldStartPanning = true
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', cancelMomentum)
  window.removeEventListener('mousemove', checkIfShouldStartPanning)
  window.removeEventListener('mouseup', checkIfShouldStartMomentum)
  window.removeEventListener('wheel', cancelMomentum)
  unsubscribe()
})

// handle pointer events

const checkIfShouldStartPanning = (event) => {
  if (store.state.currentUserIsPanning) {
    event.preventDefault()
    updatePanningPosition(event)
    initPanning(event)
  }
}
const checkIfShouldStartMomentum = () => {
  if (panningDelta) {
    startMomentum()
  }
  shouldCancelPanningTimer = true
}

const cancelMomentum = () => {
  shouldCancelMomentumTimer = true
}

// panning

const initPanning = (event) => {
  const position = utils.cursorPositionInPage(event)
  if (shouldStartPanning) {
    startPosition = position
    shouldStartPanning = false
    shouldCancelPanningTimer = false
    shouldCancelMomentumTimer = false
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

// momentum scrolling, post-panning

const startMomentum = () => {
  const deceleration = 0.97 // Adjust this value to change the momentum decay
  const threshold = 0.3 // Stop when velocity is low

  const momentumFrame = () => {
    // cancel
    const velocityIsLow = Math.abs(velocity.x) < threshold && Math.abs(velocity.y) < threshold
    if (velocityIsLow || shouldPanNextFrame || shouldCancelMomentumTimer) {
      window.cancelAnimationFrame(momentumTimer)
      return
    }
    // scroll frame
    velocity.x *= deceleration
    velocity.y *= deceleration
    window.scrollBy(velocity.x, velocity.y, 'instant')
    momentumTimer = window.requestAnimationFrame(momentumFrame)
  }
  momentumTimer = window.requestAnimationFrame(momentumFrame)
}
</script>

<template lang="pug">
</template>

<style lang="stylus">
</style>
