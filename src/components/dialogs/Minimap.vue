<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useBoxStore } from '@/stores/useBoxStore'

import MinimapCanvas from '@/components/MinimapCanvas.vue'
import utils from '@/utils.js'

const store = useStore()
const boxStore = useBoxStore()

const dialogElement = ref(null)
const rowElement = ref(null)

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
  await nextTick()
  const element = rowElement.value
  if (!element) { return }
  const rect = element.getBoundingClientRect()
  state.size = rect.width
}

// pin dialog

const dialogIsPinned = computed(() => store.state.minimapIsPinned)
const toggleDialogIsPinned = () => {
  const isPinned = !dialogIsPinned.value
  store.dispatch('minimapIsPinned', isPinned)
}

// boxes

const boxes = computed(() => {
  let items = boxStore.getAllBoxes
  items = utils.sortByDistanceFromOrigin(items)
  return items
})
const boxColorClasses = (box) => {
  return utils.colorClasses({ backgroundColor: box.color })
}
const scrollIntoView = (box) => {
  store.dispatch('focusOnBoxId', box.id)
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
  section.minimap-section
    .row.title-row(ref="rowElement")
      span Minimap
      .button-wrap(@click.left.stop="toggleDialogIsPinned" title="Pin dialog")
        button.small-button(:class="{active: dialogIsPinned}")
          img.icon.pin.right-pin(src="@/assets/pin.svg")
    .row
      MinimapCanvas(:visible="Boolean(state.size)" :size="state.size")
  section.boxes-section
    .row
      p Jump to Box
    .row.boxes-row(v-if="boxes.length")
      template(v-for="box in boxes" :key="box.id")
        .badge.button-badge(:style="{background: box.color}" :class="boxColorClasses(box)" @click="scrollIntoView(box)")
          span {{box.name}}
    .row(v-else)
      .badge.secondary
        img.icon.box-icon(src="@/assets/box.svg")
        span No boxes in this space yet
</template>

<style lang="stylus">
dialog.minimap
  overflow auto
  right 8px
  bottom 28px
  top initial
  left initial
  &.is-pinned
    right -32px
  .right-pin
    transform rotate(180deg)
  section.minimap-section
    user-select none
  section.boxes-section
    user-select none
    .row.boxes-row
      flex-wrap wrap
      .badge
        margin-bottom 10px

</style>
