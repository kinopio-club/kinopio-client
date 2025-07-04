<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import dayjs from 'dayjs'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

const dialog = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const state = reactive({
  dialogHeight: null,
  loading: false,
  error: {
    unknownServerError: false
  }
})

const triggerUpgradeUserIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerUpgradeUserIsVisible()
}

const subscriptionIsApple = computed(() => userStore.appleSubscriptionIsActive)
const subscriptionIsStripe = computed(() => subscriptionIsFree.value || userStore.stripeSubscriptionId)
const stripePlanIsPurchased = computed(() => userStore.stripePlanIsPurchased)
const subscriptionIsFree = computed(() => {
  const strings = ['🌷free', '🌷 free', '🫧free']
  return strings.includes(userStore.stripeSubscriptionId)
})
const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialog.value
  state.dialogHeight = utils.elementHeight(element)
}

const clearState = () => {
  state.loading = false
  state.error.unknownServerError = false
}

const customerPortal = async () => {
  if (state.loading) { return }
  try {
    clearState()
    state.loading = true
    const result = await apiStore.customerPortalUrl({
      userId: userStore.id
    })
    window.location = result.url
  } catch (error) {
    console.error('🚒', error)
    clearState()
    state.error.unknownServerError = true
  }
}

</script>

<template lang="pug">
dialog.narrow.user-billing(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p Billing

  //- free
  section(v-if="subscriptionIsFree")
    p Your subscription has been set to free

  //- stripe
  section(v-else-if="subscriptionIsStripe")
    p You can access receipts, update your payment method, or cancel through Stripe
    button(@click="customerPortal" :class="{ active: state.loading }")
      span Customer Portal
      Loader(:visible="state.loading")
    p.badge.danger(v-if="state.error.unknownServerError")
      span (シ_ _)シ Something went wrong. Please try again or contact support.
  //- stripe lifetime
  section(v-else-if="stripePlanIsPurchased")
    p You've purchased a lifetime plan. If you need a new receipt please contact support.
    p
      a(href="mailto:support@kinopio.club") support@kinopio.club

  //- apple
  section(v-else-if="subscriptionIsApple")
    div
      .badge.success Thanks for supporting Kinopio
    div
      img.icon(src="@/assets/apple.svg")
      span Because you upgraded on iOS, you can update or cancel your subscription through Apple
    div
      a(href="https://support.apple.com/billing")
        span Apple Billing and Subscriptions Info

  //- not signed in
  section(v-else)
    p After you upgrade your account you'll be able to manage your payment details here
    button(@click.left="triggerUpgradeUserIsVisible") Upgrade
</template>

<style lang="stylus">
dialog.user-billing
  left initial
  right 6px
  overflow auto
</style>
