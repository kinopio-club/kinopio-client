<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import MinimapCanvas from '@/components/MinimapCanvas.vue'
import utils from '@/utils.js'

const store = useStore()

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
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeightFromHeader(element)
}

const updateSize = async () => {
  await nextTick()
  const element = rowElement.value
  if (!element) { return }
  const rect = element.getBoundingClientRect()
  state.size = rect.width
}

// boxes

const boxes = computed(() => {
  let items = store.getters['currentBoxes/all']
  items = utils.sortByY(items)
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
dialog.narrow.minimap(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.minimap
    .row.title-row(ref="rowElement")
      span Minimap
    .row
      MinimapCanvas(:visible="Boolean(state.size)" :size="state.size")
  section.minimap
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
  section.minimap
    user-select none
    .row.boxes-row
      flex-wrap wrap
      .badge
        margin-bottom 10px

</style>
