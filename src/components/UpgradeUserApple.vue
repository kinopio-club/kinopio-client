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
})

const props = defineProps({
  visible: Boolean,
  price: Object // amount, applePriceId
})

const state = reactive({
  loading: {
    subscriptionIsBeingCreated: false
  }
})

const user = computed(() => store.state.currentUser)

const subscribe = () => {
  if (state.loading.subscriptionIsBeingCreated) { return }
  state.loading.subscriptionIsBeingCreated = true
  try {
    postMessage.send({ name: 'createSubscription', userId: store.state.currentUser.id, appleSubscriptionId: props.price.applePriceId })
  } catch (error) {
    console.error('🚒', error)
  }
}

const handleSubscriptionSuccess = (event) => {
  const data = event.data
  state.loading.subscriptionIsBeingCreated = false
  if (!consts.isSecureAppContext) { return }
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

  .row
    button(@click.left="subscribe" :class="{active : state.loading.subscriptionIsBeingCreated}")
      User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
      span Upgrade for ${{price.amount}}/{{price.period}}
      Loader(:visible="state.loading.subscriptionIsBeingCreated")

</template>

<style lang="stylus">
.upgrade-user-apple
  .user
    margin-right 6px
  a
    color var(--primary)
</style>
