<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import utils from '@/utils.js'
import postMessage from '@/postMessage.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const broadcastStore = useBroadcastStore()

const emit = defineEmits(['toggleItemChecked'])
const props = defineProps({
  visible: Boolean,
  canEditItem: Boolean,
  parentIsList: Boolean,
  card: Object,
  box: Object
})

const item = computed(() => props.card || props.box)
const isChecked = computed(() => utils.nameIsChecked(item.value.name))
const checkboxState = computed({
  get () {
    return isChecked.value
  }
})

// toggle item checkbox

const toggleItemChecked = (event) => {
  if (globalStore.currentUserIsDraggingConnectionIdLabel) { return }
  if (globalStore.preventDraggedCardFromShowingDetails) { return }
  if (globalStore.preventDraggedBoxFromShowingDetails) { return }
  if (!props.canEditItem) { return }
  const value = !isChecked.value
  if (!props.parentIsList) {
    globalStore.closeAllDialogs()
  }
  if (props.card) {
    cardStore.toggleCardChecked(props.card.id, value)
  } else if (props.box) {
    boxStore.toggleBoxChecked(props.box.id, value)
  }
  postMessage.sendHaptics({ name: 'heavyImpact' })
  emit('toggleItemChecked')
  globalStore.currentUserIsDraggingCard = false
  const userId = userStore.id
  broadcastStore.update({ updates: { userId }, action: 'clearRemoteCardsDragging' })
  broadcastStore.update({ updates: { userId }, action: 'clearRemoteBoxesDragging' })
  event.stopPropagation()
  globalStore.preventMultipleSelectedActionsIsVisible = false
  globalStore.clearMultipleSelected()
  globalStore.currentDraggingBoxId = ''
  globalStore.updateMultipleBoxesSelectedIds([])
}

// handle events

const handleMouseEnterCheckbox = () => {
  if (!props.card) { return }
  globalStore.currentUserIsHoveringOverCheckboxCardId = props.card.id
}
const handleMouseLeaveCheckbox = () => {
  globalStore.currentUserIsHoveringOverCheckboxCardId = ''
}

</script>

<template lang="pug">
.item-checkbox-button(
  v-if="props.visible"
  @mouseup.left="toggleItemChecked"
  @touchend.prevent="toggleItemChecked"
  @mouseenter="handleMouseEnterCheckbox"
  @mouseleave="handleMouseLeaveCheckbox"
  :class="{ 'is-box': props.box, 'parent-is-list': props.parentIsList }"
)
  label(:class="{active: isChecked, disabled: !props.canEditItem}")
    input(name="checkbox" type="checkbox" v-model="checkboxState")
</template>

<style lang="stylus">
.item-checkbox-button
  padding-top 8px
  padding-left 8px
  padding-bottom 8px
  display inline-block
  z-index 1
  &.is-box
    padding-left 8px
    padding-top 5px
    padding-bottom 6px
  &.parent-is-list
    padding-top 0
    padding-left 0
    padding-bottom 0
    padding-right 5px

  label
    pointer-events none
    width 20px
    height 16px
    display flex
    align-items center
    padding-left 4px
    padding-right 4px
    input
      margin 0
      margin-top -1px
      width 10px
      height 10px
      background-size contain
  &:hover
    label
      box-shadow 3px 3px 0 var(--heavy-shadow)
      background-color var(--secondary-hover-background)
      input
        background-color var(--secondary-hover-background)
    label.active
      box-shadow var(--active-inset-shadow)
      background-color var(--secondary-active-background)
      input
        background-color var(--secondary-active-background)
  &:active
    label
      box-shadow none
      color var(--primary)
      background-color var(--secondary-active-background)
    input
      background-color var(--secondary-active-background)
</style>
