<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useLineStore } from '@/stores/useLineStore'

import DrawingToolbar from '@/components/DrawingToolbar.vue'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const lineStore = useLineStore()

const props = defineProps({
  visible: Boolean
})

const shouldIncreaseUIContrast = computed(() => userStore.shouldIncreaseUIContrast)

const currentUserToolbar = computed(() => globalStore.currentUserToolbar)
watch(() => currentUserToolbar.value, (value, prevValue) => {
  if (value) {
    globalStore.closeAllDialogs()
    globalStore.clearMultipleSelected()
  }
})

const toolbarIsBox = computed(() => {
  if (globalStore.currentUserIsResizingBox) { return }
  return globalStore.getToolbarIsBox
})
const toolbarIsList = computed(() => {
  if (globalStore.currentUserIsResizingList) { return }
  return globalStore.getToolbarIsList
})
const toolbarIsDrawing = computed(() => {
  return globalStore.getToolbarIsDrawing
})
const toggleToolbar = (value) => {
  if (value === currentUserToolbar.value) {
    globalStore.updateCurrentUserToolbar('card')
  } else {
    globalStore.updateCurrentUserToolbar(value)
  }
}
const addLine = () => {
  globalStore.updateCurrentUserToolbar('card')
  lineStore.createLine()
}
const DrawingLabel = computed(() => {
  if (globalStore.drawingEraserIsActive) {
    return 'Eraser (E)'
  } else {
    return 'Drawing (D)'
  }
})
</script>

<template lang="pug">
nav#toolbar.toolbar(v-if="visible")
  DrawingToolbar(:visible="toolbarIsDrawing")
  .toolbar-items
    .segmented-buttons-vertical
      //- Line
      .button-wrap
        button(
          @click="addLine"
          title="Add Line Divider (-)"
          :class="{ 'translucent-button': !shouldIncreaseUIContrast }"
        )
          img.icon.line-icon(src="@/assets/line.svg")

      .segmented-buttons-horizontal
        //- List
        .button-wrap
          button(
            title="Draw List (L)"
            :class="{ active: toolbarIsList, 'translucent-button': !shouldIncreaseUIContrast }"
            @click="toggleToolbar('list')"
          )
            img.icon.list-icon(src="@/assets/list.svg")
          .label-badge.toolbar-badge-wrap.jiggle.label-badge-box(v-if="toolbarIsList")
            span Draw List (L)
        //- Box
        .button-wrap
          button(
            title="Draw Box (B)"
            :class="{ active: toolbarIsBox, 'translucent-button': !shouldIncreaseUIContrast }"
            @click="toggleToolbar('box')"
          )
            img.icon.box-icon(src="@/assets/box.svg")
          .label-badge.toolbar-badge-wrap.jiggle.label-badge-box(v-if="toolbarIsBox")
            span Draw Box (B)

      //- Drawing
      .button-wrap
        button.drawing-button(
          title="Drawing (D)"
          :class="{ active: toolbarIsDrawing, 'translucent-button': !shouldIncreaseUIContrast }"
          @click="toggleToolbar('drawing')"
        )
          img.icon.pencil-icon(src="@/assets/pencil.svg")
        .label-badge.toolbar-badge-wrap.jiggle(v-if="toolbarIsDrawing")
          span {{DrawingLabel}}
</template>

<style lang="stylus">
nav.toolbar
  position absolute
  top 54px
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
    .segmented-buttons-horizontal
      > .button-wrap
        margin 0
        > button
          width 30px
          z-index -1
          padding 5px 8px
          margin-top -1px
          margin-bottom -1px
      > .button-wrap
        &:first-child
          > button
            border-radius 0
        &:last-child
          > button
            border-top-left-radius 0
            border-bottom-left-radius 0
            margin-left -1px

    .segmented-buttons-vertical
      display flex
      flex-flow column
      > .button-wrap
        > button
          border-radius 0
          width 30px
          z-index -1
          padding 5px 8px
        &:first-child
          > button
            border-radius 0
            border-top-left-radius var(--entity-radius)
            border-top-right-radius var(--entity-radius)
        &:last-child
          > button
            border-radius 0
            border-bottom-left-radius var(--entity-radius)
            border-bottom-right-radius var(--entity-radius)
        > .button-wrap + .button-wrap
          margin 0
          margin-top -1px
      .icon.line-icon
        vertical-align -2px
</style>
