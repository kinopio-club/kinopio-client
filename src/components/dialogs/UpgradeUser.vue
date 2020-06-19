<template lang="pug">
dialog.upgrade-user.narrow(v-if="visible" :open="visible" @click.stop)
  section
    p Upgrade your account for unlimited cards
    .summary
      User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
      .badge.info {{product.price}}/{{product.period}}

    //- name:           someone
    //- card number:    4242424242424242, 4242 4242 4242 4242
    //- expiration:     11/22 any date in the future
    //- card cvc:       123 any three digits
    //- zip or postal:  11221, m1b5m6

    input(type="text" placeholder="Name" required v-model="name" @input="clearErrors")
    div(ref="card")
    div
      Loader(:visible="loading.stripeIsLoading")

    //- TODO errors go here

    button(@click="processPayment" :class="{active : loading.paymentIsProcessing}")
      span Upgrade Account
      Loader(:visible="loading.paymentIsProcessing")

    p You'll be billed immediately and then each month. You can cancel at anytime.

  section
    p Payment processed by Stripe

</template>

<script>
import Loader from '@/components/Loader.vue'
// import utils from '@/utils.js'

import { loadStripe } from '@stripe/stripe-js/pure'

let stripe, elements, card

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
      // card: {
      //   number: '',
      //   exp: '',
      //   exp_month: 0,
      //   exp_year: 0,
      //   cvc: ''
      // },
      product: {
        price: '$4',
        period: 'month'
      },
      loading: {
        paymentIsProcessing: false,
        stripeIsLoading: false
      },
      error: {
        // fieldsAreRequired: false,
        unknownServerError: false,
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
      this.error.stripeError = false
    },
    async loadStripe () {
      let stripePublishableKey
      if (process.env.NODE_ENV === 'development') {
        stripePublishableKey = 'pk_test_51Gv55TL1W0hlm1mqF9VvEevFCGr53d0eDUx0VD1tPA8ESuGdTceeoK0hAWaELCmTqkbt3wZqffT0mN41X0Jmlxpe00en3VmODJ'
      } else {
        stripePublishableKey = 'pk_live_51Gv55TL1W0hlm1mq80jsOLNIJEgtPei8OuuW1v9lFV6KbVo7yme2nERsysqYiIpt1BrRvAi860IATF103QNI6FDn00wjUlhOvQ'
      }
      const stripeIsLoaded = this.$store.state.stripeIsLoaded
      if (!stripeIsLoaded) {
        this.$store.commit('stripeIsLoaded', true)
        loadStripe.setLoadParameters({ advancedFraudSignals: false })
      }
      stripe = await loadStripe(stripePublishableKey)
      elements = stripe.elements()
      card = elements.create('card')
      card.mount(this.$refs.card)
      this.loading.stripeIsLoading = false
    },
    async processPayment () {
      try {
        this.loading.paymentIsProcessing = true
        const token = await stripe.createToken(card, { name: this.name })
        console.log('🌷', token)

        // TODO if the token is cool, then we send the token to the server w the product
      } catch (error) {
        console.error('🚒', error)
        this.error.stripeError = true
        this.error.stripeErrorMessage = error.message
      }
      this.loading.paymentIsProcessing = false
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.loading.stripeIsLoading = true
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
  button
    margin-top 10px
</style>
