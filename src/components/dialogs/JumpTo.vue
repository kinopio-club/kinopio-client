<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useLineStore } from '@/stores/useLineStore'
import { useListStore } from '@/stores/useListStore'
import { useUserStore } from '@/stores/useUserStore'

import ItemList from '@/components/ItemList.vue'
import MinimapCanvas from '@/components/MinimapCanvas.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const boxStore = useBoxStore()
const listStore = useListStore()
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
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeightFromHeader(element)
}
const updateSize = async () => {
  const maxHeight = 150
  await nextTick()
  const element = rowElement.value
  if (!element) { return }
  const rect = element.getBoundingClientRect()
  state.size = Math.min(rect.width, maxHeight)
}

// pin dialog

const dialogIsPinned = computed(() => globalStore.jumpToIsPinned)
const toggleDialogIsPinned = () => {
  const isPinned = !dialogIsPinned.value
  globalStore.jumpToIsPinned = isPinned
}

// items

const lines = computed(() => lineStore.getAllLines)
const boxes = computed(() => boxStore.getAllBoxes)
const lists = computed(() => listStore.getAllLists)
const focusItem = (item) => {
  if (item.itemType === 'box') {
    globalStore.updateFocusOnBoxId(item.id)
  }
  if (item.itemType === 'line') {
    globalStore.updateFocusOnLineId(item.id)
  }
  if (item.itemType === 'list') {
    globalStore.updateFocusOnListId(item.id)
  }
}
</script>

<template lang="pug">
dialog.narrow.jump-to.is-pinnable(
  v-if="props.visible"
  :open="props.visible"
  @click.left.stop
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
  :data-is-pinned="dialogIsPinned"
  :class="{'is-pinned': dialogIsPinned}"
)
  section.jump-to-section.title-section
    .row.title-row(ref="rowElement")
      span Jump To
      .button-wrap(@click.left.stop="toggleDialogIsPinned" title="Pin dialog")
        button.small-button(:class="{active: dialogIsPinned}")
          img.icon.pin.right-pin(src="@/assets/pin.svg")
  section
    .row
      MinimapCanvas(:visible="Boolean(state.size)" :size="state.size" :parentIsDialog="true")
  section.results-section
    ItemList(:lines="lines" :boxes="boxes" :lists="lists" @selectItem="focusItem")
</template>

<style lang="stylus">
dialog.jump-to
  overflow auto
  right 8px
  bottom 28px
  top initial
  left initial
  text-align left
  &.is-pinned
    right 0
  .right-pin
    transform rotate(180deg)
  section.jump-to-section
    user-select none
  section.results-section
    max-height 50dvh
</style>
