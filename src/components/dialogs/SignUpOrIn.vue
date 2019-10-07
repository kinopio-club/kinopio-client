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
        input(type="email" placeholder="Email" required v-model="email" @input="clearErrors")
      .row(v-if="error.emailAlreadyExists")
        .badge.info An account with this email already exists, Sign In instead
      .row
        input(type="password" placeholder="Password" required @input="clearErrors" v-model="password")
      .row
        input(type="password" placeholder="Confirm Password" required @input="clearErrors")
      .row(v-if="error.passwordMatch")
        .badge.danger Doesn't match Password
      .row(v-if="error.unknownServerError")
        .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
      button(type="submit" :class="{active : loading.signUpOrIn}")
        span Sign Up
        Loader(:visible="loading.signUpOrIn")

  section(v-else)
    .row
      p Welcome back
    form(@submit.prevent="signIn")
      .row
        input(type="email" placeholder="Email" required v-model="email" @input="clearErrors")
      .row
        input(type="password" placeholder="Password" required v-model="password" @input="clearErrors")
      button(type="submit" :class="{active : loading.signUpOrIn}")
        span Sign In
        Loader(:visible="loading.signUpOrIn")

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
        button(:class="{active : loading.reset}")
          span Reset Password
          Loader(:visible="loading.reset")

</template>

<script>
import utils from '@/utils.js'
import api from '@/api.js'
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
        passwordMatch: false,
        unknownServerError: false,
        emailAlreadyExists: false
      },
      loading: {
        signUpOrIn: false,
        reset: false
      },
      resetSuccess: true
    }
  },
  methods: {
    clearErrors () {
      for (const errorType in this.error) {
        this.error[errorType] = false
      }
    },
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
    parseError (response) {
      const error = response.errors[0]
      const existingUserMessages = [
        'email must be unique',
        'id must be unique'
      ]
      if (existingUserMessages.includes(error.message)) {
        this.error.emailAlreadyExists = true
      } else {
        this.error.unknownServerError = true
      }
    },
    async signUp (event) {
      if (this.loading.signUpOrIn) { return }
      this.clearErrors()
      const email = event.target[0].value
      const password = event.target[1].value
      const confirmPassword = event.target[2].value
      const currentUser = utils.clone(this.$store.state.currentUser)
      if (password !== confirmPassword) {
        this.error.passwordMatch = true
        return
      }
      this.loading.signUpOrIn = true
      const response = await api.signUp(email, password, currentUser)
      this.loading.signUpOrIn = false
      if (response.errors) {
        this.parseError(response)
      } else {
        console.log('❇️ create new user account, sign in', response)
      }
    },
    async signIn (event) {
      if (this.loading.signUpOrIn) { return }
      this.loading.signUpOrIn = true

      const email = event.target[0].value
      const password = event.target[1].value
      console.log('🌼', email, password)

      const test = await api.hello()
      console.log('🌷', test)
      this.loading.signUpOrIn = false

      // possible server errors (all client issues handled by broser)
      // no account exists with this email
      // password incorrect
      // (シ_ _)シ Something went wrong. Please try again or contact support.

      // on @change in a field clear the errors for that field
    },
    resetPassword (event) {
      if (this.loading.reset) { return }
      this.loading.reset = true

      // success
      // button.success (non clickable, null event)
      // An email has been sent to you with a link to reset your password

      // possible errors
      // no account exists with this email
      // on @change in a field clear the errors for that field

      this.loading.reset = false
    }
  },
  watch: {
    visible (value) {
      if (value) {
        this.clearErrors()
      }
    }
  }
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
