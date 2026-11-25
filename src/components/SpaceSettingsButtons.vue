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

const userSettingsIsVisible = computed(() => globalStore.userSettingsIsVisible)
const toggleUserSettingsIsVisible = () => {
  const value = userSettingsIsVisible.value
  globalStore.userSettingsIsVisible = !value
}

const toggleNewCardColorSettingsIsVisible = () => {
  const value = !state.newCardColorSettingsIsVisible
  globalStore.closeAllDialogs()
  state.newCardColorSettingsIsVisible = value
}

const shouldSnapToCard = computed({
  get () {
    return spaceStore.shouldSnapToCard
  },
  set (value) {
    spaceStore.updateSpace({ shouldSnapToCard: value })
  }
})
const toggleShouldSnapToCard = () => {
  const value = shouldSnapToCard.value
  shouldSnapToCard.value = !value
}

</script>

<template lang="pug">
.space-settings-buttons
  .segmented-buttons
    //- settings
    button.small-button.translucent-button(
      @click.stop="toggleUserSettingsIsVisible"
      title="Settings"
    )
      img.icon.settings(src="@/assets/settings.svg")
    //- new card color
    button.small-button.translucent-button(
      @click.left.stop="toggleNewCardColorSettingsIsVisible"
      :class="{active: state.newCardColorSettingsIsVisible}"
      title="Space Settings"
    )
      .badge.small-badge.new-card-color-badge(:style="{ 'background-color': newCardColor }" title="New Card Color")
    //- toggle snap
    label.small-button.translucent-button(
      :class="{active: shouldSnapToCard}"
      @click.left.prevent="toggleShouldSnapToCard"
      @keydown.stop.enter="toggleShouldSnapToCard"
      title="Toggle Card Snap"
    )
      input(type="checkbox" v-model="shouldSnapToCard")
      span Snap

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
