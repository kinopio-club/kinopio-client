<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

onMounted(() => {
  updateDefaultColor()
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerUpdateTheme') {
        updateDefaultColor()
      } else if (name === 'closeAllDialogs') {
        state.colorPickerIsVisible = false
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
  colorPickerIsVisible: false,
  defaultColor: '#e3e3e3'
})

const updateDefaultColor = () => {
  state.defaultColor = utils.cssVariable('secondary-background')
}
const newCardColor = computed(() => {
  const userDefault = userStore.defaultCardBackgroundColor
  return userDefault || state.defaultColor
})

const toggleColorPicker = () => {
  const value = !state.colorPickerIsVisible
  globalStore.closeAllDialogs()
  state.colorPickerIsVisible = value
}
const updateCardColor = (color) => {
  userStore.updateUser({ defaultCardBackgroundColor: color })
}
const clearCardColor = (color) => {
  userStore.updateUser({ defaultCardBackgroundColor: state.defaultColor })
}
</script>

<template lang="pug">
button.small-button.translucent-button.new-card-color-button(
  @click.left.stop="toggleColorPicker"
  :class="{active: state.colorPickerIsVisible}"
  title="Set Color of New Cards"
)
  .badge.small-badge(:style="{ 'background-color': newCardColor }")
  ColorPicker(
    :currentColor="newCardColor"
    :visible="state.colorPickerIsVisible"
    :removeIsVisible="true"
    @selectedColor="updateCardColor"
    @removeColor="clearCardColor"
  )

  //- TODO color swatch for current card color, opens dialog to let user choose default user card color, and space user card color
  //- remove from user settings

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
  .color-picker
    top initial
    bottom 16px
</style>
