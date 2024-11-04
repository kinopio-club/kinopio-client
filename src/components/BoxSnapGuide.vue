<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

const props = defineProps({
  box: Object
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
const snapGuideStyles = computed(() => {
  let styles = {}
  let rect = utils.boxRectFromId(props.box.id)
  rect = utils.rectDimensions(rect)
  if (currentBoxIsBeingDragged.value) {
    styles.background = userColor.value
  } else {
    styles.background = props.box.color
  }
  // left
  if (snapGuideSide.value === 'left') {
    styles.height = rect.height + 'px'
    styles.left = rect.x + 'px'
    styles.top = rect.y + 'px'
  // right
  } else if (snapGuideSide.value === 'right') {
    styles.height = rect.height + 'px'
    styles.left = rect.x + rect.width + 'px'
    styles.top = rect.y + 'px'
  // top
  } else if (snapGuideSide.value === 'top') {
    styles.width = rect.width + 'px'
    styles.left = rect.x + 'px'
    styles.top = rect.y + 'px'
  // bottom
  } else if (snapGuideSide.value === 'bottom') {
    styles.width = rect.width + 'px'
    styles.left = rect.x + 'px'
    styles.top = rect.y + rect.height + 'px'
  }
  return styles
})
const snapGuideSide = computed(() => {
  const isDraggingItem = store.state.currentUserIsDraggingBox || store.state.currentUserIsDraggingCard
  if (!isDraggingItem) { return null }
  let guides = store.state.currentBoxes.snapGuides
  const snapGuide = guides.find(guide => {
    const isTarget = guide.target.id === props.box.id
    const isOrigin = guide.origin.id === props.box.id
    return isTarget || isOrigin
  })
  if (!snapGuide) { return null }
  if (snapGuide.target.id === props.box.id) {
    return snapGuide.side
  } else if (snapGuide.origin.id === props.box.id) {
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
</script>

<template lang="pug">
.box-snap-guide.right(v-if="snapGuideSide === 'right'" :style="snapGuideStyles")
.box-snap-guide.left(v-if="snapGuideSide === 'left'" :style="snapGuideStyles")
.box-snap-guide.top(v-if="snapGuideSide === 'top'" :style="snapGuideStyles")
.box-snap-guide.bottom(v-if="snapGuideSide === 'bottom'" :style="snapGuideStyles")
</template>

<style lang="stylus">
.box-snap-guide
  --snap-guide-width 6px
  --snap-guide-duration 1s
  position absolute
  &.left
    left calc(-1 * var(--snap-guide-width))
    width var(--snap-guide-width)
    // top -2px
    // height calc(100% + 4px)
    animation guideLeft var(--snap-guide-duration) infinite ease-in-out forwards
    border-top-left-radius var(--entity-radius)
    border-bottom-left-radius var(--entity-radius)
  &.right
    right calc(-1 * var(--snap-guide-width))
    width var(--snap-guide-width)
    // top -2px
    // height calc(100% + 4px)
    animation guideRight var(--snap-guide-duration) infinite ease-in-out forwards
    border-top-right-radius var(--entity-radius)
    border-bottom-right-radius var(--entity-radius)
  &.top
    top calc(-1 * var(--snap-guide-width))
    height var(--snap-guide-width)
    // left -2px
    // width calc(100% + 4px)
    animation guideTop var(--snap-guide-duration) infinite ease-in-out forwards
    border-top-left-radius var(--entity-radius)
    border-top-right-radius var(--entity-radius)
  &.bottom
    bottom calc(-1 * var(--snap-guide-width))
    height var(--snap-guide-width)
    // left -2px
    // width calc(100% + 4px)
    animation guideBottom var(--snap-guide-duration) infinite ease-in-out forwards
    border-bottom-left-radius var(--entity-radius)
    border-bottom-right-radius var(--entity-radius)

@keyframes guideRight
  50%
    transform translateX(2px)
@keyframes guideLeft
  50%
    transform translateX(-2px)
@keyframes guideTop
  50%
    transform translateY(-2px)
@keyframes guideBottom
  50%
    transform translateY(2px)
</style>
