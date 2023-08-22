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
  loading: false,
  error: {
    unknownServerError: false
  }
})

const currentUser = computed(() => store.state.currentUser)

const clearState = () => {
  state.loading = false
  state.error.unknownServerError = false
}

const subscribe = async () => {
  if (state.loading) { return }
  // do referral credits stuff here?
  try {
    clearState()
    state.loading = true
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
  //- TODO info about credits
  .row
    button(@click.left="subscribe" :class="{active : state.loading}")
      User(:user="currentUser" :isClickable="false" :hideYouLabel="true" :key="currentUser.id")
      span Upgrade for ${{price.amount}}/{{price.period}}
      Loader(:visible="state.loading")

    //- p
    //-   img.icon(src="@/assets/lock.svg")
    //-   span You'll be redirected to Stripe to complete checkout

  .badge.danger(v-if="state.error.unknownServerError")
    span (シ_ _)シ Something went wrong, Please try again or contact support. Your transaction was not processed.
  //- .badge.danger(v-if='state.error.subscriptionError')
  //-   span (シ_ _)シ Your subscription was not processed, Please try again or contact support.
  //- .badge.success(v-if="isUpgraded")
  //-   span Your account has been upgraded. Thank you for supporting independent, ad-free, sustainable software
</template>

<style lang="stylus">
// .component-name
</style>
