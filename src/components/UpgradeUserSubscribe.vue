<template lang="pug">
.upgrade-user-subscribe(v-if="currentUserIsSignedIn")
  //- https://stripe.com/docs/testing
  //- name on card:   someone
  //- email:          hi@pirijan.com
  //- card number:    4242424242424242
  //- expiration:     11/22 any date in the future
  //- card cvc:       123 any three digits
  input(type="text" placeholder="Name on Card" required v-model="name" @input="clearErrors")
  input(type="email" autocomplete="email" placeholder="Email" required v-model="email" @input="clearErrors")
  //- countries
  .row
    .country-emoji
      span {{ currentCountryEmoji }}
    select(name="countries" v-model="currentCountryName")
      option(value="United States") United States
      option(value="Other") Other
      template(v-for="name in countryNames")
        option(:value="name") {{name}}

  //- address
  section.sub-section(v-if="countryRequiresAddress")
    .row
      p Address is required for payments from {{currentCountryName}}
    input(type="text" name="address-line-1" placeholder="Address" v-model="addressLine1" @input="clearErrors")
    input(type="text" name="address-line-2" placeholder="Address Line 2 (optional)" v-model="addressLine2" @input="clearErrors")
    input(type="text" name="city" placeholder="City" v-model="addressCity" @input="clearErrors")
    input(type="text" name="state" placeholder="State" v-model="addressState" @input="clearErrors")
    input(type="text" name="zip" placeholder="Zip Code" v-model="addressZip" @input="clearErrors")

  //- Stripe Elements
  .loading-stripe(v-if="!loading.stripeElementsIsMounted")
    Loader(:visible="true")
  div(ref="cardNumber")
  div(ref="cardExpiry")
  div(ref="cardCvc")

  .badge.danger(v-if="error.allFieldsAreRequired") All fields are required
  .badge.danger(v-if="error.stripeError") {{error.stripeErrorMessage}}
  .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support

  .summary
    User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
    .badge.info
      span {{price.amount}}/{{price.period}}

  button(@click.left="subscribe" :class="{active : loading.subscriptionIsBeingCreated}")
    span Upgrade Account
    Loader(:visible="loading.subscriptionIsBeingCreated")

  p You'll be billed {{price.amount}} immediately and then each {{price.period}}. You can cancel anytime.

</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'
import { defineAsyncComponent } from 'vue'

import { loadStripe } from '@stripe/stripe-js/pure'
const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})

// https://stripe.com/docs/billing/subscriptions/fixed-price
let stripePublishableKey, stripe, elements, cardNumber, cardExpiry, cardCvc
let customer, paymentMethod, subscription
let invoice, paymentIntent

if (import.meta.env.MODE === 'development') {
  stripePublishableKey = 'pk_test_51IiftNDFIr5ywhwoBAVavNoA1ig4RdmmC73ZEuuuOAPxN5DHJyXsNpNtYhuUN885xoEHmq97HNaqfhJHFQh87IrH00F8eStuuX'
} else {
  stripePublishableKey = 'pk_live_51IiftNDFIr5ywhwo9dUo1W2kZ2dwjWRUVh1QcUJ3YWc9ZAobDziUKWldKbthPtZbiq33kfRHQYrnBhvMlsomfOsB00f6Qvgm3B'
}

export default {
  name: 'UpgradeUserSubscribe',
  components: {
    User,
    Loader
  },
  props: {
    visible: Boolean,
    priceIsMonthly: Boolean,
    price: Object
  },
  mounted () {
    this.loadStripe()
    this.updateCountries()
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
      },
      countries: [],
      countryNames: [],
      currentCountryName: 'United States',
      // if countryRequiresAddress
      addressLine1: '',
      addressLine2: '',
      addressCity: '',
      addressState: '',
      addressZip: ''
    }
  },
  computed: {
    actionLabel () {
      if (this.isAccountUpgrade) {
        return 'Upgrade Account'
      }
      return 'Donate'
    },
    user () { return this.$store.state.currentUser },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    currentCountryEmoji () {
      const name = this.currentCountryName
      const localCountries = [
        {
          name: 'United States',
          emoji: '🇺🇸'
        }, {
          name: 'Other',
          emoji: '🌍󠁧󠁢󠁷󠁬󠁳󠁿'
        }
      ]
      const countries = this.countries.concat(localCountries)
      const country = countries.find(country => country.name === name)
      return country.emoji
    },
    countryRequiresAddress () {
      if (!this.countries.length) { return }
      return this.currentCountryName === 'India'
    },
    countryCode () {
      // https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements
      const codes = [
        {
          name: 'India',
          code: 'IN'
        }
      ]
      const country = codes.find(code => code.name === this.currentCountryName)
      return country.code
    }
  },
  methods: {
    async updateCountries () {
      this.countries = await this.$store.dispatch('api/getCountries')
      this.countryNames = this.countries.map(country => country.name)
    },
    shouldHideFooter (event) {
      const isTouchDevice = this.$store.state.isTouchDevice
      if (!isTouchDevice) { return }
      this.$store.commit('shouldHideFooter', true)
    },
    clearErrors () {
      this.error.unknownServerError = false
      this.error.allFieldsAreRequired = false
      this.error.stripeError = false
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('closeAllDialogs', 'UpgradeUser.triggerSignUpOrInIsVisible')
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
      let paymentInfo = {
        type: 'card',
        card: cardNumber,
        billing_details: {
          name: this.name,
          email: this.email
        }
      }
      // https://stripe.com/docs/api/payment_methods/create#create_payment_method-billing_details
      if (this.countryRequiresAddress) {
        const address = {
          city: this.addressCity,
          country: this.countryCode,
          line1: this.addressLine1,
          line2: this.addressLine2,
          postal_code: this.addressZip,
          state: this.addressState
        }
        paymentInfo.billing_details.address = address
      }
      const result = await stripe.createPaymentMethod(paymentInfo)
      console.log('🎡 stripe payment method', paymentInfo, result)
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
        priceId: this.price.id
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
      this.$store.commit('notifyCardsCreatedIsOverLimit', false)
      this.$store.commit('addNotification', { message: 'Your account has been upgraded. Thank you for supporting independent, ad-free, sustainable software', type: 'success' })
      this.$store.dispatch('closeAllDialogs', 'Subscribe')
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
    showErrorAllFieldsAreRequired () {
      this.error.allFieldsAreRequired = true
      this.loading.subscriptionIsBeingCreated = false
    },
    async subscribe () {
      this.clearErrors()
      if (!this.name || !this.email) {
        this.showErrorAllFieldsAreRequired()
        return
      }
      if (this.countryRequiresAddress) {
        if (!this.addressLine1 || !this.addressCity || !this.addressState || !this.addressZip) {
          this.showErrorAllFieldsAreRequired()
          return
        }
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
  }
}
</script>

<style lang="stylus">
.upgrade-user-subscribe
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
  select
    width 100%
    margin-left 6px
  .sub-section
    margin-bottom 10px
</style>
