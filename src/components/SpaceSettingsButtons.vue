<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useThemeStore } from '@/stores/useThemeStore'

import NewCardColorSettings from '@/components/dialogs/NewCardColorSettings.vue'
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
        state.newCardColorSettingsIsVisible = false
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
  newCardColorSettingsIsVisible: false,
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

const toggleNewCardColorSettingsIsVisible = () => {
  const value = !state.newCardColorSettingsIsVisible
  globalStore.closeAllDialogs()
  state.newCardColorSettingsIsVisible = value
}

// todo rename to shouldPreventSnapToItem includes box snap and card snap (snap into list still valid)
const isCardSnapEnabled = computed(() => !spaceStore.shouldPreventSnapToCard)

</script>

<template lang="pug">
.space-settings-buttons
  .segmented-buttons
    button.small-button.translucent-button(title="Settings")
      img.icon.settings(src="@/assets/settings.svg")

    button.small-button.translucent-button(
      @click.left.stop="toggleNewCardColorSettingsIsVisible"
      :class="{active: state.newCardColorSettingsIsVisible}"
      title="Space Settings"
    )
      //- new card color
      .badge.small-badge.new-card-color-badge(:style="{ 'background-color': newCardColor }" title="New Card Color")
      //- card snap enabled
      //- img.icon.card-snap-disabled(src="@/assets/card-snap-disabled.svg" v-if="isCardSnapEnabled" title="Card Snap is Enabled")

    label.small-button.translucent-button(:class="{active: isCardSnapEnabled}")
      input(type="checkbox" v-model="isCardSnapEnabled")
      span Snap
      //- img.icon.card-snap-disabled(src="@/assets/card-snap-disabled.svg" v-if="isCardSnapEnabled" title="Card Snap is Enabled")

  NewCardColorSettings(:visible="state.newCardColorSettingsIsVisible" :defaultColor="state.defaultColor")
</template>

<style lang="stylus">
.space-settings-buttons
  // > button
  .new-card-color-badge
    margin 0
    display inline-block
    height 11px
    min-height inherit
    border-radius var(--small-entity-radius)
    width 15px
    min-width initial

    // > .icon.card-snap-disabled
    //   margin-left 5px

  dialog.new-card-color-settings
    top initial
    bottom 16px
</style>
