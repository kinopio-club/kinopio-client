<template lang="pug">
dialog.narrow.user-billing(v-if="visible" :open="visible" @click.stop)
  section
    p Billing
  section
    .loading-stripe(v-if="!loading.stripeInfo")
      Loader(:visible="true")
    .summary(v-if="loading.stripeInfo")
      User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
      p
        span You are paying
          .badge.info $4/month

    p Thanks for supporting Kinopio!

    .row
      button(v-if="!cancelSubscriptionVisible" @click="toggleCancelSubscriptionVisible")
        img.icon(src="@/assets/remove.svg")
        span Downgrade to Free
      span(v-if="cancelSubscriptionVisible")
        p
          span blah blah blah 150 cards
        .segmented-buttons
          button(@click="toggleCancelSubscriptionVisible")
            span Cancel
          button.danger(@click="cancelSubscription")
            img.icon(src="@/assets/remove.svg")
            span Downgrade
            Loader(:visible="loading.isCancelling")

</template>

<script>
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
      stripeSubscriptionId: undefined, // get from load stripeinfo call
      loading: {
        stripeInfo: true, // todo default = false
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
      try {
        await this.$store.dispatch('api/cancelSubscription', {
          userId: this.$store.state.currentUser.userId,
          stripeSubscriptionId: this.stripeSubscriptionId || localStorage.getItem('stripeSubscriptionId')
        })
        this.$store.commit('currentUser/isUpgraded', false)
        this.$store.commit('addNotification', { message: 'Your account has been downgraded, and you will no longer be charged' })
      } catch (error) {
        console.error('🚒', error)
        this.$store.commit('addNotification', { message: '(シ_ _)シ Something went wrong, Please try again or contact support', type: 'danger' })
      }
      this.loading.isCancelling = false
    }
  },
  watch: {
    visible (value) {
      if (value) {
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
