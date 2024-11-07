<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ImportExport from '@/components/dialogs/ImportExport.vue'
const store = useStore()

const emit = defineEmits(['closeDialogs'])

onMounted(() => {
  store.subscribe(async (mutation) => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeDialogs()
    }
  })
})

const state = reactive({
  exportIsVisible: false,
  importIsVisible: false
})

const closeDialogs = () => {
  state.exportIsVisible = false
  state.importIsVisible = false
  emit('closeDialogs')
}
const toggleExportIsVisible = () => {
  const isVisible = state.exportIsVisible
  closeDialogs()
  state.exportIsVisible = !isVisible
}
const toggleImportIsVisible = () => {
  const isVisible = state.importIsVisible
  closeDialogs()
  state.importIsVisible = !isVisible
}

</script>

<template lang="pug">
.button-wrap.import-export-button
  .segmented-buttons
    button(@click.left.stop="toggleImportIsVisible" :class="{ active: state.importIsVisible }")
      span Import
    button(@click.left.stop="toggleExportIsVisible" :class="{ active: state.exportIsVisible }")
      span Export
  ImportExport(:visible="state.exportIsVisible || state.importIsVisible" :isExport="state.exportIsVisible" :isImport="state.importIsVisible")
</template>

<style lang="stylus">
// .import-export-button
</style>
