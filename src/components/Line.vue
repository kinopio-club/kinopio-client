<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import postMessage from '@/postMessage.js'
const store = useStore()

let isMultiTouch
// locking
// long press to touch drag card
const lockingPreDuration = 100 // ms
const lockingDuration = 100 // ms
let lockingAnimationTimer, lockingStartTime, shouldCancelLocking
let initialTouchEvent = {}
let touchPosition = {}
let currentTouchPosition = {}

const props = defineProps({
  line: Object
})

const state = reactive({
  isLocking: false,
  lockingPercent: 0,
  lockingAlpha: 0
})

// styles

const styles = computed(() => {
  let styles = {
    top: props.line.y + 'px'
  }
  return styles
})
const infoStyles = computed(() => {
  let styles = {
    backgroundColor: props.line.color
  }
  if (store.state.isSelectingAllBelow) {
    styles.pointerEvents = 'none'
  }
  return styles
})
const horizontalLineStyles = computed(() => {
  return {
    backgroundColor: props.line.color,
    width: store.state.pageWidth + 'px'
  }
})

// line dragging

const isSelected = computed(() => {
  const selectedIds = store.state.multipleBoxesSelectedIds
  return selectedIds.includes(props.line.id)
})
const isDragging = computed(() => {
  const isDragging = store.state.currentUserIsDraggingLine
  const isCurrent = store.state.currentDraggingLineId === props.line.id
  return isDragging && (isCurrent || isSelected.value)
})
const currentLineIsSelected = computed(() => {
  const selected = store.state.multipleLinesSelectedIds
  return selected.find(id => props.Line.id === id)
})
const startLineInfoInteraction = (event) => {
  if (!currentLineIsSelected.value) {
    store.dispatch('clearMultipleSelected')
  }
  store.commit('currentDraggingLineId', '')
  store.dispatch('closeAllDialogs')
  store.commit('currentUserIsDraggingLine', true)
  store.commit('currentDraggingLineId', props.line.id)
  const updates = {
    lineId: props.line.id,
    userId: store.state.currentUser.id
  }
  store.commit('broadcast/updateStore', { updates, type: 'addToRemoteLinesDragging' })
}
const notifyPressAndHoldToDrag = () => {
  const hasNotified = store.state.hasNotifiedPressAndHoldToDrag
  if (!hasNotified) {
    store.commit('addNotification', { message: 'Press and hold to drag lines', icon: 'press-and-hold' })
  }
  store.commit('hasNotifiedPressAndHoldToDrag', true)
}

// touch locking

const updateTouchPosition = (event) => {
  initialTouchEvent = event
  isMultiTouch = false
  if (utils.isMultiTouch(event)) {
    isMultiTouch = true
    return
  }
  touchPosition = utils.cursorPositionInViewport(event)
}
const updateCurrentTouchPosition = (event) => {
  currentTouchPosition = utils.cursorPositionInViewport(event)
  if (isDragging.value) {
    event.preventDefault() // allows dragging lines without scrolling
  }
}
const cancelLocking = () => {
  shouldCancelLocking = true
}
const cancelLockingAnimationFrame = () => {
  state.isLocking = false
  state.lockingPercent = 0
  state.lockingAlpha = 0
  shouldCancelLocking = false
}
const startLocking = (event) => {
  console.log('startLocking', event)
  updateTouchPosition(event)
  updateCurrentTouchPosition(event)
  state.isLocking = true
  shouldCancelLocking = false
  setTimeout(() => {
    if (!lockingAnimationTimer) {
      lockingAnimationTimer = window.requestAnimationFrame(lockingAnimationFrame)
    }
  }, lockingPreDuration)
}
const lockingAnimationFrame = (timestamp) => {
  if (!lockingStartTime) {
    lockingStartTime = timestamp
  }
  const elaspedTime = timestamp - lockingStartTime
  const percentComplete = (elaspedTime / lockingDuration) // between 0 and 1
  if (!utils.cursorsAreClose(touchPosition, currentTouchPosition)) {
    notifyPressAndHoldToDrag()
    cancelLockingAnimationFrame()
  }
  if (shouldCancelLocking) {
    cancelLockingAnimationFrame()
  }
  if (state.isLocking && percentComplete <= 1) {
    const percentRemaining = Math.abs(percentComplete - 1)
    state.lockingPercent = percentRemaining
    const alpha = utils.easeOut(percentComplete, elaspedTime, lockingDuration)
    state.lockingAlpha = alpha
    window.requestAnimationFrame(lockingAnimationFrame)
  } else if (state.isLocking && percentComplete > 1) {
    console.log('🔒🐢 line lockingAnimationFrame locked')
    lockingAnimationTimer = undefined
    lockingStartTime = undefined
    state.isLocking = false
    startLineInfoInteraction(initialTouchEvent)
  } else {
    window.cancelAnimationFrame(lockingAnimationTimer)
    lockingAnimationTimer = undefined
    lockingStartTime = undefined
    cancelLockingAnimationFrame()
  }
}

// line details

const endLineInfoInteraction = (event) => {
  const isMeta = event.metaKey || event.ctrlKey
  const userId = store.state.currentUser.id
  const canEditLine = store.getters['currentUser/canEditLine'](props.line)
  store.dispatch('currentLines/afterMove')
  store.dispatch('currentCards/afterMove')
  if (store.state.currentUserIsPainting) { return }
  if (isMultiTouch) { return }
  if (store.state.currentUserIsPanningReady || store.state.currentUserIsPanning) { return }
  if (!canEditLine) { store.commit('triggerReadOnlyJiggle') }
  store.commit('broadcast/updateStore', { updates: { userId }, type: 'clearRemoteLinesDragging' })
  store.dispatch('closeAllDialogs')
  if (isMeta) {
    store.dispatch('multipleLinesSelectedIds', [])
  } else {
    store.dispatch('clearMultipleSelected')
  }
  if (!store.state.linesWereDragged && !isMeta) {
    store.commit('lineDetailsIsVisibleForLineId', props.line.id)
    event.stopPropagation() // prevent stopInteractions() from closing lineDetails
    store.commit('currentUserIsDraggingLine', false)
    store.commit('linesWereDragged', false)
  }
}

</script>

<template lang="pug">
.line(:key="props.line.id" :data-line-id="props.line.id" :style="styles")
  .line-info.badge.button-badge(
    :style="infoStyles"
    :data-line-id="props.line.id"
    tabindex="0"
    @mousedown.left="startLineInfoInteraction"

    @mouseup.left="endLineInfoInteraction"
    @keyup.stop.enter="endLineInfoInteraction"

    @touchstart="startLocking"
    @touchmove="updateCurrentTouchPosition"
    @touchend="endLineInfoInteractionTouch"
  )
    button.small-button
      img.icon(src="@/assets/brush-y.svg")
    span {{props.line.name}}
  .line-horizontal(:style="horizontalLineStyles" :class="{ active: isDragging }")

//- :class="{hover: isHover, active: isDragging}"

  //-   template(v-if="isH1")
  //-     h1 {{h1Name}}
  //-   template(v-else-if="isH2")
  //-     h2 {{h2Name}}
  //-   template(v-else)
  //-     span {{line.name}}
</template>

<style lang="stylus">
.line
  position absolute
  .line-info
    width fit-content
    transform translate(0, 15px)
    cursor pointer
    pointer-events auto
    padding 6px
    box-shadow none
    border-radius var(--entity-radius)
    border-top-left-radius 0
    border-bottom-left-radius 0
    button + span
      margin-left 4px
    button
      background-color transparent
  .line-horizontal
    left 0
    height 2px
    transform translateY(-1px)
    z-index -1
    position relative
    &.active
      height 4px
</style>
