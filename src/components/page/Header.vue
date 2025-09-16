<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import About from '@/components/dialogs/About.vue'
import KeyboardShortcuts from '@/components/dialogs/KeyboardShortcuts.vue'
import Donate from '@/components/dialogs/Donate.vue'
import Pricing from '@/components/dialogs/Pricing.vue'

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
  donateIsVisible: false
})

const closeDialogs = () => {
  state.aboutIsVisible = false
  state.keyboardShortcutsIsVisible = false
  state.donateIsVisible = false
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
            button(@click.left.stop="togglePricingIsVisible" :class="{active: pricingIsVisible, 'translucent-button': !shouldIncreaseUIContrast}")
              span Pricing
            Pricing(:visible="pricingIsVisible" :parentIsPage="true")
          .button-wrap
            router-link(to="/app")
              button.success Open App
</template>

<style lang="stylus">
// .component-name
</style>
