<template lang="pug">
dialog.upgrade-user.narrow(v-if="visible" :open="visible" @click.stop @keydown.stop :class="{'right-side': dialogOnRight}")
  section
    p Upgrade your account for unlimited cards and uploads
    .summary
      User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
      .badge.info $4/month

    .should-sign-up(v-if="!currentUserIsSignedIn")
      p To upgrade your account, you'll need to sign up first
      button(@click="triggerSignUpOrInIsVisible") Sign Up or In

    .billing(v-if="currentUserIsSignedIn")
      //- https://stripe.com/docs/testing
      //- name on card:   someone
      //- email:          hi@pirijan.com
      //- card number:    4242424242424242
      //- expiration:     11/22 any date in the future
      //- card cvc:       123 any three digits
      input(type="text" placeholder="Name on Card" required v-model="name" @input="clearErrors")
      input(type="email" autocomplete="email" placeholder="Email" required v-model="email" @input="clearErrors")
      //- Stripe Elements
      .loading-stripe(v-if="!loading.stripeElementsIsMounted")
        Loader(:visible="true")
      div(ref="cardNumber")
      div(ref="cardExpiry")
      div(ref="cardCvc")

      .badge.danger(v-if="error.allFieldsAreRequired") All fields are required
      .badge.danger(v-if="error.stripeError") {{error.stripeErrorMessage}}
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support

      button(@click="subscribe" :class="{active : loading.subscriptionIsBeingCreated}")
        span Upgrade Account
        Loader(:visible="loading.subscriptionIsBeingCreated")

      p You'll be billed immediately and then each month. You can cancel at anytime.

  section(v-if="currentUserIsSignedIn")
    img.icon(src="@/assets/lock.svg")
    span Payments by Stripe

</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import { loadStripe } from '@stripe/stripe-js/pure'

// https://stripe.com/docs/billing/subscriptions/fixed-price

let stripePublishableKey, priceId, stripe, elements, cardNumber, cardExpiry, cardCvc
let customer, paymentMethod, subscription
let invoice, paymentIntent
if (process.env.NODE_ENV === 'development') {
  stripePublishableKey = 'pk_test_51Gv55TL1W0hlm1mqF9VvEevFCGr53d0eDUx0VD1tPA8ESuGdTceeoK0hAWaELCmTqkbt3wZqffT0mN41X0Jmlxpe00en3VmODJ'
  priceId = 'price_1Gy3QWL1W0hlm1mqKLnVVNAd'
} else {
  stripePublishableKey = 'pk_live_51Gv55TL1W0hlm1mq80jsOLNIJEgtPei8OuuW1v9lFV6KbVo7yme2nERsysqYiIpt1BrRvAi860IATF103QNI6FDn00wjUlhOvQ'
  priceId = 'price_1Gv5OfL1W0hlm1mqpTfR61iZ'
}

export default {
  name: 'UpgradeUser',
  components: {
    User: () => import('@/components/User.vue'),
    Loader
  },
  props: {
    visible: Boolean,
    dialogOnRight: Boolean
  },
  data () {
    return {
      name: '',
      email: '',
      loading: {
        subscriptionIsBeingCreated: false,
        stripeIsLoading: true,
        stripeElementsIsMounted: false
      },
      error: {
        unknownServerError: false,
        allFieldsAreRequired: false,
        stripeError: false,
        stripeErrorMessage: ''
      }
    }
  },
  computed: {
    user () { return this.$store.state.currentUser },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    shouldHideFooter (event) {
      this.$store.commit('shouldHideFooter', true)
    },
    clearErrors () {
      this.error.unknownServerError = false
      this.error.allFieldsAreRequired = false
      this.error.stripeError = false
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    mountStripeElements () {
      if (this.loading.stripeIsLoading) { return }
      elements = stripe.elements({
        fonts: [{
          family: 'OsakaMono-Kinopio',
          src: 'url(https://kinopio-email.us-east-1.linodeobjects.com/OsakaMono-Kinopio.woff2)',
          weight: 'normal',
          style: 'normal'
        }]
      })
      let options = {
        style: {
          base: { fontFamily: "'OsakaMono-Kinopio', monospace" },
          invalid: { color: 'black' } // change if dark theme
        },
        classes: {
          base: 'stripe-element',
          invalid: 'stripe-element-invalid'
        }
      }
      // card number
      options.placeholder = 'Card Number'
      cardNumber = elements.create('cardNumber', options)
      cardNumber.mount(this.$refs.cardNumber)
      cardNumber.on('change', this.clearErrors)
      cardNumber.on('focus', this.shouldHideFooter)
      // card expiry
      options.placeholder = 'MM/YY'
      cardExpiry = elements.create('cardExpiry', options)
      cardExpiry.mount(this.$refs.cardExpiry)
      cardExpiry.on('change', this.clearErrors)
      cardExpiry.on('focus', this.shouldHideFooter)
      // card cvc
      options.placeholder = 'CVC'
      cardCvc = elements.create('cardCvc', options)
      cardCvc.mount(this.$refs.cardCvc)
      cardCvc.on('change', this.clearErrors)
      cardCvc.on('focus', this.shouldHideFooter)
      this.loading.stripeElementsIsMounted = true
    },
    async loadStripe () {
      if (!this.currentUserIsSignedIn) { return }
      this.loading.stripeIsLoading = true
      if (!this.$store.state.stripeIsLoaded) {
        this.$store.commit('stripeIsLoaded', true)
        loadStripe.setLoadParameters({ advancedFraudSignals: false })
      }
      stripe = await loadStripe(stripePublishableKey)
      this.loading.stripeIsLoading = false
      this.mountStripeElements()
    },
    async createCustomer () {
      const result = await this.$store.dispatch('api/createCustomer', {
        email: this.email,
        name: this.name,
        metadata: {
          userId: this.$store.state.currentUser.id,
          userName: this.$store.state.currentUser.name
        }
      })
      console.log('🎡 stripe customer', result)
      if (result.type === 'StripeInvalidRequestError') {
        this.error.stripeError = true
        this.error.stripeErrorMessage = utils.removeTrailingPeriod(result.raw.message)
      }
      return result
    },
    async createPaymentMethod () {
      const result = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber,
        billing_details: {
          name: this.name,
          email: this.email
        }
      })
      console.log('🎡 stripe payment method', result)
      if (result.error) {
        this.error.stripeError = true
        this.error.stripeErrorMessage = utils.removeTrailingPeriod(result.error.message)
      }
      return result.paymentMethod
    },
    async createSubscription () {
      const result = await this.$store.dispatch('api/createSubscription', {
        customerId: customer.id,
        paymentMethodId: paymentMethod.id,
        priceId
      })
      console.log('🎡 stripe subscription', result)
      if (result.error) {
        this.error.stripeError = true
        this.error.stripeErrorMessage = utils.removeTrailingPeriod(result.error.message)
      }
      if (result.type === 'StripeCardError') {
        this.error.stripeError = true
        this.error.stripeErrorMessage = utils.removeTrailingPeriod(result.raw.message)
      }
      return result
    },
    async handleSubscriptionSuccess () {
      const stripeIds = {
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        stripePaymentMethodId: paymentMethod.id
      }
      const result = await this.$store.dispatch('api/updateSubscription', stripeIds)
      console.log('🎡 subscribed', result)
      cache.saveStripeIds(stripeIds)
      this.loading.subscriptionIsBeingCreated = false
      this.$store.commit('currentUser/isUpgraded', true)
      this.$store.commit('addNotification', { message: 'Your account has been upgraded. Thank you for supporting independent, ad-free, sustainable software', type: 'success' })
      this.$emit('closeDialog')
    },
    paymentIntent () {
      if (invoice) {
        return invoice.payment_intent
      } else {
        return subscription.latest_invoice.payment_intent
      }
    },
    async handleCustomerActionRequired () {
      if (paymentIntent.status === 'requires_action') {
        const result = await stripe.confirmCardPayment(paymentIntent.client_secret, { payment_method: paymentMethod.id })
        if (result.error) {
          console.log('🎡 confirm card payment', result)
          this.loading.subscriptionIsBeingCreated = false
          this.error.stripeError = true
          this.error.stripeErrorMessage = utils.removeTrailingPeriod(result.error.message)
          throw result
        } else if (result.paymentIntent.status === 'succeeded') {
          await this.handleSubscriptionSuccess()
        }
      }
    },
    async handlePaymentMethodRequired () {
      if (paymentIntent.status === 'requires_payment_method') {
        this.loading.subscriptionIsBeingCreated = false
        this.error.stripeError = true
        this.error.stripeErrorMessage = 'Your credit card was declined. Please try again with a different card'
      }
    },
    async subscribe () {
      this.clearErrors()
      if (!this.name || !this.email) {
        this.error.allFieldsAreRequired = true
        this.loading.subscriptionIsBeingCreated = false
        return
      }
      this.loading.subscriptionIsBeingCreated = true
      try {
        customer = await this.createCustomer()
        paymentMethod = await this.createPaymentMethod()
        subscription = await this.createSubscription()
        invoice = subscription.latest_invoice
        paymentIntent = this.paymentIntent()
        await this.handleCustomerActionRequired()
        await this.handlePaymentMethodRequired()
        if (subscription.status === 'active') {
          await this.handleSubscriptionSuccess()
        }
      } catch (error) {
        console.error('🚒', error)
        if (!this.error.stripeError) {
          this.error.unknownServerError = true
        }
      }
      this.loading.subscriptionIsBeingCreated = false
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.loadStripe()
      }
    }
  }
}
</script>

<style lang="stylus">
.upgrade-user
  overflow auto
  max-height calc(100vh - 210px)
  &.right-side
    left initial
    right 8px
  .user
    margin-right 6px
    vertical-align middle
  .summary
    margin-top 10px
    margin-bottom 10px
  .badge
    display inline-block
  .loading-stripe,
  .badge.danger
    margin-bottom 10px
</style>
