<template lang="pug">
dialog.upgrade-user(v-if="visible" :open="visible" @click.left.stop @keydown.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    .row
      p Upgrade your account for unlimited cards and uploads
    .row
      .segmented-buttons
        button(:class="{active: period === 'month'}" @click.left="updatePeriod('month')") ${{monthlyPrice.amount}}/month
        button(:class="{active: period === 'year'}" @click.left="updatePeriod('year')") ${{yearlyPrice.amount}}/year
          .badge.label-badge -{{yearlyDiscount}}%
    DiscountRow
    .should-sign-up(v-if="!currentUserIsSignedIn")
      p To upgrade your account, you'll need to sign up first
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    //- Payment
    UpgradeUserStripe(:visible="stripeIsVisible" :price="currentPrice")
    UpgradeUserApple(:visible="appleIsVisible" :price="currentPrice")
  section(v-if="currentUserIsSignedIn")
    p
      img.icon(src="@/assets/lock.svg")
      span Payments securely processed by {{paymentProcessor}}. Card info is not sent to Kinopio.
</template>

<script>
import UpgradeUserStripe from '@/components/UpgradeUserStripe.vue'
import UpgradeUserApple from '@/components/UpgradeUserApple.vue'
import DiscountRow from '@/components/DiscountRow.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

export default {
  name: 'UpgradeUser',
  components: {
    Loader,
    UpgradeUserStripe,
    UpgradeUserApple,
    DiscountRow
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
      period: 'month' // year, life
    }
  },
  computed: {
    isSecureAppContextIOS () { return consts.isSecureAppContextIOS },
    stripeIsVisible () { return this.currentUserIsSignedIn && !this.isSecureAppContextIOS },
    appleIsVisible () { return this.currentUserIsSignedIn && this.isSecureAppContextIOS },
    paymentProcessor () {
      if (this.isSecureAppContextIOS) {
        return 'Apple'
      } else {
        return 'Stripe'
      }
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    currentPrice () { return consts.price(this.period) },
    monthlyPrice () { return consts.price('month') },
    yearlyPrice () { return consts.price('year') },
    yearlyDiscount () {
      const base = this.monthlyPrice.amount * 12
      const yearly = this.yearlyPrice.amount
      // https://www.calculatorsoup.com/calculators/algebra/percent-difference-calculator.php
      const numerator = base - yearly
      const denomenator = (base + yearly) / 2
      const result = (numerator / denomenator) * 100
      return Math.round(result)
    }
  },
  methods: {
    price (period) {
      return consts.price(period)
    },
    updatePeriod (value) {
      this.period = value
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
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
        this.updateDialogHeight()
        this.$store.commit('shouldExplicitlyHideFooter', true)
      } else {
        this.$store.commit('shouldExplicitlyHideFooter', false)
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
