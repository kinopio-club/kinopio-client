<template lang="pug">
dialog.upgrade-user(v-if="visible" :open="visible" @click.left.stop="closeChildDialogs" @keydown.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    .row
      p Upgrade your account for unlimited cards and uploads
    .row(v-if="studentDiscountIsAvailable")
      .badge.success Student discount has been applied to yearly plan
    .row
      .segmented-buttons
        button(:class="{active: period === 'month'}" @click.left="updatePeriod('month')") ${{monthlyPrice.amount}}/month
        button(:class="{active: period === 'year'}" @click.left="updatePeriod('year')") ${{yearlyPrice.amount}}/year
          .badge.label-badge -{{yearlyDiscount}}%
    .should-sign-up(v-if="!currentUserIsSignedIn")
      p To upgrade your account, you'll need to sign up first
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    //- Checkout
    template(v-if="currentUserIsSignedIn")
      UpgradeUserStripe(:visible="!isSecureAppContextIOS" :price="currentPrice")
      UpgradeUserApple(:visible="isSecureAppContextIOS" :price="currentPrice")
  section(v-if="currentUserIsSignedIn && !isUpgraded")
    p
      img.icon(src="@/assets/lock.svg")
      span Payments securely processed by {{paymentProcessor}}
</template>

<script>
import UpgradeUserStripe from '@/components/UpgradeUserStripe.vue'
import UpgradeUserApple from '@/components/UpgradeUserApple.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

export default {
  name: 'UpgradeUser',
  components: {
    Loader,
    UpgradeUserStripe,
    UpgradeUserApple
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
    paymentProcessor () {
      if (this.isSecureAppContextIOS) {
        return 'Apple'
      } else {
        return 'Stripe'
      }
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    currentPrice () {
      const isStudentDiscount = this.studentDiscountIsAvailable
      return consts.price(this.period, isStudentDiscount)
    },
    monthlyPrice () { return consts.price('month') },
    studentDiscountIsAvailable () { return this.$store.state.currentUser.studentDiscountIsAvailable },
    yearlyPrice () {
      const isStudentDiscount = this.studentDiscountIsAvailable
      return consts.price('year', isStudentDiscount)
    },
    yearlyDiscount () {
      const base = this.monthlyPrice.amount * 12
      const yearly = this.yearlyPrice.amount
      // https://www.calculatorsoup.com/calculators/algebra/percent-difference-calculator.php
      const numerator = base - yearly
      const denomenator = (base + yearly) / 2
      const result = (numerator / denomenator) * 100
      return Math.round(result)
    },
    isUpgraded () { return this.$store.state.currentUser.isUpgraded }
  },
  methods: {
    price (period) {
      const isStudentDiscount = this.studentDiscountIsAvailable
      return consts.price(period, isStudentDiscount)
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
    },
    closeChildDialogs () {
      this.$store.commit('triggerCloseChildDialogs')
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        console.log('🎡', 'isSecureAppContext', consts.isSecureAppContext, 'isSecureAppContextIOS', consts.isSecureAppContextIOS)
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
dialog.upgrade-user
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
  @media(max-height 650px)
    top -60px !important

</style>
