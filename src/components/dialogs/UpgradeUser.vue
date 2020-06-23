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
    //- ? zip or postal:  11221, m1b5m6
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

    button(@click="processPayment" :class="{active : loading.paymentIsProcessing}")
      span Upgrade Account
      Loader(:visible="loading.paymentIsProcessing")

    p You'll be billed immediately and then each month. You can cancel at anytime.

  section
    img.icon(src="@/assets/lock.svg")
    span Payments by Stripe

</template>

<script>
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import { loadStripe } from '@stripe/stripe-js/pure'

let stripePublishableKey, stripe, elements, cardNumber, cardExpiry, cardCvc, paymentIntent
if (process.env.NODE_ENV === 'development') {
  stripePublishableKey = 'pk_test_51Gv55TL1W0hlm1mqF9VvEevFCGr53d0eDUx0VD1tPA8ESuGdTceeoK0hAWaELCmTqkbt3wZqffT0mN41X0Jmlxpe00en3VmODJ'
} else {
  stripePublishableKey = 'pk_live_51Gv55TL1W0hlm1mq80jsOLNIJEgtPei8OuuW1v9lFV6KbVo7yme2nERsysqYiIpt1BrRvAi860IATF103QNI6FDn00wjUlhOvQ'
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
        paymentIsProcessing: false,
        stripeIsLoading: true,
        isGettingPaymentIntent: true,
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
      if (this.loading.isGettingPaymentIntent || this.loading.stripeIsLoading) { return }
      console.log('💸', paymentIntent.client_secret)
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
    async getPaymentIntent () {
      this.loading.isGettingPaymentIntent = true
      paymentIntent = await this.$store.dispatch('api/getPaymentIntent')
      this.loading.isGettingPaymentIntent = false
      this.mountStripeElements()
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
    async processPayment () {
      this.clearErrors()
      if (!this.name || !this.email) {
        this.error.allFieldsAreRequired = true
        this.loading.paymentIsProcessing = false
        return
      }
      try {
        this.loading.paymentIsProcessing = true
        const result = await stripe.confirmCardPayment(paymentIntent.client_secret, {
          payment_method: {
            card: cardNumber,
            billing_details: {
              name: this.name,
              email: this.email
            },
            metadata: {
              userId: this.$store.state.currentUser.id
            }
          }
        })
        console.log('🎡 stripe result', result)
        if (result.error) {
          this.error.stripeError = true
          this.error.stripeErrorMessage = utils.removeTrailingPeriod(result.error.message)
        }
        // if (result.paymentIntent)
        // TODO handle success, this.upgradeUser()
        // - close dialog, show success notification w instructions , local user.isUpgraded -> userdetails has success badge 'premium?'
        // - stripe webhook = user.isupgraded (userid), or send user update operation

        // {
        //   "id": "pm_1GxEcj2eZvKYlo2C9StYHZfp",
        //   "object": "payment_method",
        //   "billing_details": {
        //     "address": {
        //       "city": null,
        //       "country": null,
        //       "line1": null,
        //       "line2": null,
        //       "postal_code": null,
        //       "state": null
        //     },
        //     "email": null,
        //     "name": null,
        //     "phone": null
        //   },
        //   "card": {
        //     "brand": "visa",
        //     "checks": {
        //       "address_line1_check": null,
        //       "address_postal_code_check": null,
        //       "cvc_check": "pass"
        //     },
        //     "country": "US",
        //     "exp_month": 8,
        //     "exp_year": 2021,
        //     "fingerprint": "Xt5EWLLDS7FJjR1c",
        //     "funding": "credit",
        //     "generated_from": null,
        //     "last4": "4242",
        //     "networks": {
        //       "available": [
        //         "visa"
        //       ],
        //       "preferred": null
        //     },
        //     "three_d_secure_usage": {
        //       "supported": true
        //     },
        //     "wallet": null
        //   },
        //   "created": 1592928325,
        //   "customer": null,
        //   "livemode": false,
        //   "metadata": {},
        //   "type": "card"
        // }
      } catch (error) {
        console.error('🚒', error)
        this.error.unknownServerError = true
      }
      this.loading.paymentIsProcessing = false
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.getPaymentIntent()
        this.loadStripe()
        // this.email = this.$store.state.currentUser.email
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
