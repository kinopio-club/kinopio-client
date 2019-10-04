<template lang="pug">
dialog.narrow.sign-up-or-in(v-if="visible" :open="visible")
  section
    .segmented-buttons
      button(@click="showSignUpVisible" :class="{active : signUpVisible}") Sign Up
      button(@click="hideSignUpVisible" :class="{active : !signUpVisible}") Sign In
  section(v-if="signUpVisible")
    .row
      p Create an account to share your spaces and access them anywhere
    form(@submit.prevent="signUp")
      .row
        input(type="email" placeholder="Email" required v-model="email")
      .row
        input(type="password" placeholder="Password" required @input="clearErrors" v-model="password")
      .row
        input(type="password" placeholder="Confirm Password" required @input="clearErrors")
      .row(v-if="error.passwordMatch")
        p.badge.danger Doesn't match Password
      button(type="submit")
        span Sign Up

  section(v-else)
    .row
      p Welcome back
    form(@submit.prevent="signIn")
      .row
        input(type="email" placeholder="Email" required v-model="email")
      .row
        input(type="password" placeholder="Password" required v-model="password")
      button(type="submit")
        span Sign In

  section(v-if="signUpVisible")
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
      email: '',
      password: '',
      signUpVisible: true,
      resetVisible: false,
      error: {
        passwordMatch: false
      }
      // loading: {
      //   signUpOrIn: false,
      //   reset: false
      // },
      // resetSuccess: true,
    }
  },
  methods: {
    showSignUpVisible () {
      this.signUpVisible = true
      this.clearErrors()
    },
    hideSignUpVisible () {
      this.signUpVisible = false
      this.clearErrors()
    },
    toggleResetVisible () {
      this.resetVisible = !this.resetVisible
    },
    clearErrors () {
      this.error.passwordMatch = false
    },
    clientValidateSignUp (password, confirmPassword) {
      if (password !== confirmPassword) {
        this.error.passwordMatch = true
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
  //       clear errors and inputs?
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
