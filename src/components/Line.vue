<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useLineStore } from '@/stores/useLineStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import postMessage from '@/postMessage.js'

const globalStore = useGlobalStore()
const lineStore = useLineStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const broadcastStore = useBroadcastStore()

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

const userIsSpaceMember = computed(() => userStore.getUserIsSpaceMember)

// Remote

const isRemoteSelected = computed(() => {
  const remoteLinesSelected = globalStore.remoteLinesSelected
  const selectedLine = remoteLinesSelected.find(line => line.lineId === props.line.id)
  return Boolean(selectedLine)
})
const isRemoteLineDetailsVisible = computed(() => {
  const remoteLineDetailsVisible = globalStore.remoteLineDetailsVisible
  const visibleLine = remoteLineDetailsVisible.find(line => line.lineId === props.line.id)
  return Boolean(visibleLine)
})
const remoteLineDetailsVisibleColor = computed(() => {
  const remoteLineDetailsVisible = globalStore.remoteLineDetailsVisible
  const visibleLine = remoteLineDetailsVisible.find(line => line.lineId === props.line.id)
  if (visibleLine) {
    const user = spaceStore.getSpaceUserById(visibleLine.userId)
    return user.color
  } else {
    return undefined
  }
})
const remoteSelectedColor = computed(() => {
  const remoteLinesSelected = globalStore.remoteLinesSelected
  const selectedLine = remoteLinesSelected.find(line => line.lineId === props.line.id)
  if (selectedLine) {
    const user = spaceStore.getSpaceUserById(selectedLine.userId)
    return user.color
  } else {
    return undefined
  }
})
const remoteLineDraggingColor = computed(() => {
  const remoteLinesDragging = globalStore.remoteLinesDragging
  const draggingLine = remoteLinesDragging.find(line => line.lineId === props.line.id)
  if (draggingLine) {
    const user = spaceStore.getSpaceUserById(draggingLine.userId)
    return user.color
  } else {
    return undefined
  }
})

// styles

const color = computed(() => {
  let color = props.line.color
  const remoteColor = remoteLineDetailsVisibleColor.value || remoteSelectedColor.value || remoteLineDraggingColor.value
  if (remoteColor) {
    color = remoteColor
  }
  if (isSelected.value) {
    color = userStore.color
  }
  return color
})
const colorClasses = computed(() => {
  return utils.colorClasses({ backgroundColor: color.value })
})
const lineStyles = computed(() => {
  const styles = {
    top: props.line.y + 'px',
    backgroundColor: color.value,
    width: globalStore.pageWidth + 'px'
  }
  return styles
})
const infoStyles = computed(() => {
  const styles = {
    backgroundColor: color.value,
    top: props.line.y - consts.lineInfoOffset + 'px'
  }
  if (globalStore.isSelectingAllBelow) {
    styles.pointerEvents = 'none'
  }
  return styles
})

// select

const selectAllBelow = () => {
  if (globalStore.linesWereDragged) { return }
  const position = {
    y: props.line.y - 1
  }
  globalStore.preventMultipleSelectedActionsIsVisible = true
  globalStore.triggerSelectAllItemsBelowCursor(position)
}

// card focus

const isFocusing = computed(() => props.line.id === globalStore.focusOnLineId)
const clearFocus = () => {
  globalStore.focusOnLineId = ''
}

// line dragging

const isSelected = computed(() => {
  const selectedIds = globalStore.multipleLinesSelectedIds
  return selectedIds.includes(props.line.id)
})
const isDragging = computed(() => {
  const value = globalStore.currentUserIsDraggingLine
  const isCurrent = globalStore.currentDraggingLineId === props.line.id
  return value && (isCurrent || isSelected.value)
})
const currentLineIsSelected = computed(() => {
  const selected = globalStore.multipleLinesSelectedIds
  return selected.find(id => props.line.id === id)
})
const startLineInfoInteraction = (event) => {
  if (!currentLineIsSelected.value) {
    globalStore.clearMultipleSelected()
  }
  globalStore.currentDraggingLineId = ''
  globalStore.closeAllDialogs()
  globalStore.linesWereDragged = false
  globalStore.currentUserIsDraggingLine = true
  globalStore.currentDraggingLineId = props.line.id
  const updates = {
    lineId: props.line.id,
    userId: userStore.id
  }
  broadcastStore.update({ updates, action: 'addToRemoteLinesDragging' })
}

// line details

const endLineInfoInteraction = (event) => {
  if (isMultiTouch) { return }
  globalStore.clearMultipleSelected()
  broadcastStore.update({ updates: { userId: userStore.id }, action: 'clearRemoteLinesDragging' })
  // read only
  if (!userIsSpaceMember.value) {
    globalStore.triggerReadOnlyJiggle()
    return
  }
  // touch button fix
  const isButton = event.target.closest('button')
  if (isButton) {
    selectAllBelow()
    return
  }
  // toggle line details
  if (globalStore.lineDetailsIsVisibleForLineId) {
    globalStore.closeAllDialogs()
  } else if (!globalStore.linesWereDragged) {
    globalStore.updateLineDetailsIsVisibleForLineId(props.line.id)
  }
}
const endLineInfoInteractionTouch = (event) => {
  cancelLocking()
  if (touchIsNearTouchPosition(event)) {
    endLineInfoInteraction(event)
  }
}

// touch locking

const notifyPressAndHoldToDrag = () => {
  const hasNotified = globalStore.hasNotifiedPressAndHoldToDrag
  if (!hasNotified) {
    globalStore.addNotification({ message: 'Press and hold to drag', icon: 'press-and-hold' })
  }
  globalStore.hasNotifiedPressAndHoldToDrag = true
}
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
const touchIsNearTouchPosition = (event) => {
  const currentPosition = utils.cursorPositionInViewport(event)
  const touchBlur = 12
  const isTouchX = utils.isBetween({
    value: currentPosition.x,
    min: touchPosition.x - touchBlur,
    max: touchPosition.x + touchBlur
  })
  const isTouchY = utils.isBetween({
    value: currentPosition.y,
    min: touchPosition.y - touchBlur,
    max: touchPosition.y + touchBlur
  })
  if (isTouchX && isTouchY) {
    return true
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
  updateTouchPosition(event)
  updateCurrentTouchPosition(event)
  if (currentLineIsSelected.value) {
    state.isLocking = false
    startLineInfoInteraction(event)
    return
  }
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

</script>

<template lang="pug">
.line(:data-line-id="props.line.id" :data-line-y="props.line.y" :style="lineStyles")
.line-info.badge.button-badge(
    :data-line-id="props.line.id"
    :style="infoStyles"
    @mousedown.left="startLineInfoInteraction"
    @mouseup.left="endLineInfoInteraction"
    @keyup.stop.enter="endLineInfoInteraction"
    @touchstart="startLocking"
    @touchmove="updateCurrentTouchPosition"

    @touchend="endLineInfoInteractionTouch"
  )
  button.small-button.translucent-button(v-if="userIsSpaceMember" @click.stop="selectAllBelow")
    img.icon(src="@/assets/brush-y.svg")
  span.name(:class="colorClasses") {{props.line.name}}
  .focusing-frame(v-if="isFocusing || state.isLocking" :style="{backgroundColor: props.line.color}" @animationend="clearFocus")
</template>

<style lang="stylus">
.line
  pointer-events none
  width 100%
  height 1px
  position absolute
  left 0
  z-index calc(var(--max-z) - 100)
.line-info
  pointer-events all
  position absolute
  min-width 60px
  max-width fit-content
  z-index var(--max-z)
  border-top-left-radius 0
  border-bottom-left-radius 0
  left 0
  &.button-badge
    box-shadow none
  .name
    &.is-background-light
      color var(--primary-on-light-background)
    &.is-background-dark
      color var(--primary-on-dark-background)
  button
    margin-right 5px

</style>
