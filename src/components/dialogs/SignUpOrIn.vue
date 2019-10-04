<template lang="pug">
dialog.narrow.sign-up-or-in(v-if="visible" :open="visible")
  section
    .segmented-buttons
      button(@click="showIsSigningUp" :class="{active : isSigningUp}") Sign Up
      button(@click="hideIsSigningUp" :class="{active : !isSigningUp}") Sign In
  section(v-if="isSigningUp")
    .row
      p Create an account to share your spaces and access them anywhere
    form(@submit.prevent="signUp")
      .row
        input(type="email" placeholder="Email" required)
      .row
        input(type="password" placeholder="Password" required)
      .row
        input(type="password" placeholder="Confirm Password" required)
      button(type="submit")
        span Sign Up

  section(v-else)
    .row
      p Welcome back
    form(@submit.prevent="signIn")
      .row
        input(type="email" placeholder="Email" required)
      .row
        input(type="password" placeholder="Password" required)
      button(type="submit")
        span Sign In

  section(v-if="isSigningUp")
    .button-wrap
      // TODO TEMP link
      a(href="http://pketh.org/kinopio-plans")
        button Privacy Policy and TOS →
  section(v-else)
    button(@click="toggleResetVisible" :class="{active : resetVisible}")
      span Forgot Password?
    template(v-if="resetVisible")
      form.reset-form(@submit.prevent="resetPassword")
        .row
          input(type="email" placeholder="Email" required)
        button
          span Reset Password

</template>

<script>
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'SignUpOrIn',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      isSigningUp: true, // switches between sign up or sign in
      // signUpButtonLoader: false,
      // signInButtonLoader: false,
      // forgot password
      resetVisible: false
      // resetSuccess: true,
      // resetButtonLoader: false
    }
  },
  // computed: {
  // v-models here , see spaceDetails
  // },
  methods: {
    showIsSigningUp () {
      this.isSigningUp = true
    },
    hideIsSigningUp () {
      this.isSigningUp = false
    },
    toggleResetVisible () {
      this.resetVisible = !this.resetVisible
    },
    clientValidateSignUp (password, confirmPassword) {
      if (password !== confirmPassword) {
        // set error
        // passwords don't match (or on passconfirm field: "Doesn't match Password")
        return
      }
      return true
    },
    signUp (event) {
      const email = event.target[0].value
      const password = event.target[1].value
      const confirmPassword = event.target[2].value
      const currentUser = utils.clone(this.$store.state.currentUser) // color, id, defaultConnectionTypeId, name, lastSpaceId, lastReadNewStuffId

      console.log('🌹', email, password, confirmPassword, currentUser)

      const shouldSignUp = this.clientValidateSignUp(password, confirmPassword)
      if (!shouldSignUp) { return }

      console.log('send sign up to server, fetch POST to user/sign-in')

      // possible server errors
      // An account with this email already exists. Sign In to continue.
      // (シ_ _)シ Something went wrong. Please try again or contact support.

      // on @change in a field clear the errors for that field (have to use v-model or can change directly?)
    },
    signIn (event) {
      const email = event.target[0].value
      const password = event.target[1].value
      console.log('🌼', email, password)

      // possible server errors (all client issues handled by broser)
      // no account exists with this email
      // password incorrect
      // (シ_ _)シ Something went wrong. Please try again or contact support.

      // on @change in a field clear the errors for that field
    },
    resetPassword (event) {
      console.log('🚗', event)

      // success
      // button.success (non clickable, null event)
      // An email has been sent to you with a link to reset your password

      // possible errors
      // no account exists with this email
      // on @change in a field clear the errors for that field
    }
  }
  // watch: {
  //   visible (value) {
  //     if (value) {
  //       this.removeAllConfirmationVisible = false
  //     }
  //   }
  // }
}
</script>

<style lang="stylus">
.sign-up-or-in
  top calc(100% - 8px)
  left initial
  right 8px
  .reset-form
    margin-top 10px
</style>
