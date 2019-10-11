<template lang="pug">
dialog.narrow.sign-up-or-in(v-if="visible" :open="visible")
  section
    .segmented-buttons
      button(@click="showSignUpVisible" :class="{active : signUpVisible}") Sign Up
      button(@click="hideSignUpVisible" :class="{active : !signUpVisible}") Sign In

  // Sign Up
  section(v-if="signUpVisible")
    p Create an account to share your spaces and access them anywhere
    form(@submit.prevent="signUp")
      input(type="email" placeholder="Email" required v-model="email" @input="clearErrors")
      .badge.info(v-if="error.accountAlreadyExists") An account with this email already exists, Sign In instead
      input(type="password" placeholder="Password" required @input="clearErrors" v-model="password")
      input(type="password" placeholder="Confirm Password" required @input="clearErrors")
      .badge.danger(v-if="error.passwordMatch") Doesn't match Password
      .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      button(type="submit" :class="{active : loading.signUpOrIn}")
        span Sign Up
        Loader(:visible="loading.signUpOrIn")

  // Sign In
  section(v-else)
    p Welcome back
    form(@submit.prevent="signIn")
      input(type="email" placeholder="Email" required v-model="email" @input="clearErrors")
      input(type="password" placeholder="Password" required v-model="password" @input="clearErrors")
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      .badge.danger(v-if="error.signInCredentials") Could not sign in, incorrect email or password
      .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes
      button(type="submit" :class="{active : loading.signUpOrIn}")
        span Sign In
        Loader(:visible="loading.signUpOrIn")

  // Privacy Policy
  section(v-if="signUpVisible")
    .button-wrap
      // TODO TEMP link
      a(href="http://pketh.org/kinopio-plans")
        button Privacy Policy and TOS →

  // Forgot Password
  section(v-else)
    button(@click="toggleResetVisible" :class="{active : resetVisible}")
      span Forgot Password?
    div(v-show="resetVisible")
      form.reset-form(@submit.prevent="resetPassword")
        input(type="email" placeholder="Email" ref="resetPasswordEmail" required)
        button(type="submit" :class="{active : loading.resetPassword, success : resetSuccess}")
          span(v-if="resetSuccess") Password Reset Email Sent
          span(v-else) Reset Password
          Loader(:visible="loading.resetPassword")

</template>

<script>
import utils from '@/utils.js'
import api from '@/api.js'
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'

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
        accountAlreadyExists: false,
        signInCredentials: false,
        tooManyAttempts: false
      },
      loading: {
        signUpOrIn: false,
        resetPassword: false
      },
      resetSuccess: false
    }
  },
  methods: {
    clearErrors () {
      for (const errorType in this.error) {
        this.error[errorType] = false
      }
    },

    hasErrors () {
      let hasErrors
      for (const errorType in this.error) {
        if (this.error[errorType] === true) {
          hasErrors = true
        }
      }
      return hasErrors
    },

    showSignUpVisible () {
      this.signUpVisible = true
      this.clearErrors()
    },

    hideSignUpVisible () {
      this.signUpVisible = false
      this.resetVisible = false
      this.clearErrors()
    },

    toggleResetVisible () {
      this.resetVisible = !this.resetVisible
    },

    parseErrors (response) {
      console.warn(response)
      this.loading.signUpOrIn = false
      this.loading.resetPassword = false
      if (!response) {
        this.error.unknownServerError = true
        return
      }
      if (response.type === 'unique violation') {
        this.error.accountAlreadyExists = true
      } else if (response.status === 401) {
        this.error.signInCredentials = true
      } else if (response.status === 429) {
        this.error.tooManyAttempts = true
      } else {
        this.error.unknownServerError = true
      }
    },

    signUpPasswordsIsMatch (password, confirmPassword) {
      if (password !== confirmPassword) {
        this.error.passwordMatch = true
        return
      }
      return true
    },

    async signUp (event) {
      if (this.loading.signUpOrIn) { return }
      const email = event.target[0].value
      const password = event.target[1].value
      const confirmPassword = event.target[2].value
      const currentUser = utils.clone(this.$store.state.currentUser)
      if (!this.signUpPasswordsIsMatch(password, confirmPassword)) { return }
      this.loading.signUpOrIn = true
      const response = await api.signUp(email, password, currentUser)
      if (!response || response.error) {
        this.parseErrors(response)
      } else {
        await this.signInOrUp(response.apiKey)
      }
    },

    async signIn (event) {
      if (this.loading.signUpOrIn) { return }
      const email = event.target[0].value
      const password = event.target[1].value
      this.loading.signUpOrIn = true
      const response = await api.signIn(email, password)
      if (!response || response.error) {
        this.parseErrors(response)
      } else {
        this.$store.commit('currentUser/updateUser', response)
        await this.signInOrUp(response.apiKey)
        // get /user which should include spaces
        // update any spaces which dont exist in ls (for spaceDetails)
      }
    },

    async signInOrUp (apiKey) {
      cache.updateIdsInAllSpaces()
      const updatedSpace = cache.space(this.$store.state.currentSpace.id)
      this.$store.commit('currentSpace/restoreSpace', updatedSpace)
      const response = await api.postMultipleSpaces(apiKey)
      this.loading.signUpOrIn = false
      if (!response || response.error) {
        this.parseErrors(response)
      } else {
        this.$store.commit('currentUser/apiKey', apiKey)
        this.$store.commit('closeAllDialogs')
      }
    },

    async resetPassword (event) {
      if (this.loading.resetPassword || this.resetSuccess) { return }
      const email = event.target[0].value
      this.loading.resetPassword = true
      await api.resetPassword(email)
      this.loading.resetPassword = false
      this.resetSuccess = true
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
  p,
  .badge
    margin-bottom 10px
</style>
