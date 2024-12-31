<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'

const store = useStore()

const props = defineProps({
  card: Object
})

const state = reactive({
  snapStatus: 'ready'
})

const currentCardIsSelected = computed(() => {
  const selected = store.state.multipleCardsSelectedIds
  return selected.find(id => props.card.id === id)
})
const currentCardIsBeingDragged = computed(() => {
  const isDragging = store.state.currentUserIsDraggingCard
  const isCurrent = store.state.currentDraggingCardId === props.card.id
  return isDragging && (isCurrent || currentCardIsSelected.value)
})
const otherCards = computed(() => {
  const cards = store.getters['currentCards/isSelectableInViewport']
  return cards.filter(card => card?.id !== props.card.id)
})

// styles

const userColor = computed(() => store.state.currentUser.color)
const currentCardSnapGuide = computed(() => {
  const isMultipleCardsSelectedIds = store.state.multipleCardsSelectedIds.length > 1
  if (isMultipleCardsSelectedIds) { return }
  let snapGuide = store.state.currentCards.snapGuide
  if (!snapGuide) { return }
  console.log('🍊', snapGuide.side)
  const isTarget = snapGuide.target.id === props.card.id
  const isOrigin = snapGuide.origin.id === props.card.id
  if (isTarget || isOrigin) {
    return snapGuide
  } else {
    return null
  }
})
const snapGuideSide = computed(() => {
  const isDraggingItem = store.state.currentUserIsDraggingCard
  if (!isDraggingItem) { return }
  const snapGuide = currentCardSnapGuide.value
  if (!snapGuide) { return null }
  console.log('🐔', snapGuide.side, snapGuide)

  if (snapGuide?.target?.id === props.card.id) {
    return snapGuide.side
  } else if (snapGuide?.origin?.id === props.card.id) {
    return oppositeSide(snapGuide.side)
  } else {
    return null
  }
})
const oppositeSide = (side) => {
  if (side === 'top') {
    return 'bottom'
  }
  if (side === 'bottom') {
    return 'top'
  }
}
const snapGuideStyles = computed(() => {
  let styles = {}
  // TODO color should be current list color, or new list color
  styles.background = 'red'
  return styles
})
</script>

<template lang="pug">
.card-snap-guide.top(v-if="snapGuideSide === 'top'" :style="snapGuideStyles" :class="state.snapStatus")
.card-snap-guide.bottom(v-if="snapGuideSide === 'bottom'" :style="snapGuideStyles" :class="state.snapStatus")
</template>

<style lang="stylus">
.card-snap-guide
  --snap-guide-width 6px
  --snap-guide-ready-duration 0.4s
  position absolute
  &.top
    top calc(-1 * var(--snap-guide-width))
    height var(--snap-guide-width)
    width 100%
    border-top-left-radius var(--entity-radius)
    border-top-right-radius var(--entity-radius)
    &.ready
      animation guideTopReady var(--snap-guide-ready-duration) infinite ease-in-out forwards
  &.bottom
    bottom calc(-1 * var(--snap-guide-width))
    height var(--snap-guide-width)
    width 100%
    border-bottom-left-radius var(--entity-radius)
    border-bottom-right-radius var(--entity-radius)
    &.ready
      animation guideBottomReady var(--snap-guide-ready-duration) infinite ease-in-out forwards
</style>
