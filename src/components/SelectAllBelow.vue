<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useLineStore } from '@/stores/useLineStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useCardStore } from '@/stores/useCardStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const lineStore = useLineStore()
const boxStore = useBoxStore()
const cardStore = useCardStore()

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
  positionY: 250,
  isMetaKey: false
})

const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const isSelectingY = computed(() => globalStore.isSelectingY)
const updateIsSelectingY = (value) => {
  if (globalStore.isSelectingX) {
    value = false
  }
  globalStore.isSelectingY = value
}
const isVisible = computed(() => {
  if (globalStore.getToolbarIsDrawing) { return }
  if (globalStore.isSelectingX) { return }
  if (globalStore.currentUserIsPanning || globalStore.currentUserIsPanningReady) { return }
  if (globalStore.lineDetailsIsVisibleForLineId) { return }
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

const isNearLine = (position) => {
  const lines = lineStore.getAllLines
  const line = lines.find(line => {
    return utils.isBetween({
      value: position.y,
      min: line.y - 12,
      max: line.y + 12
    })
  })
  if (line) {
    state.isVisible = false
    return true
  }
}
const isNearBoxInfo = (position) => {
  const boxes = boxStore.getBoxesNearLeftEdge
  const box = boxes.find(box => {
    const rect = utils.boxInfoPositionFromId(box.id)
    if (!rect) { return }
    return utils.isBetween({
      value: position.y,
      min: box.y,
      max: box.y + rect.infoHeight
    })
  })
  if (box) {
    state.isVisible = false
    return true
  }
}
const isNearCard = (position) => {
  const cards = cardStore.getCardsNearLeftEdge
  const card = cards.find(card => {
    return utils.isBetween({
      value: position.y,
      min: card.y,
      max: card.y + card.height
    })
  })
  if (card) {
    state.isVisible = false
    return true
  }
}
const handleMouseMove = (event) => {
  if (!event.target.closest) { return }
  if (!canEditSpace.value) { return }
  if (globalStore.currentUserIsPaintSelecting) { return }
  if (globalStore.currentUserIsDraggingCard) { return }
  if (globalStore.currentUserIsDraggingBox) { return }
  if (globalStore.isEmbedMode) { return }
  updateIsMetaKey(event)
  const position = utils.cursorPositionInViewport(event)
  const pagePosition = utils.cursorPositionInSpace(event)
  const isInThreshold = position.x <= consts.edgeThreshold
  if (!isInThreshold) {
    state.isVisible = false
    return
  }
  // check if over items
  if (isNearLine(pagePosition)) { return }
  if (isNearBoxInfo(pagePosition)) { return }
  if (isNearCard(pagePosition)) { return }
  // TODO (isNearList)
  // check if between controls
  const toolbar = document.querySelector('#toolbar')?.getBoundingClientRect()
  if (!toolbar) { return }
  let footer = document.querySelector('.footer-wrap footer')
  if (footer) {
    footer = footer.getBoundingClientRect().height + 20
  } else {
    footer = 0
  }
  const viewport = utils.visualViewport()
  const isBetweenControls = utils.isBetween({
    value: position.y,
    min: toolbar.y + toolbar.height,
    max: viewport.height - footer
  })
  const isInPosition = isInThreshold && isBetweenControls
  const isCancelledByHover = Boolean(event.target.closest('button') || event.target.closest('.card-wrap'))
  const shouldShow = isInPosition && !isCancelledByHover
  if (shouldShow || isSelectingY.value) {
    state.positionY = position.y
    state.isVisible = true
  } else {
    state.isVisible = false
  }
  if (isSelectingY.value) {
    selectItems(event)
  }
}

// select

const handleMouseDown = (event) => {
  updateIsSelectingY(true)
  selectItems(event)
  updateIsMetaKey(event)
}
const handleMouseUp = (event) => {
  if (!isSelectingY.value) { return }
  updateIsSelectingY(false)
  selectItems(event)
  updateIsMetaKey(event)
  state.isVisible = false
}

const selectItems = (event) => {
  const position = utils.cursorPositionInSpace(event)
  globalStore.preventMultipleSelectedActionsIsVisible = true
  if (state.isMetaKey) {
    globalStore.triggerSelectAllItemsAboveCursor(position)
  } else {
    globalStore.triggerSelectAllItemsBelowCursor(position)
  }
}
</script>

<template lang="pug">
.select-all-below(v-if="isVisible" :style="{ top: state.positionY + 'px' }")
  .badge.label-badge(:style="{ 'background-color': userColor }" @mousedown="handleMouseDown")
    img.icon(src="@/assets/brush-y.svg" :class="iconClasses")
    .pointer(:style="{ 'background-color': userColor }" :class="{ 'is-selecting': isSelectingY }")
</template>

<style lang="stylus">
.select-all-below
  position fixed
  left 0
  top 250px
  pointer-events all
  cursor pointer
  .badge
    border-radius 0
    border-top-right-radius 6px
    border-bottom-right-radius 6px
    padding 0
    margin 0
    position relative
    box-shadow 0
    margin-bottom 8px
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
      transform scaleY(-1)

  .pointer
    position absolute
    background-color var(--primary)
    height 1px
    width 12px
    left 30px
    top 10px
    &.is-selecting
      width 100vw
</style>
