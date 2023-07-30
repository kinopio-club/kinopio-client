<script setup>
import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'
import postMessage from '@/postMessage.js'
import consts from '@/consts.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

onMounted(() => {
  window.addEventListener('message', handleSubscriptionSuccess)
  updateCredits()
})

const props = defineProps({
  visible: Boolean,
  price: Object // amount, applePriceId
})

const state = reactive({
  loading: {
    subscriptionIsBeingCreated: false
  },
  error: {
    unknownServerError: false
  },
  creditsEarned: 0
})

const user = computed(() => store.state.currentUser)

const subscribe = async () => {
  state.error.unknownServerError = false
  if (state.loading.subscriptionIsBeingCreated) { return }
  state.loading.subscriptionIsBeingCreated = true
  try {
    const appleAppAccountToken = self.crypto.randomUUID()
    await store.dispatch('api/updateAppleAppAccountToken', { appleAppAccountToken })
    const body = {
      name: 'createSubscription',
      value: {
        appleAppAccountToken,
        appleSubscriptionId: props.price.applePriceId
      }
    }
    console.log('🎡', body)
    postMessage.send(body)
  } catch (error) {
    console.error('🚒', error)
    state.error.unknownServerError = true
  }
}

const updateCredits = async () => {
  try {
    const data = await store.dispatch('api/getReferralsByUser')
    console.log('🫧', data)
    state.creditsEarned = data.creditsEarned
  } catch (error) {
    console.error('🚒', error)
  }
}

const handleSubscriptionSuccess = (event) => {
  if (!consts.isSecureAppContext) { return }
  const data = event.data
  state.loading.subscriptionIsBeingCreated = false
  if (data.name !== 'upgradedUser') { return }
  if (!data.isSuccess) { return }
  this.$store.commit('currentUser/isUpgraded', true)
  this.$store.commit('notifyCardsCreatedIsOverLimit', false)
  this.$store.commit('notifyEarnedCredits', false)
  this.$store.commit('addNotification', {
    message: 'Your account has been upgraded. Thank you for supporting independent, ad-free, sustainable software',
    type: 'success',
    isPersistentItem: true
  })
  this.$store.dispatch('closeAllDialogs')
}

</script>

<template lang="pug">
.upgrade-user-apple(v-if="visible")
  .row(v-if="state.creditsEarned")
    .badge.info
      span You have ${{state.creditsEarned}} in referral credits. To redeem credits you'll need to upgrade kinopio on the {{' '}}
      a(href="consts.kinopioDomain") web
  .row
    button(@click.left="subscribe" :class="{active : state.loading.subscriptionIsBeingCreated}")
      User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
      span Upgrade for ${{price.amount}}/{{price.period}}
      Loader(:visible="state.loading.subscriptionIsBeingCreated")
  .badge.danger(v-if="state.error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support. Your transaction was not processed.

</template>

<style lang="stylus">
.upgrade-user-apple
  .user
    margin-right 6px
  a
    color var(--primary)
</style>
