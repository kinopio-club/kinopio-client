<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
const store = useStore()

onMounted(() => {
  updateCredits()
})

const props = defineProps({
  visible: Boolean,
  price: Object // { amount, period, stripePriceId }
})

const state = reactive({
  loading: {
    subscribe: false,
    credits: false
  },
  error: {
    unknownServerError: false
  },
  credits: 0
})

const currentUser = computed(() => store.state.currentUser)

const clearState = () => {
  state.loading.subscribe = false
  state.error.unknownServerError = false
}

// credits

const updateCredits = async () => {
  state.loading.credits = true
  try {
    const data = await store.dispatch('api/getReferralsByUser')
    console.log('🫧', data)
    state.credits = data.creditsUnused
  } catch (error) {
    console.error('🚒', error)
  }
  state.loading.credits = false
}
const initialPaymentAfterCredits = computed(() => {
  const credits = state.credits
  const price = props.price.amount
  if (price > credits) {
    return price - credits
  } else {
    return 0
  }
})
const creditsUsedForInitialPayment = computed(() => {
  const credits = state.credits
  const price = props.price.amount
  if (price > credits) {
    return credits
  } else {
    return price
  }
})
const creditsRemainingAfterInitialPayment = computed(() => {
  const credits = state.credits
  const price = props.price.amount
  return credits - price
})
const isCreditsRemainingAfterInitialPayment = computed(() => {
  return creditsRemainingAfterInitialPayment.value > 0
})

// subscribe

const subscribe = async () => {
  if (state.loading.subscribe) { return }
  // do referral credits stuff here?
  try {
    clearState()
    state.loading.subscribe = true
    const result = await store.dispatch('api/subscriptionUrl', {
      priceId: props.price.stripePriceId,
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
.upgrade-user-stripe(v-if="visible")
  p Tax included. You can cancel anytime.
  .row
    button(@click.left="subscribe" :class="{active : state.loading.subscribe}")
      User(:user="currentUser" :isClickable="false" :hideYouLabel="true" :key="currentUser.id")
      span Upgrade for ${{price.amount}}/{{price.period}}
      Loader(:visible="state.loading.subscribe")

  .badge.danger(v-if="state.error.unknownServerError")
    span (シ_ _)シ Something went wrong, Please try again or contact support. Your transaction was not processed.

  .row(v-if="state.loading.credits || state.credits")
    Loader(:visible="state.loading.credits")
    .badge.success(v-if="state.credits")
      span ${{state.credits}} credit
  p(v-if="state.credits")
    span You'll be billed ${{initialPaymentAfterCredits}} immediately.
    span(v-if="isCreditsRemainingAfterInitialPayment") {{' '}}Your remaining ${{creditsRemainingAfterInitialPayment}} credit will be applied to future bills.
    span {{' '}}Then you'll be billed ${{price.amount}} each {{price.period}}.

</template>

<style lang="stylus">
</style>
