<template lang="pug">
dialog.narrow.user-billing(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Billing

  section(v-if="loading.gettingBillingInfo")
    Loader(:visible="true")

  template(v-if="!loading.gettingBillingInfo")
    // downgraded
    section(v-if="isAwaitingDowngrade")
      p
        span.badge.success Subscription Cancelled
      p Your plan will be downgraded to free on {{info.nextBillingDate || downgradeAt}}. You'll receive an email when that happens

    //- free
    section(v-if="!isUpgraded")
      template(v-if="isAwaitingDowngrade")
        p You can upgrade your account again whenever you're ready
      template(v-else)
        ReferredNewUserCredits
        p After you upgrade your account you'll be able to manage your payment details here
      button(@click.left="triggerUpgradeUserIsVisible") Upgrade

    //- upgraded
    section(v-if="isUpgraded")
      .summary
        User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
        p
          span You are paying{{' '}}
            .badge.info ${{info.price}}/{{info.period}}
      p(v-if="info.nextBillingDate") Next payment: {{info.nextBillingDate}}
      p(v-if="info.cardType") {{info.cardType}} ••{{info.cardLast4}} – {{info.cardExpMonth}}/{{info.cardExpYear}}
      p
        .badge.success Thanks for supporting Kinopio
      .row
        button(v-if="!cancelSubscriptionVisible" @click.left="toggleCancelSubscriptionVisible")
          img.icon(src="@/assets/remove.svg")
          span Downgrade to Free
        span(v-if="cancelSubscriptionVisible")
          p
            span.badge.danger You won't be able to add new cards
            span unless you upgrade your account again. All of your cards and spaces will still be accessible.
          .segmented-buttons
            button(@click.left="toggleCancelSubscriptionVisible")
              span Cancel
            button.danger(@click.left="cancelSubscription")
              img.icon(src="@/assets/remove.svg")
              span Downgrade
              Loader(:visible="loading.isCancelling")
    UserCredits(:showEarnCreditsButton="true")
</template>

<script>
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import UserCredits from '@/components/UserCredits.vue'
import ReferredNewUserCredits from '@/components/ReferredNewUserCredits.vue'

import { defineAsyncComponent } from 'vue'

import dayjs from 'dayjs'
const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})

export default {
  name: 'UserBilling',
  components: {
    User,
    Loader,
    UserCredits,
    ReferredNewUserCredits
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  data () {
    return {
      cancelSubscriptionVisible: false,
      isCancelled: false,
      dialogHeight: null,
      info: {
        price: 0,
        period: 'month',
        cardType: '',
        cardLast4: '',
        cardExpMonth: 0,
        cardExpYear: 0,
        nextBillingDate: ''
      },
      loading: {
        gettingBillingInfo: false,
        isCancelling: false
      }
    }
  },
  computed: {
    user () { return this.$store.state.currentUser },
    isUpgraded () {
      if (this.isCancelled) { return }
      if (this.downgradeAt) { return }
      return this.user.isUpgraded
    },
    downgradeAt () {
      const date = this.info.downgradeAt
      if (!date) { return }
      return dayjs(date).format('MMM D, YYYY')
    },
    isAwaitingDowngrade () {
      return this.isCancelled || this.downgradeAt
    }
  },
  methods: {
    toggleCancelSubscriptionVisible () {
      if (this.loading.isCancelling) { return }
      this.cancelSubscriptionVisible = !this.cancelSubscriptionVisible
    },
    triggerUpgradeUserIsVisible () {
      this.$store.commit('closeAllDialogs', 'UserBilling.triggerUpgradeUserIsVisible')
      this.$store.commit('triggerUpgradeUserIsVisible')
    },
    async cancelSubscription () {
      this.loading.isCancelling = true
      try {
        await this.$store.dispatch('api/cancelSubscription', {
          userId: this.$store.state.currentUser.id
        })
        this.$store.commit('addNotification', { message: 'Your account has been downgraded, and you will no longer be charged', type: 'success' })
        this.isCancelled = true
      } catch (error) {
        console.error('🚒', error)
        this.$store.commit('addNotification', { message: '(シ_ _)シ Something went wrong, Please try again or contact support', type: 'danger' })
      }
      this.loading.isCancelling = false
    },
    async getBillingInfo () {
      this.loading.gettingBillingInfo = true
      try {
        const info = await this.$store.dispatch('api/subscriptionInfo', {
          userId: this.$store.state.currentUser.id
        })
        this.loading.gettingBillingInfo = false
        if (info.message === '🌷free') {
          this.info.downgradeAt = info.downgradeAt
          return
        }
        if (!info.subscription) {
          this.info.downgradeAt = info.downgradeAt
          return
        }
        const card = info.paymentMethod.card
        const plan = info.subscription.items.data[0].plan
        this.info = {
          price: plan.amount / 100,
          period: plan.interval,
          cardType: utils.capitalizeFirstLetter(card.brand),
          cardLast4: card.last4,
          cardExpMonth: card.exp_month,
          cardExpYear: card.exp_year,
          nextBillingDate: info.nextBillingDate,
          downgradeAt: info.downgradeAt
        }
        console.log('🎡 billing info', this.info)
      } catch (error) {
        console.error('🚒', error)
        this.$store.commit('addNotification', { message: '(シ_ _)シ Something went wrong, Please try again or contact support', type: 'danger' })
        this.loading.gettingBillingInfo = false
      }
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.getBillingInfo()
        this.isCancelled = false
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.user-billing
  max-height calc(100vh - 190px)
  overflow auto
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
  .row
    margin-top 10px
</style>
