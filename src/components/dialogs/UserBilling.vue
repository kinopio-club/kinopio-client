<template lang="pug">
dialog.narrow.user-billing(v-if="visible" :open="visible" @click.stop)
  section
    p Billing
  section
    .loading-stripe(v-if="!loading.gettingBillingInfo")
      Loader(:visible="true")
    .summary(v-if="loading.gettingBillingInfo")
      User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
      p
        span You are paying
          .badge.info ${{billing.price}}/{{billing.period}}
    //- VISA **8566 — 10/2020
    //- Next payment due: $45 on 08/08/20

    p Thanks for supporting Kinopio!

    .row
      button(v-if="!cancelSubscriptionVisible" @click="toggleCancelSubscriptionVisible")
        img.icon(src="@/assets/remove.svg")
        span Downgrade to Free
      span(v-if="cancelSubscriptionVisible")
        p
          span.badge.danger You won't be able to add new cards
          span unless you upgrade your account again
        .segmented-buttons
          button(@click="toggleCancelSubscriptionVisible")
            span Cancel
          button.danger(@click="cancelSubscription")
            img.icon(src="@/assets/remove.svg")
            span Downgrade
            Loader(:visible="loading.isCancelling")
</template>

<script>
import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'UserBilling',
  components: {
    User: () => import('@/components/User.vue'),
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      cancelSubscriptionVisible: false,
      billing: {
        price: 4,
        period: 'month',
        cardType: '（ﾉ´д｀）',
        cardLast4: '(シ_ _)シ',
        cardExpMonth: 0,
        cardExpYear: 0
      },
      loading: {
        gettingBillingInfo: false,
        isCancelling: false
      }
    }
  },
  computed: {
    user () { return this.$store.state.currentUser }
  },
  methods: {
    toggleCancelSubscriptionVisible () {
      if (this.loading.isCancelling) { return }
      this.cancelSubscriptionVisible = !this.cancelSubscriptionVisible
    },
    async cancelSubscription () {
      this.loading.isCancelling = true
      const stripeIds = cache.stripeIds()
      try {
        await this.$store.dispatch('api/cancelSubscription', {
          userId: this.$store.state.currentUser.userId,
          stripeSubscriptionId: stripeIds.stripeSubscriptionId
        })
        this.$store.commit('currentUser/isUpgraded', false)
        this.$store.commit('addNotification', { message: 'Your account has been downgraded, and you will no longer be charged', type: 'success' })
      } catch (error) {
        console.error('🚒', error)
        this.$store.commit('addNotification', { message: '(シ_ _)シ Something went wrong, Please try again or contact support', type: 'danger' })
      }
      this.loading.isCancelling = false
    }
  },
  async getBillingInfo () {
    this.loading.gettingBillingInfo = true
    const stripeIds = cache.stripeIds()
    try {
      const info = await this.$store.dispatch('api/subscriptionInfo', {
        userId: this.$store.state.currentUser.userId,
        stripeSubscriptionId: stripeIds.stripeSubscriptionId,
        stripePaymentMethodId: stripeIds.stripePaymentMethodId
      })
      console.log('🎡 billing info', info) // subscription and paymentmethod objects
      // asign vals
      // billing: {
      //   price: 4,
      //   period: 'month',
      //   cardType: '（ﾉ´д｀）',
      //   cardLast4: '(シ_ _)シ',
      //   cardExpMonth: 0,
      //   cardExpYear: 0
      // },
    } catch (error) {
      console.error('🚒', error)
      this.$store.commit('addNotification', { message: '(シ_ _)シ Something went wrong, Please try again or contact support', type: 'danger' })
    }
    this.loading.gettingBillingInfo = false
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.getBillingInfo()
      }
    }
  }
}
</script>

<style lang="stylus">
.user-billing
  .summary
    display flex
    align-items top
    .user
      margin-right 6px
      vertical-align middle
    .badge
      display inline-block
    p
      margin 0
  .loading-stripe
    margin-bottom 10px
  .row
    margin-top 10px
</style>
