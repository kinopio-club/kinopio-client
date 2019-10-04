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
      button(type="submit") Sign Up

  section(v-else)
    .row
      p Welcome back
    form(@submit.prevent="signIn")
      .row
        input(type="email" placeholder="Email" required)
      .row
        input(type="password" placeholder="Password" required)
      button(type="submit") Sign In

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
    signUp (event) {
      console.log('🌹', event)
      // possible errors
      // email is invalid format (util: simple regex validator) (browser might prevent this)
      // An account with this email already exists. Sign In to continue.
      // on password confirm input: doesn't match Password
      // (シ_ _)シ Something went wrong. Please try again or contact support.

      // on @change in a field clear the errors for that field
    },
    signIn (event) {
      console.log('🌼', event)
      // possible errors
      // no account exists with this email
      // password incorrect
      // (シ_ _)シ Something went wrong. Please try again or contact support.
    },
    resetPassword (event) {
      console.log('🚗', event)
      // success
      // button.success
      // An email has been sent to you with a link to reset your password

      // possible errors
      // no account exists with this email
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
