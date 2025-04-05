<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import DrawingToolbar from '@/components/DrawingToolbar.vue'
const store = useStore()

const props = defineProps({
  visible: Boolean
})

const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)

const currentUserToolbar = computed(() => store.state.currentUserToolbar)
watch(() => currentUserToolbar.value, (value, prevValue) => {
  if (value) {
    store.dispatch('closeAllDialogs')
    store.dispatch('clearMultipleSelected')
  }
})

const currentUserToolbarIsBox = computed(() => {
  if (store.state.currentUserIsResizingBox) { return }
  return currentUserToolbar.value === 'box'
})
const currentUserToolbarIsDrawing = computed(() => {
  return currentUserToolbar.value === 'drawing'
})

const toggleToolbar = (value) => {
  if (value === currentUserToolbar.value) {
    store.dispatch('currentUserToolbar', 'card')
  } else {
    store.dispatch('currentUserToolbar', value)
  }
}
</script>

<template lang="pug">
nav#toolbar.toolbar(v-if="visible")
  DrawingToolbar(:visible="currentUserToolbarIsDrawing")
  .toolbar-items
    //- Box
    .segmented-buttons
      .button-wrap
        button(
          title="Draw Box (B)"
          :class="{ active: currentUserToolbarIsBox, 'translucent-button': !shouldIncreaseUIContrast }"
          @click="toggleToolbar('box')"
        )
          img.icon.box-icon(src="@/assets/box.svg")
        .label-badge.toolbar-badge-wrap.jiggle.label-badge-box(v-if="currentUserToolbarIsBox")
          span Draw Box (B)

      //- Drawing
      .button-wrap
        button.drawing-button(
          title="Drawing (D)"
          :class="{ active: currentUserToolbarIsDrawing, 'translucent-button': !shouldIncreaseUIContrast }"
          @click="toggleToolbar('drawing')"
        )
          img.icon.pencil-icon(src="@/assets/pencil.svg")
        .label-badge.toolbar-badge-wrap.jiggle(v-if="currentUserToolbarIsDrawing")
          span Drawing (D)
</template>

<style lang="stylus">
nav.toolbar
  position absolute
  top 55px
  .toolbar-badge-wrap
    pointer-events none
    position absolute
    background-color var(--info-background)
    bottom -8px
    left 5px
    z-index 1
    width max-content
    span
      width 100%
      color var(--primary)
  .toolbar-items
    .segmented-buttons
      display flex
      flex-flow column
      > .button-wrap
        button
          border-radius 0
          width 32px
          z-index -1
        &:first-child
          button
            border-radius 0
            border-top-left-radius var(--entity-radius)
            border-top-right-radius var(--entity-radius)
        &:last-child
          button
            border-radius 0
            border-bottom-left-radius var(--entity-radius)
            border-bottom-right-radius var(--entity-radius)
      > .button-wrap + .button-wrap
        margin 0
        margin-top -1px
</style>
