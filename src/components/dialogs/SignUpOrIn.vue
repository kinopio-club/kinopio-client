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
    form
      .row
        input(type="email" placeholder="Email" required)
      .row
        input(type="password" placeholder="Password" required)
      button(type="submit") Sign In

  section(v-if="isSigningUp")
    .button-wrap
      // TEMP link
      a(href="http://pketh.org/kinopio-plans")
        button Privacy Policy and TOS →
  section(v-else)
    button(@click="toggleForgotPasswordVisible" :class="{active : forgotPasswordVisible}")
      span Forgot Password?
    template(v-if="forgotPasswordVisible")
      form.reset-form
        .row
          input(type="email" placeholder="Email" required)
        button Reset Password

</template>

<script>
// import cache from '@/cache.js'

export default {
  name: 'SignUpOrIn',
  props: {
    visible: Boolean
  },
  data () {
    return {
      isSigningUp: true,
      forgotPasswordVisible: false
      // isSignUpForNewsletter: false
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
    signUp (event) {
      console.log('🌹', event)
      // errors
      // Email is already registered. Try signing in?
      // passwords dont match, try again
    },
    signIn (event) {
      console.log('🌼', event)
    },
    toggleForgotPasswordVisible () {
      this.forgotPasswordVisible = !this.forgotPasswordVisible
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
