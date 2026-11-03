<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useLineStore } from '@/stores/useLineStore'
import { useListStore } from '@/stores/useListStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import ItemList from '@/components/ItemList.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const boxStore = useBoxStore()
const listStore = useListStore()
const lineStore = useLineStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)
const rowElement = ref(null)
const detailsElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  updateDialogHeight()
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
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeightFromHeader(element)
}

// pin dialog

const dialogIsPinned = computed(() => globalStore.tocIsPinned)
const toggleDialogIsPinned = () => {
  const isPinned = !dialogIsPinned.value
  globalStore.tocIsPinned = isPinned
}

// items

const lines = computed(() => lineStore.getAllLines)
const boxes = computed(() => boxStore.getAllBoxes)
const lists = computed(() => listStore.getAllLists)
const itemIds = computed(() => {
  const items = lines.value.concat(boxes.value, lists.value)
  return items.map(item => item.id)
})
const focusItem = (item) => {
  globalStore.updateFocusOnItemId(item.id)
}

// item visibility

const tocItemsHidden = computed(() => {
  let itemIdsHidden = spaceStore.tocItemsHidden
  itemIdsHidden = itemIdsHidden || []
  return itemIdsHidden
})
const itemsVisibleState = computed(() => {
  return itemIds.value.map(itemId => {
    const value = !tocItemsHidden.value.includes(itemId)
    return { itemId, value }
  })
})
const updateItemIsVisible = (item, value) => {
  const itemIdsHidden = tocItemsHidden.value.filter(itemId => itemId !== item.id)
  if (!value) {
    itemIdsHidden.push(item.id)
  }
  spaceStore.updateSpace({ tocItemsHidden: itemIdsHidden })
}
</script>

<template lang="pug">
dialog.narrow.toc.is-pinnable#toc(
  v-if="props.visible"
  :open="props.visible"
  @click.left.stop
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
  :data-is-pinned="dialogIsPinned"
  :class="{'is-pinned': dialogIsPinned}"
)
  section.toc-section.title-section
    .row.title-row(ref="rowElement")
      span TOC
      .button-wrap(@click.left.stop="toggleDialogIsPinned" title="Pin dialog")
        button.small-button(:class="{active: dialogIsPinned}")
          img.icon.pin.right-pin(src="@/assets/pin.svg")
  section.results-section.results-section-border-top
    ItemList(
      :lines="lines"
      :boxes="boxes"
      :lists="lists"
      @selectItem="focusItem"
      :shouldSortByY="true"
      :itemsHaveVisibilityButton="true"
      :itemsVisibleState="itemsVisibleState"
      @updateItemIsVisible="updateItemIsVisible"
    )
</template>

<style lang="stylus">
dialog.toc
  overflow auto
  right 8px
  bottom 34px
  top initial
  left initial
  text-align left
  transition bottom 0.1s ease-out
  &.is-pinned
    bottom 12px
  .right-pin
    transform rotate(180deg)
  section.toc-section
    user-select none
</style>
