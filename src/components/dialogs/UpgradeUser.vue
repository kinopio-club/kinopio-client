<template lang="pug">
dialog.upgrade-user.narrow(v-if="visible" :open="visible" @click.stop)
  section
    p Upgrade your account to create unlimited cards
    .summary
      User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
      .badge.info 4$/month

    //- testing
    //- card number: 4242424242424242
    //- card cvc: any three digits
    //- expiration: any date in the future

    form(@submit.prevent="validateAndProcessPayment")
      input(type="text" placeholder="Name" required v-model="name" @input="clearErrors")
      input(type="text" placeholder="Card Number" required inputmode="numeric" maxlength="20" v-model="cardNumber" @input="clearErrors")
      input(type="text" placeholder="CVC" required inputmode="numeric" maxlength="4"  v-model="cardCVC" @input="clearErrors")
      input(type="text" placeholder="MM/YY" required inputmode="numeric" maxlength="5" v-model="cardExpiration" @input="clearErrors")
      button(type="submit" :class="{active : loading.stripeIsChecking}")
        span Upgrade Account
        Loader(:visible="loading.stripeIsChecking")
    p You'll be billed immediately and then each month. You can cancel at anytime.

  section
    p Payment processed by Stripe

</template>

<script>
import Loader from '@/components/Loader.vue'

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
      cardNumber: '',
      cardCVC: '',
      cardExpiration: '',
      loading: {
        stripeIsChecking: false
      },
      error: {
        unknownServerError: false
      }
    }
  },
  computed: {
    user () { return this.$store.state.currentUser },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    clearErrors () {
      this.unknownServerError = false
    },
    async validateAndProcessPayment (event) {
      event.preventDefault()
      console.log(this.name, this.cardNumber, this.cardCVC, this.cardExpiration)
      console.log('validate fields, prevented default', this.loading.stripeIsChecking)
      if (this.loading.stripeIsChecking) { return }
      this.loading.stripeIsChecking = true
      // then send to stripe for token

      // after await
      // this.loading.stripeIsChecking = false
    }
  }
}
</script>

<style lang="stylus">
.upgrade-user
  max-height calc(100vh - 175px)
  overflow auto
  .user
    margin-right 6px
    vertical-align middle
  .summary
    margin-top 10px
    margin-bottom 10px
</style>
