<template lang="pug">
dialog.donate.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p optionally, support ongoing development of Kinopio
    p support
      .badge.donor
        span Donor

  section
    .row
      .segmented-buttons
        button $5
        button $20
        button $50
        button Custom
  section
    .row
      User(:user="currentUser" :isClickable="false" :hideYouLabel="true" :key="currentUser.id")
      .badge.info
        span ${{currentAmount}}/once

  //- section if currentAmount
  //- p(v-else) You'll be billed {{currentAmount}} immediately, one time only

</template>

<script>
import User from '@/components/User.vue'

export default {
  name: 'Donate',
  components: {
    User
  },
  props: {
    visible: Boolean
  },
  created () {
  //   this.$store.subscribe((mutation, state) => {
  //     if (mutation.type === 'closeAllDialogs') {
  //       this.closeAllDialogs()
  //     }
  //   })
  },
  mounted () {
  },
  beforeUnmount () {
  },
  data () {
    return {
      currentAmount: 0,
      loading: {
        gettingBillingInfo: false
      }
    }
  },
  computed: {
    currentUser () { return this.$store.state.currentUser }
    // kinopioDomain () { return utils.kinopioDomain() },

    // customAmount
    // customAmountIsValid () {
    // set vmodel
    //   // parseFloat()
    //   // utils round Float
    //   const min = 1
    //   const max = 999999
    // }
  },
  methods: {
    async getBillingInfo () {
      this.gettingBillingInfo = true
      try {
        const info = await this.$store.dispatch('api/subscriptionInfo', {
          userId: this.$store.state.currentUser.id
        })
        console.log('🚛', info, info.subscription.customer)
      } catch (error) {
        console.error('🚒', error)
      }
      this.gettingBillingInfo = false
    }
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
dialog.donate
  overflow auto
  max-height calc(100vh - 210px)
  left initial
  right 8px
  .summary
    margin-top 10px
    margin-bottom 10px
  .badge
    display inline-block
  .user
    margin-right 6px
  .donor
    background-color var(--user-badge-donor)

</style>
