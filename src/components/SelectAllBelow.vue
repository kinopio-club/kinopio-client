<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, useTemplateRef, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'

const store = useStore()

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})

const state = reactive({
  isVisible: false,
  positionY: 250
})

const userColor = computed(() => store.state.currentUser.color)
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const isSelectingY = computed(() => store.state.isSelectingY)
const updateIsSelectingY = (value) => {
  if (store.state.isSelectingX) {
    value = false
  }
  store.commit('isSelectingY', value)
}
const isVisible = computed(() => {
  if (store.state.isSelectingX) { return }
  if (store.state.currentUserIsPanning || store.state.currentUserIsPanningReady) { return }
  return state.isVisible
})

// position

const handleMouseMove = (event) => {
  if (!event.target.closest) { return }
  if (!canEditSpace.value) { return }
  if (store.state.currentUserIsPainting) { return }
  if (store.state.currentUserIsDraggingCard) { return }
  if (store.state.currentUserIsDraggingBox) { return }
  if (store.state.isEmbedMode) { return }
  const edgeThreshold = 30
  let header = document.querySelector('header').getBoundingClientRect().height
  let footer = document.querySelector('.footer-wrap footer')
  if (footer) {
    footer = footer.getBoundingClientRect().height + 20
  } else {
    footer = 0
  }
  const position = utils.cursorPositionInViewport(event)
  const viewport = utils.visualViewport()
  const isInThreshold = position.x <= edgeThreshold
  const isBetweenControls = utils.isBetween({
    value: position.y,
    min: header,
    max: viewport.height - footer
  })
  const isInPosition = isInThreshold && isBetweenControls
  const isCancelledByHover = Boolean(event.target.closest('button') || event.target.closest('article'))
  const shouldShow = isInPosition && !isCancelledByHover
  if (shouldShow || isSelectingY.value) {
    state.positionY = position.y
    state.isVisible = true
  } else {
    state.isVisible = false
  }
  if (isSelectingY.value) {
    debouncedSelectAllBelow(event)
  }
}

// select

const handleMouseDown = (event) => {
  updateIsSelectingY(true)
  debouncedSelectAllBelow(event)
}
const handleMouseUp = (event) => {
  if (!isSelectingY.value) { return }
  updateIsSelectingY(false)
  debouncedSelectAllBelow(event)
  state.isVisible = false
  setTimeout(() => {
    store.commit('preventMultipleSelectedActionsIsVisible', false)
  }, 100)
}
const debouncedSelectAllBelow = debounce((event) => {
  selectAllBelow(event)
}, 10, { leading: true })

const selectAllBelow = (event) => {
  let position = utils.cursorPositionInSpace(event)
  store.commit('preventMultipleSelectedActionsIsVisible', true)
  store.commit('triggerSelectAllItemsBelowCursor', position)
}
</script>

<template lang="pug">
.select-all-below(v-if="isVisible" :style="{ top: state.positionY + 'px' }")
  .badge.label-badge(:style="{ 'background-color': userColor }" @mousedown="handleMouseDown")
    img.icon(src="@/assets/brush-y.svg")
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
