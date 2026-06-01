<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import utils from '@/utils.js'

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['updateCurrentScope'])

const props = defineProps({
  visible: Boolean,
  currentScope: Object
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
  state.dialogHeight = utils.elementHeight(element)
}

</script>

<template lang="pug">
dialog.narrow.api-key-scope-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    p blank dialog, please duplicate
</template>

<style lang="stylus">
// dialog.api-key-scope-picker
</style>
