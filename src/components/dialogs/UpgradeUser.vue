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

    div(ref="card")

    //- form(@submit.prevent="validateAndProcessPayment")
    //-   input(type="text" placeholder="Name" required v-model="name" @input="clearErrors")
    //-   input(type="text" placeholder="Card Number" required inputmode="numeric" maxlength="20" v-model="card.number" @input="clearErrors")
    //-   input(type="text" placeholder="MM/YY" required inputmode="numeric" maxlength="5" v-model="card.exp" @input="clearErrors")
    //-   input(type="text" placeholder="CVC" required inputmode="numeric" maxlength="4"  v-model="card.cvc" @input="clearErrors")
    //-   //- input(type="text" placeholder="Zip or Postal Code" required maxlength="6" v-model="zipOrPostalCode" @input="clearErrors")

    //-   button(type="submit" :class="{active : loading.stripeIsChecking}")
    //-     span Upgrade Account
    //-     Loader(:visible="loading.stripeIsChecking")

    //- p You'll be billed immediately and then each month. You can cancel at anytime.

  section
    p Payment processed by Stripe

</template>

<script>
import Loader from '@/components/Loader.vue'
// import utils from '@/utils.js'

import { loadStripe } from '@stripe/stripe-js/pure'

// let stripe

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
      // name: '',
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
      // loading: {
      //   stripeIsChecking: false
      // },
      error: {
        // fieldsAreRequired: false,
        unknownServerError: false,
        cardExpiryIsInvalidFormat: false
      }
    }
  },
  // mounted () {
  //   console.log('🌹🌹🌹🌹🌹🌹')
  // },
  computed: {
    user () { return this.$store.state.currentUser },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    clearErrors () {
      this.error.unknownServerError = false
      this.error.cardExpiryIsInvalidFormat = false
    },
    // validateCardExpiry () {
    //   const exp = this.card.exp.split('/')
    //   if (exp.length !== 2) {
    //     this.error.cardExpiryIsInvalidFormat = true
    //   } else {
    //     this.card.exp_month = exp[0]
    //     this.card.exp_year = exp[1]
    //   }
    // },

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
      const stripe = await loadStripe(stripePublishableKey)
      const elements = stripe.elements()
      const card = elements.create('card')
      card.mount(this.$refs.card)
    }

    // async validateAndProcessPayment (event) {
    //   event.preventDefault()
    //   // this.validateCardExpiry()
    //   if (this.loading.stripeIsChecking) { return }
    //   this.loading.stripeIsChecking = true
    //   try {
    //     const stripe = await this.loadStripe()
    //     const token = await stripe.createToken(this.card, { name: this.name })
    //     console.log('☀️ stripe token', token)
    //     // ERR You must provide a Stripe Element or a valid token type to create a Token
    //     // if the token is cool, then we send the token to the server w the product
    //   } catch (error) {
    //     console.error('🚒', error)
    //   }
    //   this.loading.stripeIsChecking = false
    // }
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
</style>
