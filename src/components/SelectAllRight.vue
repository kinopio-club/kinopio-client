<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const xCenterOffset = 12

onMounted(() => {
  window.addEventListener('mousedown', updateIsMetaKey)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', updateIsMetaKey)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})

const state = reactive({
  isVisible: false,
  positionX: 250,
  isMetaKey: false
})

const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const isSelectingX = computed(() => globalStore.isSelectingX)
const updateIsSelectingX = (value) => {
  if (globalStore.isSelectingY) {
    value = false
  }
  globalStore.isSelectingX = value
}
const isVisible = computed(() => {
  if (globalStore.getToolbarIsDrawing) { return }
  if (globalStore.isSelectingY) { return }
  if (globalStore.currentUserIsPanning || globalStore.currentUserIsPanningReady) { return }
  return state.isVisible
})

// style

const userColor = computed(() => userStore.color)
const iconClasses = computed(() => {
  const classes = utils.colorClasses({ backgroundColor: userColor.value })
  if (state.isMetaKey) {
    classes.push('reverse')
  }
  return classes
})
const updateIsMetaKey = (event) => {
  state.isMetaKey = event.metaKey || event.ctrlKey
}

// position

const isBetweenControls = (event) => {
  const position = utils.cursorPositionInViewport(event)
  const viewportWidth = utils.visualViewport().width
  const leftElementWrap = document.querySelector('header nav .left')
  const rightElementWrap = document.querySelector('header nav .right')
  let leftSideWidth = 0
  let rightSideWidth = 0
  if (leftElementWrap && rightElementWrap) {
    leftSideWidth = leftElementWrap.getBoundingClientRect().width + xCenterOffset
    rightSideWidth = rightElementWrap.getBoundingClientRect().width
  }
  const isBetween = utils.isBetween({
    value: position.x,
    min: leftSideWidth,
    max: viewportWidth - rightSideWidth
  })
  return isBetween
}
const handleMouseMove = (event) => {
  if (!event.target.closest) { return }
  if (!canEditSpace.value) { return }
  if (globalStore.currentUserIsPaintSelecting) { return }
  if (globalStore.currentUserIsDraggingCard) { return }
  if (globalStore.currentUserIsDraggingBox) { return }
  if (globalStore.isEmbedMode) { return }
  updateIsMetaKey(event)
  const edgeThreshold = 30
  const position = utils.cursorPositionInViewport(event)
  const isInThreshold = position.y <= edgeThreshold
  const isInPosition = isInThreshold && isBetweenControls(event)
  const isCancelledByHover = Boolean(event.target.closest('button') || event.target.closest('.card-wrap'))
  const shouldShow = isInPosition && !isCancelledByHover
  if (shouldShow || isSelectingX.value) {
    state.positionX = position.x - xCenterOffset
    state.isVisible = true
  } else {
    state.isVisible = false
  }
  if (isSelectingX.value) {
    selectItems(event)
  }
}

// select

const handleMouseDown = (event) => {
  updateIsSelectingX(true)
  selectItems(event)
  updateIsMetaKey(event)
}
const handleMouseUp = (event) => {
  if (!isSelectingX.value) { return }
  updateIsSelectingX(false)
  selectItems(event)
  updateIsMetaKey(event)
  state.isVisible = false
}

const selectItems = (event) => {
  const position = utils.cursorPositionInSpace(event)
  globalStore.preventMultipleSelectedActionsIsVisible = true
  if (state.isMetaKey) {
    globalStore.triggerSelectAllItemsLeftOfCursor(position)
  } else {
    globalStore.triggerSelectAllItemsRightOfCursor(position)
  }
}
</script>

<template lang="pug">
.select-all-right(v-if="isVisible" :style="{ left: state.positionX + 'px' }")
  .badge.label-badge(:style="{ 'background-color': userColor }" @mousedown="handleMouseDown")
    img.icon(src="@/assets/brush-x.svg" :class="iconClasses")
    .pointer(:style="{ 'background-color': userColor }" :class="{ 'is-selecting': isSelectingX }")
</template>

<style lang="stylus">
.select-all-right
  position fixed
  left 250px
  top 8px
  pointer-events all
  cursor pointer
  .badge
    border-radius 0
    border-bottom-left-radius 6px
    border-bottom-right-radius 6px
    padding 0
    padding-left 1px
    margin 0
    position relative
    box-shadow 0
    // margin-bottom 8px
    width 20px
    height 32px
    &:hover
      box-shadow var(--button-hover-shadow)
    &:active
      box-shadow var(--button-active-inset-shadow)

  img
    padding 3px
    margin-left 6px
    margin-right 8px
    pointer-events none
    &.reverse
      transform scaleX(-1)

  .pointer
    position absolute
    background-color var(--primary)
    height 12px
    width 1px
    left 10px
    top 30px
    &.is-selecting
      height 100vh
</style>
