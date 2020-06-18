<template lang="pug">
dialog.upgrade-user.narrow(v-if="visible" :open="visible" @click.stop)
  section
    //- p
    //-   User(:user="user" :isClickable="false" :hideYouLabel="true" :key="user.id")
    //-   span Upgrade Account
    //- p 4$/month to be able to create unlimited cards

    p Upgrade your account to create unlimited cards
    .badge.info 4$/month

    form(@submit.prevent="signIn")
      input(type="text" placeholder="Name" required v-model="name" @input="clearErrors")
      input(type="email" placeholder="Email" required v-model="email" @input="clearErrors")
      input(type="text" placeholder="Card Number" inputmode="numeric" pattern="[0-9\s]{13,19}" maxlength="20" autocomplete="off" required v-model="cardNumber" @input="clearErrors")
      input(type="text" placeholder="CVC" inputmode="numeric" pattern="[0-9\s]{13,19}" autocomplete="off" maxlength="4" required v-model="cardCVC" @input="clearErrors")
      select(type="text" placeholder="cardExpirationMonth" required v-model="cardExpirationMonth" @input="clearErrors")
        option(value="1" selected) 1
        option(value="2") 2
        option(value="3") 3
      span /
      select(type="text" placeholder="cardExpirationYear" required v-model="cardExpirationYear" @input="clearErrors")
        option(value="2020" selected) 2020
        option(value="2021") 2021
        option(value="2022") 2022
      //- stripetoken derived

      //- .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      //- .badge.danger(v-if="error.signInCredentials") Incorrect email or password
      //- .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes

      button(type="submit" :class="{active : loading.paymentProcessing}")
        span Upgrade Account
        Loader(:visible="loading.paymentProcessing")

    p You'll be billed immediately and then each month. You can cancel at anytime.
    //- and then every 30 days (stripe recurring)

  section

    p Payment processed by Stripe

</template>

<script>
// import utils from '@/utils.js'
// import User from '@/components/User.vue'
import Loader from '@/components/Loader.vue'

export default {
  name: 'UpgradeUser',
  components: {
    // User: () => import('@/components/User.vue'),
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      name: '',
      email: '',
      cardNumber: '',
      cardCVC: '',
      cardExpirationMonth: '',
      cardExpirationYear: '',
      loading: {
        paymentProcessing: false
      },
      error: {
        unknownServerError: false
      }
    }
  },
  // created () {
  //   this.$store.subscribe((mutation, state) => {
  // if (mutation.type === 'closeAllDialogs') {
  //   this.contactIsVisible = false
  //   this.whatsNewIsVisible = false
  //   this.addToHomescreenIsVisible = false
  // }
  //   })
  // },
  // async mounted () {
  //   this.isAndroid = utils.isAndroid()
  // },
  computed: {
    user () {
      return this.$store.state.currentUser
    }
  // newStuffIsUpdated () { return this.$store.state.newStuffIsUpdated }
  },
  methods: {
    clearErrors () {
    }
  }
  // watch: {
  //   visible (visible) {
  //     if (visible) {
  //       if (this.email) { return }
  //       const userEmail = this.user.email
  //       console.log('userEmail', userEmail)
  //       this.email = userEmail
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
.upgrade-user
  max-height calc(100vh - 175px)
  overflow auto
  .user
    margin-right 6px
    vertical-align middle
    // .user-avatar
    //   width 16px
    //   height 15px

  button[type=submit]
    margin-top 10px
  // .row
  //   margin-bottom 10px
//   left initial
//   right 8px
//   top calc(100% - 6px) !important
</style>
