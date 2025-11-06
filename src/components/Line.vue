<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useLineStore } from '@/stores/useLineStore'
import { useUserStore } from '@/stores/useUserStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import utils from '@/utils.js'
import postMessage from '@/postMessage.js'

const globalStore = useGlobalStore()
const lineStore = useLineStore()
const userStore = useUserStore()
const broadcastStore = useBroadcastStore()

let isMultiTouch
// locking
// long press to touch drag card
const lockingPreDuration = 100 // ms
const lockingDuration = 100 // ms
let lockingAnimationTimer, lockingStartTime, shouldCancelLocking
const initialTouchEvent = {}
const touchPosition = {}
const currentTouchPosition = {}

const props = defineProps({
  line: Object
})

const state = reactive({
  isLocking: false,
  lockingPercent: 0,
  lockingAlpha: 0
})

// styles

const colorClasses = computed(() => {
  return utils.colorClasses({ backgroundColor: props.line.color })
})
const lineStyles = computed(() => {
  const styles = {
    top: props.line.y + 'px',
    backgroundColor: props.line.color,
    width: globalStore.pageWidth + 'px'
  }
  return styles
})
const infoStyles = computed(() => {
  const styles = {
    backgroundColor: props.line.color,
    top: props.line.y - 10 + 'px'
  }
  if (globalStore.isSelectingAllBelow) {
    styles.pointerEvents = 'none'
  }
  return styles
})

// select

const selectAllBelow = () => {
  console.log('💐💐💐')
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
  return selected.find(id => props.Line.id === id)
})
const startLineInfoInteraction = (event) => {
  if (!currentLineIsSelected.value) {
    globalStore.clearMultipleSelected()
  }
  globalStore.currentDraggingLineId = ''
  globalStore.closeAllDialogs()
  globalStore.currentUserIsDraggingLine = true
  globalStore.currentDraggingLineId = props.line.id
  const updates = {
    lineId: props.line.id,
    userId: userStore.id
  }
  broadcastStore.update({ updates, action: 'addtoRemoteLinesDragging' })
}

// touch locking

// const notifyPressAndHoldToDrag = () => {
//   const hasNotified = globalStore.hasNotifiedPressAndHoldToDrag
//   if (!hasNotified) {
//     globalStore.addNotification({ message: 'Press and hold to drag', icon: 'press-and-hold' })
//   }
//   globalStore.hasNotifiedPressAndHoldToDrag = true
// }

</script>

<template lang="pug">
.line(:data-line-id="props.line.id" :style="lineStyles")
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
  button.small-button.translucent-button(@click="selectAllBelow")
    img.icon(src="@/assets/brush-y.svg")
  span.name(:class="colorClasses") {{props.line.name}}
  .focusing-frame(v-if="isFocusing" :style="{backgroundColor: props.line.color}" @animationend="clearFocus")
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
