<template lang="pug">
dialog.narrow.sign-up-or-in(v-if="visible" :open="visible")
  section
    .segmented-buttons
      button(@click="showSignUpVisible" :class="{active : signUpVisible}") Sign Up
      button(@click="hideSignUpVisible" :class="{active : !signUpVisible}") Sign In

  //- Sign Up
  section(v-if="signUpVisible")
    p Create an account to share your spaces and access them anywhere
    form(@submit.prevent="signUp")
      input(type="email" placeholder="Email" required v-model="email" @input="clearErrors")
      .badge.info(v-if="error.accountAlreadyExists") An account with this email already exists, Sign In instead
      input(type="password" placeholder="Password" required @input="clearErrors" v-model="password")
      input(type="password" placeholder="Confirm Password" required @input="clearErrors")
      .badge.danger(v-if="error.passwordMatch") Passwords must match
      .badge.danger(v-if="error.passwordMatchesEmail") Password can't be from your email
      .badge.danger(v-if="error.passwordTooShort") Password must be longer than 4 characters
      .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      button(type="submit" :class="{active : loading.signUpOrIn}")
        span Sign Up
        Loader(:visible="loading.signUpOrIn")

  //- Sign In
  section(v-else)
    p Welcome back
    form(@submit.prevent="signIn")
      input(type="email" placeholder="Email" required v-model="email" @input="clearErrors")
      input(type="password" placeholder="Password" required v-model="password" @input="clearErrors")
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      .badge.danger(v-if="error.signInCredentials") Incorrect email or password
      .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes
      button(type="submit" :class="{active : loading.signUpOrIn}")
        span Sign In
        Loader(:visible="loading.signUpOrIn")

  //- Privacy Policy
  section(v-if="signUpVisible")
    .button-wrap
      // TODO TEMP link
      a(href="http://pketh.org/kinopio-plans")
        button Privacy Policy and TOS →

  //- Forgot Password
  section.forgot-password(v-else)
    button(@click="toggleResetVisible" :class="{active : resetVisible}")
      span Forgot Password?
    div(v-show="resetVisible")
      form.reset-form(@submit.prevent="resetPassword")
        input(type="email" placeholder="Email" ref="resetPasswordEmail" required @input="clearErrors")
        button(type="submit" :class="{active : loading.resetPassword || resetSuccess}")
          span Reset Password
          Loader(:visible="loading.resetPassword")
      .badge.success(v-if="resetSuccess") Password Reset Email Sent
      .badge.danger(v-if="error.resetUserEmailNotFound") A user with that that email address wasn't found. Try another?
      .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes
</template>

<script>
import utils from '@/utils.js'
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
        tooManyAttempts: false,
        passwordTooShort: false,
        passwordMatchesEmail: false,
        resetUserEmailNotFound: false
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
      this.resetSuccess = false
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

    isSuccess (response) {
      const success = [200, 201, 202, 204]
      return Boolean(success.includes(response.status))
    },

    async handleErrors (response) {
      this.loading.signUpOrIn = false
      this.loading.resetPassword = false
      this.error.signInCredentials = false
      this.error.accountAlreadyExists = false
      this.error.tooManyAttempts = false
      this.error.unknownServerError = false
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

    isPasswordMatchesEmail (email, password) {
      const emailNameIndex = email.indexOf('@')
      const name = email.slice(0, emailNameIndex)
      if (email === password || name === password) {
        this.error.passwordMatchesEmail = true
      } else {
        return true
      }
    },

    isSignUpPasswordsMatch (password, confirmPassword) {
      if (password !== confirmPassword) {
        this.error.passwordMatch = true
      } else {
        return true
      }
    },

    isSignUpPasswordTooShort (password) {
      if (password.length < 4) {
        this.error.passwordTooShort = true
      } else {
        return true
      }
    },

    async signUp (event) {
      if (this.loading.signUpOrIn) { return }
      const email = event.target[0].value.toLowerCase()
      const password = event.target[1].value
      const confirmPassword = event.target[2].value
      const currentUser = utils.clone(this.$store.state.currentUser)
      if (!this.isPasswordMatchesEmail(email, password)) { return }
      if (!this.isSignUpPasswordTooShort(password)) { return }
      if (!this.isSignUpPasswordsMatch(password, confirmPassword)) { return }
      this.loading.signUpOrIn = true
      const response = await this.$store.dispatch('api/signUp', { email, password, currentUser })
      const result = await response.json()
      if (this.isSuccess(response)) {
        await this.createSpaces(result.apiKey)
      } else {
        await this.handleErrors(result)
      }
    },

    async signIn (event) {
      if (this.loading.signUpOrIn) { return }
      const previousUser = utils.clone(this.$store.state.currentUser)
      const email = event.target[0].value.toLowerCase()
      const password = event.target[1].value
      this.loading.signUpOrIn = true
      const response = await this.$store.dispatch('api/signIn', { email, password })
      const result = await response.json()
      this.loading.signUpOrIn = false
      if (this.isSuccess(response)) {
        this.$store.commit('currentUser/updateUser', result)
        await this.createSpaces(result.apiKey)
        const spaces = await this.$store.dispatch('api/getUserSpaces')
        cache.addSpaces(spaces)
        this.$store.commit('triggerSpaceDetailsVisible')
        const currentSpace = this.$store.state.currentSpace
        const currentUser = this.$store.state.currentUser
        const currentUserIsSignedIn = this.$store.getters['currentUser/isSignedIn']
        utils.updateWindowUrlAndTitle({
          space: currentSpace,
          currentUserIsSignedIn
        })
        this.$store.commit('currentSpace/removeUserFromSpace', previousUser)
        this.$store.commit('currentSpace/addUserToSpace', currentUser)
        this.$store.commit('notifySignUpToEditOpenSpace', false)
        this.$store.dispatch('currentSpace/checkIfShouldNotifyReadOnly')
        this.$store.commit('notifyNewUser', false)
      } else {
        await this.handleErrors(result)
      }
    },

    async createSpaces (apiKey) {
      cache.updateIdsInAllSpaces() // added Oct 2019 for legacy spaces, can safely remove this in Oct 2020
      const updatedSpace = cache.space(this.$store.state.currentSpace.id)
      this.$store.commit('addNotification', { message: 'Signed In', type: 'success' })
      this.$store.commit('currentSpace/restoreSpace', updatedSpace)
      this.$store.commit('currentUser/apiKey', apiKey)
      await this.$store.dispatch('api/createSpaces')
      this.loading.signUpOrIn = false
      this.$store.commit('closeAllDialogs')
    },

    async resetPassword (event) {
      if (this.loading.resetPassword || this.resetSuccess) { return }
      const email = event.target[0].value.toLowerCase()
      this.loading.resetPassword = true
      const response = await this.$store.dispatch('api/resetPassword', email)
      this.loading.resetPassword = false
      if (response.status === 404) {
        this.error.resetUserEmailNotFound = true
      } else if (response.status === 429) {
        this.error.tooManyAttempts = true
      } else {
        this.resetSuccess = true
      }
    }
  },
  watch: {
    visible (value) {
      if (value) {
        this.clearErrors()
      }
    },
    'loading.signUpOrIn' (value) {
      this.$emit('loading', value)
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
  .forgot-password
    .badge
      margin 0
      margin-top 10px
</style>
