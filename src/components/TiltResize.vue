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
  const multipleCardsSelectedIds = store.state.multipleCardsSelectedIds
  if (multipleCardsSelectedIds.length) {
    cardIds = multipleCardsSelectedIds
  }
  if (action === 'resize') {
    store.dispatch('currentCards/removeResize', { cardIds })
  } else if (action === 'tilt') {
    store.dispatch('currentCards/removeTilt', { cardIds })
  }
}

</script>

<template lang="pug">
//- resize
.bottom-button-wrap(v-if="visible")
  .inline-button-wrap(
    @mousedown.left.stop="start($event, 'resize')"
    @touchstart.stop="start($event, 'resize')"
    @dblclick="remove('resize')"
    title="Drag to Resize"
  )
    button.inline-button(tabindex="-1" :class="{hidden: isPresentationMode}")
      img.resize-icon.icon(src="@/assets/resize-corner.svg")
//- tilt
.left-bottom-button-wrap.bottom-button-wrap(v-if="visible")
  .inline-button-wrap(
    @mousedown.left.stop="start($event, 'tilt')"
    @touchstart.stop="start($event, 'tilt')"
    @dblclick="remove('tilt')"
    title="Drag to Tilt"
  )
    button.inline-button
      img.resize-icon.icon(src="@/assets/resize-corner.svg")
</template>

<style lang="stylus">
.bottom-button-wrap
  position absolute
  right 0px
  bottom 0px
  display flex
  .inline-button-wrap
    z-index 1
    cursor ew-resize
    button
      cursor ew-resize
  img
    -webkit-user-drag none

  // tilt
  &.left-bottom-button-wrap
    right initial
    left 0px
    bottom 0px
    .inline-button-wrap
      // background pink
      transform translate(-8px, 13px)
      cursor col-resize
      button
        cursor col-resize
        transform scaleX(-1)
    img
      -webkit-user-drag none
</style>
