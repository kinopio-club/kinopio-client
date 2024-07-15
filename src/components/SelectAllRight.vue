<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
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
  positionX: 250
})

const userColor = computed(() => store.state.currentUser.color)
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const isSelectingX = computed(() => store.state.isSelectingX)
const updateIsSelectingX = (value) => {
  if (store.state.isSelectingY) {
    value = false
  }
  store.commit('isSelectingX', value)
}
const isVisible = computed(() => {
  if (store.state.isSelectingY) { return }
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
  // let header = document.querySelector('header').getBoundingClientRect().height
  // let footer = document.querySelector('.footer-wrap footer')
  // if (footer) {
  //   footer = footer.getBoundingClientRect().height + 20
  // } else {
  //   footer = 0
  // }
  const position = utils.cursorPositionInViewport(event)
  const viewport = utils.visualViewport()
  const isInThreshold = position.y <= edgeThreshold
  // const isBetweenControls = utils.isBetween({
  //   value: position.x,
  //   min: header,
  //   max: viewport.height - footer
  // })
  const isInPosition = isInThreshold // && isBetweenControls
  const isCancelledByHover = Boolean(event.target.closest('button') || event.target.closest('article'))
  const shouldShow = isInPosition && !isCancelledByHover
  if (shouldShow || isSelectingX.value) {
    state.positionX = position.x - 10
    state.isVisible = true
  } else {
    state.isVisible = false
  }
  if (isSelectingX.value) {
    debouncedSelectAllRight(event)
  }
}

// select

const handleMouseDown = (event) => {
  updateIsSelectingX(true)
  debouncedSelectAllRight(event)
}
const handleMouseUp = (event) => {
  if (!isSelectingX.value) { return }
  updateIsSelectingX(false)
  debouncedSelectAllRight(event)
  state.isVisible = false
  setTimeout(() => {
    store.commit('preventMultipleSelectedActionsIsVisible', false)
  }, 100)
}
const debouncedSelectAllRight = debounce((event) => {
  selectAllRight(event)
}, 10, { leading: true })

const selectAllRight = (event) => {
  let position = utils.cursorPositionInSpace(event)
  store.commit('preventMultipleSelectedActionsIsVisible', true)
  // store.commit('triggerSelectAllItemsBelowCursor', position)
}
</script>

<template lang="pug">
.select-all-right(v-if="isVisible" :style="{ left: state.positionX + 'px' }")
  .badge.label-badge(:style="{ 'background-color': userColor }" @mousedown="handleMouseDown")
    img.icon(src="@/assets/brush-x.svg")
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
