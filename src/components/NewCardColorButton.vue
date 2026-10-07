<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useThemeStore } from '@/stores/useThemeStore'

import NewCardColorPicker from '@/components/dialogs/NewCardColorPicker.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const themeStore = useThemeStore()

let unsubscribes

onMounted(() => {
  updateDefaultColor()
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUpdateTheme') {
        updateDefaultColor()
      } else if (name === 'closeAllDialogs') {
        state.newCardColorPickerIsVisible = false
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const state = reactive({
  newCardColorPickerIsVisible: false,
  defaultColor: '#e3e3e3'
})

const updateDefaultColor = () => {
  state.defaultColor = utils.cssVariable('secondary-background')
}
const newCardColor = computed(() => {
  const color = globalStore.getNewCardColor
  if (themeStore.isCardColorThemeDefault(color)) {
    return state.defaultColor
  }
  return color || state.defaultColor
})

const toggleNewCardColorPickerIsVisible = () => {
  const value = !state.newCardColorPickerIsVisible
  globalStore.closeAllDialogs()
  state.newCardColorPickerIsVisible = value
}

</script>

<template lang="pug">
button.small-button.translucent-button.new-card-color-button(
  @click.left.stop="toggleNewCardColorPickerIsVisible"
  :class="{active: state.newCardColorPickerIsVisible}"
  title="Set Color of New Cards"
)
  .badge.small-badge(:style="{ 'background-color': newCardColor }")
  NewCardColorPicker(:visible="state.newCardColorPickerIsVisible" :defaultColor="state.defaultColor")
</template>

<style lang="stylus">
.new-card-color-button
  > .badge
    margin 0
    display inline-block
    height 11px
    min-height inherit
    border-radius var(--small-entity-radius)
    width 15px
    min-width initial
  dialog.new-card-color-picker
    top initial
    bottom 16px
</style>
