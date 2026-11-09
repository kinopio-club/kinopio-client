<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useThemeStore } from '@/stores/useThemeStore'

import SpaceSettings from '@/components/dialogs/SpaceSettings.vue'
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
        state.spaceSettingsIsVisible = false
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
  spaceSettingsIsVisible: false,
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

const toggleSpaceSettingsIsVisible = () => {
  const value = !state.spaceSettingsIsVisible
  globalStore.closeAllDialogs()
  state.spaceSettingsIsVisible = value
}

const isCardSnapDisabled = computed(() => spaceStore.shouldPreventSnapToCard)

</script>

<template lang="pug">
button.small-button.translucent-button.space-settings-button(
  @click.left.stop="toggleSpaceSettingsIsVisible"
  :class="{active: state.spaceSettingsIsVisible}"
  title="Space Settings"
)
  //- new card color
  .badge.small-badge(:style="{ 'background-color': newCardColor }" title="New Card Color")
  //- card snap enabled
  img.icon.card-snap-disabled(src="@/assets/card-snap-disabled.svg" v-if="isCardSnapDisabled" title="Card Snap is Enabled")

  SpaceSettings(:visible="state.spaceSettingsIsVisible" :defaultColor="state.defaultColor")
</template>

<style lang="stylus">
.space-settings-button
  > .badge
    margin 0
    display inline-block
    height 11px
    min-height inherit
    border-radius var(--small-entity-radius)
    width 15px
    min-width initial

  > .icon.card-snap-disabled
    margin-left 5px

  dialog.space-settings
    top initial
    bottom 16px
</style>
