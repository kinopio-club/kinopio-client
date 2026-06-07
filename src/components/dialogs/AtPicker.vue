<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['closeDialog'])

const props = defineProps({
  visible: Boolean,
  position: Object,
  search: String,
  cursorPosition: Number
})

const state = reactive({
  dialogHeight: null
})

watch(() => props.visible, async (value) => {
  if (value) {
    await nextTick()
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const styles = computed(() => {
  return {
    top: props.position?.top + 'px',
    maxHeight: state.dialogHeight + 'px'
  }
})
</script>

<template lang="pug">
dialog.at-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="styles")
  section.title-section
    p At Picker
</template>

<style lang="stylus">
// dialog.at-picker
</style>
