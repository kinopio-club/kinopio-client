<template lang="pug">
dialog.donate.narrow(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section
    p option, one time fee
    p support
  section
    .row
      .segmented-buttons
        button $5
        button $20
        button $50
        button Custom
  //- section if currentAmount

</template>

<script>
export default {
  name: 'Donate',
  components: {
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
    // kinopioDomain () { return utils.kinopioDomain() },
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

</style>
