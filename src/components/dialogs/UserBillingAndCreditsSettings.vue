<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import UserCredits from '@/components/UserCredits.vue'
import ReferredNewUserCredits from '@/components/ReferredNewUserCredits.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'
const store = useStore()

const dialog = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
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
  store.dispatch('closeAllDialogs')
  store.commit('triggerUpgradeUserIsVisible')
}

const subscriptionIsApple = computed(() => store.getters['currentUser/subscriptionIsApple'])
const subscriptionIsStripe = computed(() => store.getters['currentUser/subscriptionIsStripe'])
const subscriptionIsFree = computed(() => store.getters['currentUser/subscriptionIsFree'])

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialog.value
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
    const result = await store.dispatch('api/customerPortalUrl', {
      userId: store.state.currentUser.id
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
    p Billing and Credits

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
      span (シ_ _)シ Something went wrong, Please try again or contact support.

  //- apple
  section(v-else-if="subscriptionIsApple")
    p
      .badge.success Thanks for supporting Kinopio
    p
      img.icon(src="@/assets/apple.svg")
      span Because you upgraded on iOS, you can update or cancel your subscription through Apple
    p
      a(href="https://support.apple.com/billing")
        span Apple Billing and Subscriptions Info

  //- not signed in
  section(v-else)
    p After you upgrade your account you'll be able to manage your payment details here
    button(@click.left="triggerUpgradeUserIsVisible") Upgrade
    ReferredNewUserCredits

  UserCredits(:showEarnCreditsButton="true")
</template>

<style lang="stylus">
</style>
