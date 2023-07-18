<script setup>
import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

// onMounted(() => {
//   console.log(`🍆 the component is now mounted.`, store.state.currentSpace)
// store.subscribe((mutation, state) => {
//   if (mutation.type === 'triggerUpdateOtherCard') {
//     mutation.payload
//   }
// })
// })

const props = defineProps({
  visible: Boolean,
  price: Object // amount
})

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     console.log('💁‍♀️', value)
//   }
// })

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
    postMessage.send({ name: 'createSubscription', price: props.price, userId: store.state.currentUser.id })
  } catch (error) {
    console.error('🚒', error)
  }
}

// TODO receive postmessage
// postmessage -> storetrigger w payload -> subscribe here and validate

</script>

<template lang="pug">
.upgrade-user-apple(v-if="visible")
  //- .summary.row
  //-   User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
  //-   .row.row-wrap
  //-     .badge.info
  //-       span ${{price.amount}}/{{price.period}}

  .row
    button.success(@click.left="subscribe" :class="{active : state.loading.subscriptionIsBeingCreated}")
      span Upgrade Account for ${{price.amount}}/{{price.period}}
      Loader(:visible="state.loading.subscriptionIsBeingCreated")

  .row
    button.small-button(@click.left="subscribe" :class="{active : state.loading.subscriptionIsBeingCreated}")
      span Restore Purchase
      Loader(:visible="state.loading.isRestoringPurchase")

</template>

<style lang="stylus">
.upgrade-user-apple
  .user
    margin-right 6px
</style>
