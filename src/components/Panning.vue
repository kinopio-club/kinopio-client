<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()

// Adjust this value to change the momentum decay
// Lower values (closer to 0.92) make the scrolling slower and smoother
// Higher values (closer to 0.96) make the scrolling faster and more abrupt
const momentumDeceleration = 0.95

// Threshold for stopping when velocity is low
// A smaller threshold ensures the scrolling stops only when it's very slow.
const momentumThreshold = 0.5

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

let unsubscribes

onMounted(() => {
  window.addEventListener('mousedown', cancelMomentum)
  window.addEventListener('mousemove', checkIfShouldStartPanning)
  window.addEventListener('mouseup', checkIfShouldStartMomentum)
  window.addEventListener('wheel', cancelMomentum)
  const globalStoreUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerPanningStart') {
        shouldStartPanning = true
      }
    }
  )
  unsubscribes = () => {
    globalStoreUnsubscribe()
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
  const momentumFrame = () => {
    // cancel
    const velocityIsLow = Math.abs(velocity.x) < momentumThreshold && Math.abs(velocity.y) < momentumThreshold
    if (velocityIsLow || shouldPanNextFrame || shouldCancelMomentumTimer) {
      window.cancelAnimationFrame(momentumTimer)
      return
    }
    // scroll frame
    velocity.x *= momentumDeceleration
    velocity.y *= momentumDeceleration
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
