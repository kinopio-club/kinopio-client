<script setup>
import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'
import postMessage from '@/postMessage.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  visible: Boolean,
  price: Object // amount, applePriceId
})

const state = reactive({
  loading: {
    subscriptionIsBeingCreated: false,
    isRestoringPurchase: false
  }
})

const user = computed(() => store.state.currentUser)

const subscribe = () => {
  if (state.loading.subscriptionIsBeingCreated) { return }
  state.loading.subscriptionIsBeingCreated = true
  try {
    console.log('💰', props.price)
    postMessage.send({ name: 'createSubscription', userId: store.state.currentUser.id, appleSubscriptionId: props.price.applePriceId })
  } catch (error) {
    console.error('🚒', error)
  }
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
