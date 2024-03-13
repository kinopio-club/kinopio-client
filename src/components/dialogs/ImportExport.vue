<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Import from '@/components/Import.vue'
import Export from '@/components/Export.vue'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)

const emit = defineEmits(['updateSpaces', 'closeDialog'])

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const props = defineProps({
  visible: Boolean,
  isExport: Boolean,
  isImport: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    init()
  }
})

const state = reactive({
  isImport: true,
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
const init = () => {
  if (props.isExport) {
    state.isImport = false
  }
  console.log(props.isImport)
  if (props.isImport) {
    state.isImport = true
  }
}
const updateIsImport = (value) => {
  state.isImport = value
}
const updateSpaces = () => {
  emit('updateSpaces')
}
const closeDialog = () => {
  // emit('closeDialog')
}
</script>

<template lang="pug">
dialog.narrow.import-export(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    .segmented-buttons
      button(:class="{active: state.isImport}" @click="updateIsImport(true)")
        span Import
      button(:class="{active: !state.isImport}" @click="updateIsImport(false)")
        span Export
  Import(:visible="state.isImport" @updateSpaces="updateSpaces" @closeDialog="closeDialog")
  Export(:visible="!state.isImport" @updateSpaces="updateSpaces")
</template>

<style lang="stylus">
dialog.import-export
  max-height calc(100vh - 140px)
  overflow auto
  @media(max-width 350px)
    right -50px
</style>
