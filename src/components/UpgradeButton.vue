<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'

// import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()

const props = defineProps({
  label: {
    default: 'Upgrade for Unlimited',
    type: String
  }
})

const triggerUpgradeUserIsVisible = () => {
  globalStore.closeAllDialogs()
  const currentUserIsSignedIn = userStore.getUserIsSignedIn
  if (currentUserIsSignedIn) {
    globalStore.triggerUpgradeUserIsVisible()
  } else {
    globalStore.triggerSignUpOrInIsVisible()
  }
}
</script>

<template lang="pug">
.button-wrap
  button(@click.stop="triggerUpgradeUserIsVisible")
    span {{ props.label }}
</template>

<style lang="stylus">
// .component-name
</style>
