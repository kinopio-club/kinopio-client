<template lang="pug">
dialog.upgrade-user.narrow(v-if="visible" :open="visible" @click.stop)
  section
    p Upgrade your account for unlimited cards
    .summary
      User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
      .badge.info $4/month

    //- name:           someone
    //- card number:    4242424242424242, 4242 4242 4242 4242
    //- expiration:     11/22 any date in the future
    //- card cvc:       123 any three digits
    //- https://stripe.com/docs/testing#international-cards

    input(type="email" autocomplete="email" placeholder="Email" required v-model="email" @input="clearErrors")
    input(type="text" placeholder="Name on Card" required v-model="name" @input="clearErrors")
    //- Stripe Elements
    div(ref="cardNumber")
    div(ref="cardExpiry")
    div(ref="cardCvc")
    //- TODO on elements change events, clearerrors()

    //- ???zip/postal unless automatically
    //- input(type="text" placeholder="Zip or Postal Code" required maxlength="6" v-model="zipOrPostalCode" @input="clearErrors")

    .loading-stripe(v-if="!loading.stripeElementsIsMounted")
      Loader(:visible="true")

    .badge.danger(v-if="error.allFieldsAreRequired") All fields are required
    .badge.danger(v-if="error.stripeError") {{error.stripeErrorMessage}}
    .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support

    button(@click="subscribe" :class="{active : loading.subscriptionIsBeingCreated}")
      span Upgrade Account
      Loader(:visible="loading.subscriptionIsBeingCreated")

    p You'll be billed immediately and then each month. You can cancel at anytime.

  section
    img.icon(src="@/assets/lock.svg")
    span Payments by Stripe

</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

// https://stripe.com/docs/billing/subscriptions/fixed-price
import { loadStripe } from '@stripe/stripe-js/pure'

let stripePublishableKey, priceId, stripe, elements, cardNumber, cardExpiry, cardCvc
let customer, paymentMethod, subscription
if (process.env.NODE_ENV === 'development') {
  stripePublishableKey = 'pk_test_51Gv55TL1W0hlm1mqF9VvEevFCGr53d0eDUx0VD1tPA8ESuGdTceeoK0hAWaELCmTqkbt3wZqffT0mN41X0Jmlxpe00en3VmODJ'
  priceId = 'price_1GxN5tL1W0hlm1mqqbYQjWFz'
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
    visible: Boolean
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
    clearErrors () {
      this.error.unknownServerError = false
      this.error.allFieldsAreRequired = false
      this.error.stripeError = false
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
          invalid: { color: 'black' } // todo change if dark theme
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
      // card expiry
      options.placeholder = 'MM/YY'
      cardExpiry = elements.create('cardExpiry', options)
      cardExpiry.mount(this.$refs.cardExpiry)
      cardExpiry.on('change', this.clearErrors)
      // card cvc
      options.placeholder = 'CVC'
      cardCvc = elements.create('cardCvc', options)
      cardCvc.mount(this.$refs.cardCvc)
      cardCvc.on('change', this.clearErrors)
      this.loading.stripeElementsIsMounted = true
    },
    async loadStripe () {
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
        userId: this.$store.state.currentUser.id,
        name: this.$store.state.currentUser.name
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
        card: cardNumber
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
      return result
    },

    async updateSubscription () {
      const result = await this.$store.dispatch('api/updateSubscription', {
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id
      })
      console.log('🎡 subscribed', result)
      this.$store.commit('currentUser/isUpgraded', true)
      this.$store.commit('notifyCurrentUserIsUpgraded', true)
      this.$emit('closeDialog')
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
        // TODO Errors
        // Some payment methods require a customer to be on session
        // to complete the payment process. Check the status of the
        // payment intent to handle these actions.
        // 🎃 => handlePaymentThatRequiresCustomerAction)
        // If attaching this card to a Customer object succeeds,
        // but attempts to charge the customer fail, you
        // get a requires_payment_method error.
        // 🎃 => handleRequiresPaymentMethod)
        if (subscription.status === 'active') {
          await this.updateSubscription()
        } else {
          console.log('🎡 error', customer, paymentMethod, subscription)
          if (!this.error.stripeError) {
            this.error.unknownServerError = true
          }
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
  .user
    margin-right 6px
    vertical-align middle
  .summary
    margin-top 10px
    margin-bottom 10px
  .loading-stripe,
  .badge.danger
    margin-bottom 10px
</style>
