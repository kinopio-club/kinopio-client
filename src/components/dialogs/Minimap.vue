<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useLineStore } from '@/stores/useLineStore'
import { useUserStore } from '@/stores/useUserStore'

import BoxList from '@/components/BoxList.vue'
import LineList from '@/components/LineList.vue'
import MinimapCanvas from '@/components/MinimapCanvas.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const boxStore = useBoxStore()
const lineStore = useLineStore()
const userStore = useUserStore()

const dialogElement = ref(null)
const rowElement = ref(null)
const detailsElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  updateDialogHeight()
  updateSize()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    updateSize()
    updateDetailsOpen()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeightFromHeader(element)
}
const updateSize = async () => {
  await nextTick()
  const element = rowElement.value
  if (!element) { return }
  const rect = element.getBoundingClientRect()
  state.size = rect.width
}
const updateDetailsOpen = async () => {
  await nextTick()
  const element = detailsElement.value
  element.open = userStore.shouldShowMinimapJumpToList
}
const toggleShouldShowMinimapJumpToList = () => {
  const element = detailsElement.value
  const value = element.open
  userStore.updateUser({ shouldShowMinimapJumpToList: value })
}
const placeholderIsVisible = computed(() => {
  return !lines.value.length && !boxes.value.length
})

// pin dialog

const dialogIsPinned = computed(() => globalStore.minimapIsPinned)
const toggleDialogIsPinned = () => {
  const isPinned = !dialogIsPinned.value
  globalStore.minimapIsPinned = isPinned
}

// lines

const lines = computed(() => {
  const items = lineStore.getAllLines
  return items
})
const focusLine = (line) => {
  globalStore.updateFocusOnLineId(line.id)
}

// boxes

const boxes = computed(() => {
  let items = boxStore.getAllBoxes
  items = utils.sortByDistanceFromOrigin(items)
  return items
})
const focusBox = (box) => {
  globalStore.updateFocusOnBoxId(box.id)
}

</script>

<template lang="pug">
dialog.narrow.minimap.is-pinnable(
  v-if="props.visible"
  :open="props.visible"
  @click.left.stop
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
  :data-is-pinned="dialogIsPinned"
  :class="{'is-pinned': dialogIsPinned}"
)
  section.minimap-section.title-section
    .row.title-row(ref="rowElement")
      span Minimap
      .button-wrap(@click.left.stop="toggleDialogIsPinned" title="Pin dialog")
        button.small-button(:class="{active: dialogIsPinned}")
          img.icon.pin.right-pin(src="@/assets/pin.svg")
  section
    .row
      MinimapCanvas(:visible="Boolean(state.size)" :size="state.size")
  section.boxes-section.results-section
    details(ref="detailsElement" @toggle="toggleShouldShowMinimapJumpToList")
      summary
        //- .row
        span Jump to
      section.subsection
        LineList(:lines="lines" @selectLine="focusLine")
        BoxList(:boxes="boxes" @selectBox="focusBox")
        .row(v-if="placeholderIsVisible")
          p
            img.icon.box-icon(src="@/assets/box.svg")
            span No lines or boxes in this space yet
</template>

<style lang="stylus">
dialog.minimap
  overflow auto
  right 8px
  bottom 28px
  top initial
  left initial
  &.is-pinned
    right 0
  .right-pin
    transform rotate(180deg)
  section.minimap-section
    user-select none
  section.boxes-section
    user-select none
  .icon.box-icon
    border-radius 0
  summary
    text-align left
  .line-list + .box-list
    margin-top 10px
</style>
