<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'
import consts from '@/consts.js'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

let productId
if (consts.isDevelopment()) {
  productId = 'prod_LtXVNnexfHyKZA'
} else {
  productId = 'prod_LuJoVy0tM7PiBI'
}

const dialogElement = ref(null)
const inputElement = ref(null)

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  customAmountIsVisible: false,
  currentAmount: 0,
  isLoading: false,
  error: {
    unknownServerError: false,
    amountIsTooLow: false
  },
  dialogHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    state.currentAmount = 0
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const customAmount = computed({
  get () {
    return state.currentAmount
  },
  set (value) {
    value = parseInt(value)
    state.currentAmount = value
  }
})
const currentUser = computed(() => userStore.getUserAllState)
const currentUserIsUpgraded = computed(() => userStore.isUpgraded)

const triggerUpgradeUserIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerUpgradeUserIsVisible()
}
const toggleCustomAmountIsVisible = async (value) => {
  value = !state.customAmountIsVisible
  state.customAmountIsVisible = value
  if (!value) { return }
  await nextTick()
  const element = inputElement.value
  const length = state.currentAmount.toString().length
  element.focus()
  element.setSelectionRange(0, length)
}
const updateAmount = (value) => {
  state.currentAmount = value
  clearErrors()
}
const clearErrors = () => {
  state.error.unknownServerError = false
  state.error.amountIsTooLow = false
}
const donate = async () => {
  const minAmount = 2
  if (state.isLoading) { return }
  clearErrors()
  state.isLoading = true
  let amount = parseInt(state.currentAmount)
  if (amount < minAmount) {
    state.isLoading = false
    state.error.amountIsTooLow = true
    return
  }
  try {
    if (!amount) { throw `invalid amount, ${amount}` }
    amount = amount * 100
    const result = await apiStore.donationUrl({
      amount,
      productId,
      userId: userStore.id
    })
    window.location = result.url
  } catch (error) {
    console.error('🚒', error)
    state.error.unknownServerError = true
    state.isLoading = false
  }
}
</script>

<template lang="pug">
dialog.donate.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p Donate
  section
    p Donations help support my work on Kinopio. I'm grateful and flattered that you're even here.
    p
      span You'll also get the coveted {{' '}}
      span.badge.success
        span Donor
      span badge on your profile

    .segmented-buttons
      button(@click="updateAmount(5)" :class="{ active: state.currentAmount === 5 }")
        span $5
      button(@click="updateAmount(20)" :class="{ active: state.currentAmount === 20 }")
        span $20
      button(@click="updateAmount(50)" :class="{ active: state.currentAmount === 50 }")
        span $50
      button(@click="toggleCustomAmountIsVisible" :class="{ active: state.customAmountIsVisible }")
        span Custom

    div(v-if="state.customAmountIsVisible")
      .row
        span $
        input.name.user-details-name(placeholder="100" v-model="customAmount" ref="inputElement" type="number" @keydown.enter="donate")

    template(v-if="state.currentAmount")
      div
        .row
          User(:user="currentUser" :isClickable="false" :hideYouLabel="true" :key="currentUser.id")
          .badge.info
            span ${{state.currentAmount}}
            span /one time
      button(@click="donate" :class="{ active: state.isLoading }")
        span Donation Checkout
        Loader(:visible="state.isLoading")

      div(v-if="state.error.unknownServerError")
        .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
      div(v-if="state.error.amountIsTooLow")
        .badge.danger Because of Stripe fees, the minimum donation amount is $2
      div
        img.icon(src="@/assets/lock.svg")
        span You'll be redirected to Stripe to complete checkout

  section(v-if="!currentUserIsUpgraded")
    p Donations won't upgrade your account
    button(@click="triggerUpgradeUserIsVisible")
      span Upgrade Account

</template>

<style lang="stylus">
dialog.donate
  overflow auto
  max-height calc(100vh - 210px)
  // left initial
  // right 8px
  .summary
    margin-top 10px
    margin-bottom 10px
  .badge
    display inline-block
  .user
    margin-right 6px
</style>
