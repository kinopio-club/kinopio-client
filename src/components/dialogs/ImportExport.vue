<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Import from '@/components/Import.vue'
import Export from '@/components/Export.vue'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)

const emit = defineEmits(['updateSpaces'])

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean,
  isExport: Boolean,
  isImport: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})
watch(() => props.isExport, (value, prevValue) => {
  state.isExport = value
})
watch(() => props.isImport, (value, prevValue) => {
  state.isImport = value
})

const state = reactive({
  isImport: true,
  isExport: false,
  dialogHeight: null
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
// const closeChildDialogs = () => {
//   store.commit('triggerCloseChildDialogs')
// }
const updateSpaces = () => {
  emit('updateSpaces')
}
</script>

<template lang="pug">
dialog.narrow.import-export(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    span(v-if="state.isImport") Import
    span(v-if="state.isExport") Export
  Import(:visible="state.isImport" @updateSpaces="updateSpaces")
  Export(:visible="!state.isImport" @updateSpaces="updateSpaces")
</template>

<style lang="stylus">
dialog.import-export
  max-height calc(100vh - 140px)
  overflow auto
  @media(max-width 350px)
    right -50px
  .row
    white-space initial
</style>
