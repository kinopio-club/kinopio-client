<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Minimap from '@/components/Minimap.vue'

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
  const rect = element.getBoundingClientRect()
  state.size = rect.width
}
</script>

<template lang="pug">
template(v-if="props.visible")
  section.minimap
    .row.title-row(ref="rowElement")
      span Minimap
    .row
      p {{state.size}}
    .row
      Minimap(:visible="Boolean(state.size)" :size="state.size")
</template>

<style lang="stylus">
// section.minimap
</style>
