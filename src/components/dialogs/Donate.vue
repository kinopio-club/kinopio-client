<template lang="pug">
dialog.donate.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialog")
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
      button(@click="updateAmount(5)" :class="{ active: this.currentAmount === 5 }")
        span $5
      button(@click="updateAmount(20)" :class="{ active: this.currentAmount === 20 }")
        span $20
      button(@click="updateAmount(50)" :class="{ active: this.currentAmount === 50 }")
        span $50
      button(@click="toggleCustomAmountIsVisible" :class="{ active: customAmountIsVisible }")
        span Custom

    div(v-if="customAmountIsVisible")
      .row
        span $
        input.name.user-details-name(placeholder="100" v-model="customAmount" ref="input" type="number" @keydown.enter="donate")

    template(v-if="currentAmount")
      div
        .row
          User(:user="currentUser" :isClickable="false" :hideYouLabel="true" :key="currentUser.id")
          .badge.info
            span ${{currentAmount}}
            span /one time
      button(@click="donate" :class="{ active: isLoading }")
        span Donation Checkout
        Loader(:visible="isLoading")

      div(v-if="error.unknownServerError")
        .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
      div(v-if="error.amountIsTooLow")
        .badge.danger Because of Stripe fees, the minimum donation amount is $2
      div
        img.icon(src="@/assets/lock.svg")
        span You'll be redirected to Stripe to complete checkout

  section(v-if="!currentUserIsUpgraded")
    p Donations won't upgrade your account
    button(@click="triggerUpgradeUserIsVisible")
      span Upgrade Account

</template>

<script>
import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'
import consts from '@/consts.js'

let productId
if (consts.isDevelopment()) {
  productId = 'prod_LtXVNnexfHyKZA'
} else {
  productId = 'prod_LuJoVy0tM7PiBI'
}
export default {
  name: 'Donate',
  components: {
    User,
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      customAmountIsVisible: false,
      currentAmount: 0,
      isLoading: false,
      error: {
        unknownServerError: false,
        amountIsTooLow: false
      }
    }
  },
  computed: {
    customAmount: {
      get () {
        return this.currentAmount
      },
      set (value) {
        value = parseInt(value)
        this.currentAmount = value
      }
    },
    currentUser () { return this.$store.state.currentUser },
    currentUserIsUpgraded () { return this.$store.state.currentUser.isUpgraded }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.currentAmount = 0
      }
    }
  },
  methods: {
    triggerUpgradeUserIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerUpgradeUserIsVisible')
    },
    toggleCustomAmountIsVisible (value) {
      value = !this.customAmountIsVisible
      this.customAmountIsVisible = value
      if (!value) { return }
      this.$nextTick(() => {
        const element = this.$refs.input
        const length = this.currentAmount.toString().length
        element.focus()
        element.setSelectionRange(0, length)
      })
    },
    updateAmount (value) {
      this.currentAmount = value
      this.clearErrors()
    },
    clearErrors () {
      this.error.unknownServerError = false
      this.error.amountIsTooLow = false
    },
    async donate () {
      const minAmount = 2
      if (this.isLoading) { return }
      this.clearErrors()
      this.isLoading = true
      let amount = parseInt(this.currentAmount)
      if (amount < minAmount) {
        this.isLoading = false
        this.error.amountIsTooLow = true
        return
      }
      try {
        if (!amount) { throw `invalid amount, ${amount}` }
        amount = amount * 100
        const result = await this.$store.dispatch('api/donationUrl', {
          amount,
          productId,
          userId: this.currentUser.id
        })
        window.location = result.url
      } catch (error) {
        console.error('🚒', error)
        this.error.unknownServerError = true
        this.isLoading = false
      }
    }
  }
}
</script>

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
