<template lang="pug">
dialog.narrow.user-billing(v-if="visible" :open="visible" @click.stop)
  section
    p Billing
  section
    .summary
      User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
      p
        span You are paying
          .badge.info $4/month

    p Thanks for supporting Kinopio!
    button
      img.icon(src="@/assets/remove.svg")
      span Cancel Subscription

</template>

<script>
export default {
  name: 'UserBilling',
  components: {
    User: () => import('@/components/User.vue')
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      cancelSubscriptionVisible: true
    }
  },
  computed: {
    user () { return this.$store.state.currentUser }
  },
  methods: {
    toggleCancelSubscriptionVisible () {
      this.toggleCancelSubscriptionVisible = !this.toggleCancelSubscriptionVisible
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
</style>
