<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
const store = useStore()

const props = defineProps({
  visible: Boolean,
  price: Object // { amount, period, stripePriceId }
})

const state = reactive({
  loading: {
    subscribe: false
  },
  error: {
    unknownServerError: false
  }
})

const currentUser = computed(() => store.state.currentUser)

const clearState = () => {
  state.loading.subscribe = false
  state.error.unknownServerError = false
}
const isLifetimePlan = computed(() => props.price.period === 'life')

// subscribe

const subscribeUrl = async () => {
  const result = await store.dispatch('api/subscriptionUrl', {
    priceId: props.price.stripePriceId,
    userId: store.state.currentUser.id,
    period: props.price.period
  })
  return result
}

const checkoutUrl = async () => {
  const result = await store.dispatch('api/checkoutUrl', {
    priceId: props.price.stripePriceId,
    userId: store.state.currentUser.id,
    period: props.price.period
  })
  return result
}

const subscribe = async () => {
  if (state.loading.subscribe) { return }
  try {
    let result
    clearState()
    state.loading.subscribe = true
    if (isLifetimePlan.value) {
      result = await checkoutUrl()
    } else {
      result = await subscribeUrl()
    }
    window.location = result.url
  } catch (error) {
    console.error('🚒 subscribe', error)
    clearState()
    state.error.unknownServerError = true
  }
}

</script>

<template lang="pug">
.upgrade-user-stripe(v-if="visible")
  p Tax included.
    template(v-if="isLifetimePlan")
      span This is a one-time perpetual license purchase.
    template(v-else)
      span You can cancel anytime.

  //- button
  .row
    button(@click.left="subscribe" :class="{active : state.loading.subscribe}")
      User(:user="currentUser" :isClickable="false" :hideYouLabel="true" :key="currentUser.id")
      span Upgrade for ${{price.amount}}/{{price.period}}
      Loader(:visible="state.loading.subscribe")
  .badge.danger(v-if="state.error.unknownServerError")
    span (シ_ _)シ Something went wrong, Please try again or contact support. Your transaction was not processed.

</template>

<style lang="stylus">
</style>
