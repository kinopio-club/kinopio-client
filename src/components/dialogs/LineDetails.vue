<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useLineStore } from '@/stores/useLineStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import ItemDetailsDebug from '@/components/ItemDetailsDebug.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const lineStore = useLineStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)

const state = reactive({
  colorPickerIsVisible: false
})

const currentLine = computed(() => {
  return lineStore.getLine(globalStore.lineDetailsIsVisibleForLineId) || {}
})
const visible = computed(() => utils.objectHasKeys(currentLine.value))

// const themeName = computed(() => userStore.theme)
// const incrementBy = () => {
//   state.count = state.count + 1
//   emit('updateCount', state.count)
//   // themeStore.updateThemeIsSystem(false)
// }
</script>

<template lang="pug">
dialog.narrow.link-details(v-if="visible" :open="visible" @click.left.stop ref="dialogElement")
  section.title-section
    p link details
  section
    ItemDetailsDebug(:item="currentLine" :keys="['y', 'color']")
</template>

<style lang="stylus">
// dialog.link-details
</style>
