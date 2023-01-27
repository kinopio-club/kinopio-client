<template lang="pug">
dialog.upgrade-user(v-if="visible" :open="visible" @click.left.stop @keydown.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    .row
      p Upgrade your account for unlimited cards and uploads
    .row
      .segmented-buttons
        button(:class="{active: priceIsMonthly}" @click.left="togglePriceIsMonthly(true)") $6/month
        button(:class="{active: !priceIsMonthly}" @click.left="togglePriceIsMonthly(false)") $60/year
          .badge.label-badge -17%
    .should-sign-up(v-if="!currentUserIsSignedIn")
      p To upgrade your account, you'll need to sign up first
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    UpgradeUserSubscribe(:visible="currentUserIsSignedIn" :priceIsMonthly="priceIsMonthly" :price="price")
  section(v-if="currentUserIsSignedIn")
    p
      img.icon(src="@/assets/lock.svg")
      span Payments securely processed by Stripe. Card info is not sent to Kinopio.

</template>

<script>
import UpgradeUserSubscribe from '@/components/UpgradeUserSubscribe.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'UpgradeUser',
  components: {
    Loader,
    UpgradeUserSubscribe
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
      dialogHeight: null,
      priceIsMonthly: true
    }
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    price () {
      let price
      if (this.priceIsMonthly) {
        price = {
          amount: '$6',
          period: 'month',
          id: 'price_1L2GvBDFIr5ywhwobbE35dhA'
        }
      } else {
        price = {
          amount: '$60',
          period: 'year',
          id: 'price_1L2ErWDFIr5ywhwodsKxEEAq'
        }
      }
      if (import.meta.env.MODE === 'development') {
        if (this.priceIsMonthly) {
          price.id = 'price_1L7200DFIr5ywhwoAJGkA7yK'
        } else {
          price.id = 'price_1L720NDFIr5ywhwo0wS5PWAv'
        }
      }
      return price
    }
  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.commit('closeAllDialogs', 'UpgradeUser.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    togglePriceIsMonthly (value) {
      this.priceIsMonthly = value
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.upgrade-user
  overflow auto
  max-height calc(100vh - 210px)
  left initial
  right 8px
  .badge
    display inline-block
  button
    position relative
  .label-badge
    color var(--primary-background)
    font-size 12px
    min-height initial
    position absolute
    left initial
    right -15px
    top -6px
    margin 0
  p
    color var(--primary)

</style>
