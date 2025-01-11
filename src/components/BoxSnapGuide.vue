<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()

let unsubscribe

let waitingAnimationTimer, shouldCancelWaiting, waitingStartTime

onMounted(() => {
  updateRect()
  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'clearDraggingItems') {
      cancelWaitingAnimationFrame()
    }
  })
})
onBeforeUnmount(() => {
  unsubscribe()
})

const props = defineProps({
  box: Object
})

const state = reactive({
  rect: null,
  snapStatus: null // waiting, ready
})

const currentBoxIsSelected = computed(() => {
  const selected = store.state.multipleBoxesSelectedIds
  return selected.find(id => props.box.id === id)
})
const currentBoxIsBeingDragged = computed(() => {
  const isDragging = store.state.currentUserIsDraggingBox
  const isCurrent = store.state.currentDraggingBoxId === props.box.id
  return isDragging && (isCurrent || currentBoxIsSelected.value)
})
const otherBoxes = computed(() => {
  const boxes = store.getters['currentBoxes/isSelectableInViewport']
  return boxes.filter(box => box?.id !== props.box.id)
})

// styles

const userColor = computed(() => store.state.currentUser.color)
const currentBoxSnapGuide = computed(() => {
  const isMultipleBoxesSelectedIds = store.state.multipleBoxesSelectedIds.length > 1
  if (isMultipleBoxesSelectedIds) { return }
  let guides = store.state.currentBoxes.snapGuides
  return guides.find(guide => {
    const isTarget = guide.target.id === props.box.id
    const isOrigin = guide.origin.id === props.box.id
    return isTarget || isOrigin
  })
})
const snapGuideSide = computed(() => {
  const isDraggingItem = store.state.currentUserIsDraggingBox || store.state.currentUserIsDraggingCard
  if (!isDraggingItem) { return }
  const snapGuide = currentBoxSnapGuide.value
  if (!snapGuide) { return null }
  if (snapGuide?.target.id === props.box.id) {
    return snapGuide.side
  } else if (snapGuide?.origin.id === props.box.id) {
    return oppositeSide(snapGuide.side)
  } else {
    return null
  }
})
const oppositeSide = (side) => {
  if (side === 'left') {
    return 'right'
  }
  if (side === 'right') {
    return 'left'
  }
  if (side === 'top') {
    return 'bottom'
  }
  if (side === 'bottom') {
    return 'top'
  }
}
const updateRect = () => {
  state.rect = utils.boxElementDimensions({ id: props.box.id })
}
const snapGuideStyles = computed(() => {
  const offset = 4
  let styles = {}
  let rect = state.rect
  styles.background = props.box.color
  // left
  if (snapGuideSide.value === 'left') {
    styles.height = rect.height + 'px'
    styles.left = (rect.x - offset) + 'px'
    styles.top = rect.y + 'px'
  // right
  } else if (snapGuideSide.value === 'right') {
    styles.height = rect.height + 'px'
    styles.left = (rect.x + rect.width - offset) + 'px'
    styles.top = rect.y + 'px'
  // top
  } else if (snapGuideSide.value === 'top') {
    styles.width = rect.width + 'px'
    styles.left = rect.x + 'px'
    styles.top = (rect.y - offset) + 'px'
  // bottom
  } else if (snapGuideSide.value === 'bottom') {
    styles.width = rect.width + 'px'
    styles.left = rect.x + 'px'
    styles.top = (rect.y + rect.height - offset) + 'px'
  }
  if (snapGuideSide.value) {
    startWaiting()
  }
  return styles
})

// waiting to snap

const cancelWaiting = () => {
  shouldCancelWaiting = true
}
const cancelWaitingAnimationFrame = () => {
  window.cancelAnimationFrame(waitingAnimationTimer)
  shouldCancelWaiting = false
  waitingAnimationTimer = null
  waitingStartTime = null
}
const startWaiting = () => {
  shouldCancelWaiting = false
  if (!waitingAnimationTimer) {
    waitingAnimationTimer = window.requestAnimationFrame(waitingAnimationFrame)
  }
}
const waitingAnimationFrame = (timestamp) => {
  if (!waitingStartTime) {
    waitingStartTime = timestamp
  }
  const snapGuide = currentBoxSnapGuide.value
  if (!snapGuide) {
    cancelWaitingAnimationFrame()
    return
  }
  const elaspedTime = timestamp - waitingStartTime
  const percentComplete = (elaspedTime / consts.boxSnapGuideWaitingDuration) // between 0 and 1
  updateRect()
  // waiting
  if (percentComplete < 1) {
    state.snapStatus = 'waiting'
    window.requestAnimationFrame(waitingAnimationFrame)
  // complete
  } else {
    console.log('🔒🐢 boxSnapGuide waitingAnimationFrame ready')
    state.snapStatus = 'ready'
    window.requestAnimationFrame(waitingAnimationFrame)
  }
  // cancel
  if (shouldCancelWaiting) {
    cancelWaitingAnimationFrame()
  }
}
</script>

<template lang="pug">
.box-snap-guide.right(v-if="snapGuideSide === 'right'" :style="snapGuideStyles" :class="state.snapStatus")
.box-snap-guide.left(v-if="snapGuideSide === 'left'" :style="snapGuideStyles" :class="state.snapStatus")
.box-snap-guide.top(v-if="snapGuideSide === 'top'" :style="snapGuideStyles" :class="state.snapStatus")
.box-snap-guide.bottom(v-if="snapGuideSide === 'bottom'" :style="snapGuideStyles" :class="state.snapStatus")
</template>

<style lang="stylus">
.box-snap-guide
  --snap-guide-width 6px
  --snap-guide-waiting-duration 0.6s // same as consts.boxSnapGuideWaitingDuration ms
  --snap-guide-ready-duration 0.4s
  position absolute
  &.left
    left calc(-1 * var(--snap-guide-width))
    width var(--snap-guide-width)
    border-top-left-radius var(--entity-radius)
    border-bottom-left-radius var(--entity-radius)
    &.waiting
      animation guideLeftWaiting var(--snap-guide-waiting-duration) 1 ease-in-out forwards
    &.ready
      animation guideLeftReady var(--snap-guide-ready-duration) infinite ease-in-out forwards
  &.right
    right calc(-1 * var(--snap-guide-width))
    width var(--snap-guide-width)
    border-top-right-radius var(--entity-radius)
    border-bottom-right-radius var(--entity-radius)
    &.waiting
      animation guideRightWaiting var(--snap-guide-waiting-duration) 1 ease-in-out forwards
    &.ready
      animation guideRightReady var(--snap-guide-ready-duration) infinite ease-in-out forwards
  &.top
    top calc(-1 * var(--snap-guide-width))
    height var(--snap-guide-width)
    border-top-left-radius var(--entity-radius)
    border-top-right-radius var(--entity-radius)
    &.waiting
      animation guideTopWaiting var(--snap-guide-waiting-duration) 1 ease-in-out forwards
    &.ready
      animation guideTopReady var(--snap-guide-ready-duration) infinite ease-in-out forwards
  &.bottom
    bottom calc(-1 * var(--snap-guide-width))
    height var(--snap-guide-width)
    border-bottom-left-radius var(--entity-radius)
    border-bottom-right-radius var(--entity-radius)
    &.waiting
      animation guideBottomWaiting var(--snap-guide-waiting-duration) 1 ease-in-out forwards
    &.ready
      animation guideBottomReady var(--snap-guide-ready-duration) infinite ease-in-out forwards

// waiting animations

@keyframes guideRightWaiting
  0%
    opacity 0
  100%
    transform translateX(2px)
    opacity 0.75
@keyframes guideLeftWaiting
  0%
    opacity 0
  100%
    transform translateX(-2px)
    opacity 0.75
@keyframes guideTopWaiting
  0%
    opacity 0
  100%
    transform translateY(-2px)
    opacity 0.75
@keyframes guideBottomWaiting
  0%
    opacity 0
  100%
    transform translateY(2px)
    opacity 0.75

// ready animations

@keyframes guideRightReady
  50%
    transform translateX(2px)
@keyframes guideLeftReady
  50%
    transform translateX(-2px)
@keyframes guideTopReady
  50%
    transform translateY(-2px)
@keyframes guideBottomReady
  50%
    transform translateY(2px)
</style>
