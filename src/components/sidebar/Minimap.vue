<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import MinimapCanvas from '@/components/MinimapCanvas.vue'
import utils from '@/utils.js'

const rowElement = ref(null)

const store = useStore()

onMounted(() => {
  updateSize()
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateSize()
  }
})

const state = reactive({
  size: null
})

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
  const element = utils.boxElementFromId(box.id)
  store.commit('scrollElementIntoView', { element })
}
</script>

<template lang="pug">
template(v-if="props.visible")
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
section.minimap
  user-select none
  .row.boxes-row
    flex-wrap wrap
    .badge
      margin-bottom 10px
</style>
