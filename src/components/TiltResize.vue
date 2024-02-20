<script setup>
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  visible: Boolean,
  card: Object
})
// const emit = defineEmits(['updateCount'])

const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const isPresentationMode = computed(() => store.state.isPresentationMode)

const startResizing = (event) => {
  if (!canEditSpace.value) { return }
  if (utils.isMultiTouch(event)) { return }
  store.dispatch('history/pause')
  store.dispatch('closeAllDialogs')
  store.commit('preventDraggedCardFromShowingDetails', true)
  store.dispatch('currentCards/incrementZ', props.card.id)
  store.commit('currentUserIsResizingCard', true)
  let cardIds = [props.card.id]
  const multipleCardsSelectedIds = store.state.multipleCardsSelectedIds
  if (multipleCardsSelectedIds.length) {
    cardIds = multipleCardsSelectedIds
  }
  store.commit('currentUserIsResizingCardIds', cardIds)
  const updates = {
    userId: store.state.currentUser.id,
    cardIds: cardIds
  }
  store.commit('broadcast/updateStore', { updates, type: 'updateRemoteUserResizingCards' })
}

const removeResize = () => {
  let cardIds = [props.card.id]
  const multipleCardsSelectedIds = store.state.multipleCardsSelectedIds
  if (multipleCardsSelectedIds.length) {
    cardIds = multipleCardsSelectedIds
  }
  store.dispatch('currentCards/removeResize', { cardIds })
}

</script>

<template lang="pug">
//- resize
.bottom-button-wrap(v-if="visible")
  .inline-button-wrap(
    @mousedown.left.stop="startResizing"
    @touchstart.stop="startResizing"
    @dblclick="removeResize"
    title="Drag to Resize"
  )
    button.inline-button(tabindex="-1" :class="{hidden: isPresentationMode}")
      img.resize-icon.icon(src="@/assets/resize-corner.svg")
//- tilt
.left-bottom-button-wrap.bottom-button-wrap(v-if="visible")
  .inline-button-wrap(
    title="Drag to Tilt"
  )
    button.inline-button
      img.resize-icon.icon(src="@/assets/resize-corner.svg")
  //- @updatePlayhead="updateOpacity"
  //- @resetPlayhead="resetOpacity"
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
