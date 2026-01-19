<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

let waitingAnimationTimer, shouldCancelWaiting, waitingStartTime

onMounted(() => {
  updateRect()

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'clearDraggingItems') {
        cancelWaitingAnimationFrame()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const props = defineProps({
  box: Object,
  card: Object,
  list: Object
})

const state = reactive({
  rect: null,
  snapStatus: null // waiting, ready
})
watch(() => state.snapStatus, (value, prevValue) => {
  if (value === 'ready') {
    globalStore.itemSnappingIsReady = true
  } else {
    globalStore.itemSnappingIsReady = false
  }
})

const item = computed(() => props.box || props.card || props.list)

// is snapping

const currentSnapGuide = computed(() => {
  let guides
  // dragging box
  if (props.box) {
    if (cardStore.cardSnapGuides.length) { return }
    const isMultipleBoxesSelectedIds = globalStore.multipleBoxesSelectedIds.length > 1
    if (isMultipleBoxesSelectedIds) { return }
    guides = boxStore.boxSnapGuides
  // dragging card
  } else if (props.card) {
    guides = cardStore.cardSnapGuides
  }
  // ?? else if (props.list) remove all list mentions if/bc lists are only targets, not dragged items
  return guides.find(guide => {
    const isTargetItem = guide.target.id === item.value.id
    return isTargetItem
  })
})
watch(() => currentSnapGuide.value, (value, prevValue) => {
  if (!value) {
    state.snapStatus = null
  }
})

// styles

const snapGuideSide = computed(() => {
  const isDraggingItem = globalStore.currentUserIsDraggingBox || globalStore.currentUserIsDraggingCard
  if (!isDraggingItem) { return }
  const snapGuide = currentSnapGuide.value
  if (!snapGuide) { return null }
  if (snapGuide?.target.id === item.value.id) {
    return snapGuide.side
  } else if (snapGuide?.origin.id === item.value.id) {
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
  if (props.card) {
    state.rect = utils.cardElementDimensions(props.card)
  } else if (props.box) {
    state.rect = utils.boxElementDimensions(props.box)
  } else if (props.list) {
    state.rect = utils.listElementDimensions(props.list)
  }
}
const snapGuideStyles = computed(() => {
  const offset = 4
  const styles = {}
  const rect = state.rect
  styles.background = item.value.color || item.value.backgroundColor || userStore.color
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
const snapGuideClasses = computed(() => {
  const value = [state.snapStatus]
  if (props.box) {
    value.push('is-box')
  } else if (props.card) {
    value.push('is-card')
  } else if (props.list) {
    value.push('is-list')
  }
  return value
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
  const snapGuide = currentSnapGuide.value
  if (!snapGuide) {
    cancelWaitingAnimationFrame()
    return
  }
  const elaspedTime = timestamp - waitingStartTime
  const percentComplete = (elaspedTime / consts.itemSnapGuideWaitingDuration) // between 0 and 1
  updateRect()
  // waiting
  if (percentComplete < 1) {
    state.snapStatus = 'waiting'
    window.requestAnimationFrame(waitingAnimationFrame)
  // complete
  } else {
    console.info('🔒🐢 itemSnapGuide waitingAnimationFrame ready')
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
.item-snap-guide.right(v-if="snapGuideSide === 'right'" :style="snapGuideStyles" :class="snapGuideClasses")
.item-snap-guide.left(v-if="snapGuideSide === 'left'" :style="snapGuideStyles" :class="snapGuideClasses")
.item-snap-guide.top(v-if="snapGuideSide === 'top'" :style="snapGuideStyles" :class="snapGuideClasses")
.item-snap-guide.bottom(v-if="snapGuideSide === 'bottom'" :style="snapGuideStyles" :class="snapGuideClasses")
</template>

<style lang="stylus">
.item-snap-guide
  --snap-guide-waiting-duration 0.1s // same as consts.itemSnapGuideWaitingDuration ms
  &.is-card
    --snap-guide-width 10px
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
