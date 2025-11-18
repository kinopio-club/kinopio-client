<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import About from '@/components/dialogs/About.vue'
import KeyboardShortcuts from '@/components/dialogs/KeyboardShortcuts.vue'
import Donate from '@/components/dialogs/Donate.vue'
import Pricing from '@/components/dialogs/Pricing.vue'
import AppsAndExtensions from '@/components/dialogs/AppsAndExtensions.vue'

const globalStore = useGlobalStore()
let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'closeAllDialogs') {
        closeDialogs()
      } else if (name === 'triggerKeyboardShortcutsIsVisible') {
        updateKeyboardShortcutsIsVisible(true)
      } else if (name === 'triggerDonateIsVisible') {
        updateDonateIsVisible(true)
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

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  aboutIsVisible: false,
  keyboardShortcutsIsVisible: false,
  donateIsVisible: false,
  appsAndExtensionsIsVisible: false
})

const closeDialogs = () => {
  state.aboutIsVisible = false
  state.keyboardShortcutsIsVisible = false
  state.donateIsVisible = false
  state.appsAndExtensionsIsVisible = false
}

const toggleAboutIsVisible = () => {
  const isVisible = state.aboutIsVisible
  globalStore.closeAllDialogs()
  state.aboutIsVisible = !isVisible
}
const updateKeyboardShortcutsIsVisible = (value) => {
  state.keyboardShortcutsIsVisible = value
}
const updateDonateIsVisible = (value) => {
  state.donateIsVisible = value
}
const pricingIsVisible = computed(() => globalStore.pricingIsVisible)
const togglePricingIsVisible = () => {
  const value = !pricingIsVisible.value
  globalStore.closeAllDialogs()
  globalStore.pricingIsVisible = value
}
const toggleAppsAndExtensionsIsVisible = () => {
  const isVisible = state.appsAndExtensionsIsVisible
  globalStore.closeAllDialogs()
  state.appsAndExtensionsIsVisible = !isVisible
}

</script>

<template lang="pug">
  header
    nav
      .row
        .left
          .logo-about
            .button-wrap
              .logo(alt="kinopio logo" @click.left.stop="toggleAboutIsVisible" @touchend.stop @mouseup.left.stop :class="{active: state.aboutIsVisible}" tabindex="0")
                .logo-image
              About(:visible="state.aboutIsVisible")
              KeyboardShortcuts(:visible="state.keyboardShortcutsIsVisible")
              Donate(:visible="state.donateIsVisible")

        .right
          .button-wrap
            button.translucent-button(@click.left.stop="togglePricingIsVisible" :class="{ active: pricingIsVisible }")
              span Pricing
            Pricing(:visible="pricingIsVisible" :parentIsPage="true")
          .button-wrap#download
            button.translucent-button(@click.left.stop="toggleAppsAndExtensionsIsVisible" :class="{active: state.appsAndExtensionsIsVisible}" ref="appsButtonElement")
              span Apps
            AppsAndExtensions(:visible="state.appsAndExtensionsIsVisible")
          .button-wrap
            router-link(to="/app")
              button.success Open Kinopio
</template>

<style lang="stylus">
header
  dialog.apps
    left initial
    right 8px

// same as components/Header.vue
header
  pointer-events none
  position fixed
  top 0
  user-select none
  z-index var(--max-z - 1)
  width 100%
  padding 8px
  display flex
  justify-content space-between
  transition 0.2s opacity
  transform-origin left top
  nav,
  aside
    pointer-events none
    position relative
    display -webkit-box
    button
      pointer-events all
    > .row
      width 100%
      display flex
      justify-content space-between
      // 2nd row onwards
      margin-top 6px
      margin-left 39px
      // 1st row
      &:first-child
        margin-top 0
        margin-left 0
      .left
        display flex
        flex-shrink 0
      .right
        display flex
        justify-content flex-end
        max-width 100%

  nav
    display flex
    justify-content space-between
    flex-wrap wrap
    width 100%

  .logo-about
    pointer-events all
    position relative
    display inline-block
    margin-right 6px
    margin-bottom -6px
  .logo
    cursor pointer
    display flex
    .label-badge
      bottom -2px

    img
      vertical-align middle
    .down-arrow
      padding-left 2px
      opacity 0.5
      @media(max-width 550px)
        display none
    .label-badge
      transform translateY(10px)
    &:active,
    &.active
      .down-arrow
        transform translateY(2px)
</style>
