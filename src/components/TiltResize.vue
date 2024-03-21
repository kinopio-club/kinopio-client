<script setup>
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  visible: Boolean,
  card: Object
})

const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const isPresentationMode = computed(() => store.state.isPresentationMode)

const start = (event, action) => {
  if (!canEditSpace.value) { return }
  if (utils.isMultiTouch(event)) { return }
  store.dispatch('history/pause')
  store.dispatch('closeAllDialogs')
  store.commit('preventDraggedCardFromShowingDetails', true)
  store.dispatch('currentCards/incrementZ', props.card.id)
  let cardIds = [props.card.id]
  const multipleCardsSelectedIds = store.state.multipleCardsSelectedIds
  if (multipleCardsSelectedIds.length) {
    cardIds = multipleCardsSelectedIds
  }
  const updates = {
    userId: store.state.currentUser.id,
    cardIds: cardIds
  }
  if (action === 'resize') {
    store.commit('currentUserIsResizingCard', true)
    store.commit('currentUserIsResizingCardIds', cardIds)
    store.commit('broadcast/updateStore', { updates, type: 'updateRemoteUserResizingCards' })
  } else if (action === 'tilt') {
    store.commit('currentUserIsTiltingCard', true)
    store.commit('currentUserIsTiltingCardIds', cardIds)
    store.commit('broadcast/updateStore', { updates, type: 'updateRemoteUserTiltingCards' })
  }
}

const remove = (action) => {
  let cardIds = [props.card.id]
  if (store.state.multipleCardsSelectedIds.length) {
    cardIds = store.state.multipleCardsSelectedIds
  }
  if (action === 'resize') {
    store.dispatch('currentCards/removeResize', { cardIds })
  } else if (action === 'tilt') {
    store.dispatch('currentCards/removeTilt', { cardIds })
  }
}

const isTilting = computed(() => {
  const cardIds = store.state.currentUserIsTiltingCardIds
  return cardIds.includes(props.card.id)
})
const isResizing = computed(() => {
  const cardIds = store.state.currentUserIsResizingCardIds
  return cardIds.includes(props.card.id)
})

</script>

<template lang="pug">
//- resize
.right-resize.bottom-button-wrap(v-if="visible")
  .inline-button-wrap(
    @mousedown.left.stop="start($event, 'resize')"
    @touchstart.stop="start($event, 'resize')"
    @dblclick="remove('resize')"
    title="Drag to Resize"
  )
    button.inline-button(tabindex="-1" :class="{hidden: isPresentationMode, active: isResizing}")
      img.icon(src="@/assets/resize-corner.svg")
//- tilt
.left-tilt.bottom-button-wrap(v-if="visible")
  .inline-button-wrap(
    @mousedown.left.stop="start($event, 'tilt')"
    @touchstart.stop="start($event, 'tilt')"
    @dblclick="remove('tilt')"
    title="Drag to Tilt"
  )
    button.inline-button(tabindex="-1" :class="{hidden: isPresentationMode, active: isTilting}")
      img.icon(src="@/assets/resize-corner.svg")
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
      cursor col-resize
      button
        cursor col-resize
        transform scaleX(-1)
  // resize
  &.right-resize
    .inline-button-wrap
      padding-left 0
</style>
