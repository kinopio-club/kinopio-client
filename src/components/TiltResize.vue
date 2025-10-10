<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const broadcastStore = useBroadcastStore()

const props = defineProps({
  visible: Boolean,
  card: Object
})

const isPresentationMode = computed(() => globalStore.isPresentationMode)

// both

const start = (event, action) => {
  if (utils.isMultiTouch(event)) { return }
  globalStore.closeAllDialogs()
  globalStore.preventDraggedCardFromShowingDetails = true
  cardStore.incrementCardZ(props.card.id)
  let cardIds = [props.card.id]
  const multipleCardsSelectedIds = globalStore.multipleCardsSelectedIds
  if (multipleCardsSelectedIds.includes(props.card.id)) {
    cardIds = multipleCardsSelectedIds
  } else {
    globalStore.clearMultipleSelected()
  }
  const updates = {
    userId: userStore.id,
    cardIds
  }
  if (action === 'resize') {
    globalStore.currentUserIsResizingCard = true
    globalStore.currentUserIsResizingCardIds = cardIds
    broadcastStore.update({ updates, action: 'updateRemoteUserResizingCards' })
  } else if (action === 'tilt') {
    globalStore.currentUserIsTiltingCard = true
    globalStore.currentUserIsTiltingCardIds = cardIds
    broadcastStore.update({ updates, action: 'updateRemoteUserTiltingCards' })
  }
}
const remove = (action) => {
  let cardIds = [props.card.id]
  if (globalStore.multipleCardsSelectedIds.length) {
    cardIds = globalStore.multipleCardsSelectedIds
  }
  if (action === 'resize') {
    const shouldRemoveResizeWidth = true
    cardStore.clearResizeCards(cardIds, shouldRemoveResizeWidth)
  } else if (action === 'tilt') {
    cardStore.clearTiltCards(cardIds)
  }
}
const colorClass = computed(() => {
  if (!props.card.backgroundColor) { return }
  const colorClass = utils.colorClasses({ backgroundColor: props.card.backgroundColor })
  return [colorClass]
})

// tilt

const tiltIsVisible = computed(() => {
  if (utils.isMobile()) { return }
  const minCardWidth = consts.defaultCardWidth
  const cardIsWideEnough = props.card.width >= minCardWidth
  return props.visible && cardIsWideEnough
})
const isTilting = computed(() => {
  const cardIds = globalStore.currentUserIsTiltingCardIds
  if (!cardIds.length) { return }
  return cardIds.includes(props.card.id)
})

// resize

const isComment = computed(() => cardStore.getIsCommentCard(props.card))
const resizeIsVisible = computed(() => {
  return props.visible && !isComment.value
})
const isResizing = computed(() => {
  const cardIds = globalStore.currentUserIsResizingCardIds
  if (!cardIds.length) { return }
  return cardIds.includes(props.card.id)
})
</script>

<template lang="pug">
//- resize
.right-resize.bottom-button-wrap(v-if="resizeIsVisible")
  .inline-button-wrap(
    @mousedown.left.stop="start($event, 'resize')"
    @touchstart.stop="start($event, 'resize')"
    @dblclick="remove('resize')"
    title="Drag to Resize"
  )
    button.inline-button(tabindex="-1" :class="{hidden: isPresentationMode, active: isResizing}")
      img.icon(src="@/assets/resize-corner.svg" :class="colorClass")
//- tilt
.left-tilt.bottom-button-wrap(v-if="tiltIsVisible")
  .inline-button-wrap(
    @mousedown.left.stop="start($event, 'tilt')"
    @touchstart.stop="start($event, 'tilt')"
    @dblclick="remove('tilt')"
    title="Drag to Tilt"
  )
    button.inline-button(tabindex="-1" :class="{hidden: isPresentationMode, active: isTilting}")
      img.icon(src="@/assets/resize-corner.svg" :class="colorClass")
</template>

<style lang="stylus">
.bottom-button-wrap
  pointer-events all
  position absolute
  right -5px
  bottom 2px
  display flex
  .inline-button-wrap
    // background teal
    padding-top 0
    padding-bottom 0
    z-index 1
    cursor ew-resize
    button
      cursor ew-resize
      box-shadow none
    &:hover
      button
        box-shadow none
        background var(--light-shadow) !important
    &.active,
    &:active
      button
        box-shadow none
        background var(--heavy-shadow) !important
  .icon
    -webkit-user-drag none
    user-drag none
    position absolute
    left 0
    top 0

  // tilt
  &.left-tilt
    right initial
    left -5px
    .inline-button-wrap
      padding-right 0
      transform translate(-8px, 13px)
      cursor nwse-resize
      button
        cursor nwse-resize
        transform scaleX(-1)
  // resize
  &.right-resize
    .inline-button-wrap
      padding-left 0
</style>
