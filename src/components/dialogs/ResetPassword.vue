<template lang="pug">
dialog.narrow.reset-password(v-if="visible" :open="visible")
  section
    p Change your password
    form(@submit.prevent="resetPassword")
      input(type="password" placeholder="New Password" required @input="clearErrors" v-model="password")
      input(type="password" placeholder="Confirm New Password" required @input="clearErrors")
      .badge.danger(v-if="error.passwordMatch") Passwords can't match
      .badge.danger(v-if="error.passwordTooShort") Password must be longer than 4 characters
      .badge.danger(v-if="error.tooManyAttempts") Too many attempts, try again in 10 minutes
      .badge.danger(v-if="error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      button(type="submit" :class="{active : loading.resetPassword}")
        span Reset Password
        Loader(:visible="loading.resetPassword")

</template>

<script>
import api from '@/api.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'resetPassword',
  components: {
    Loader
  },
  data () {
    return {
      password: '',
      error: {
        passwordMatch: false,
        unknownServerError: false,
        tooManyAttempts: false,
        passwordTooShort: false
      },
      loading: {
        resetPassword: false
      },
      resetSuccess: false
    }
  },
  computed: {
    visible () {
      return this.$store.state.passwordResetIsVisible
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

    isSuccess (response) {
      const success = [200, 201, 202, 204]
      return Boolean(success.includes(response.status))
    },

    async handleErrors (response) {
      this.loading.resetPassword = false

      this.error.tooManyAttempts = false
      this.error.unknownServerError = false

      if (!response) {
        this.error.unknownServerError = true
        return
      }
      if (response.status === 429) {
        this.error.tooManyAttempts = true
      } else {
        this.error.unknownServerError = true
      }
    },

    isPasswordsMatch (password, confirmPassword) {
      if (password !== confirmPassword) {
        this.error.passwordMatch = true
      } else {
        return true
      }
    },

    isPasswordTooShort (password) {
      if (password.length < 4) {
        this.error.passwordTooShort = true
      } else {
        return true
      }
    },

    async resetPassword (event) {
      if (this.loading.resetPassword) { return }
      const password = event.target[0].value
      const confirmPassword = event.target[1].value
      if (!this.isPasswordTooShort(password)) { return }
      if (!this.isPasswordsMatch(password, confirmPassword)) { return }
      this.loading.resetPassword = true
      const response = await api.resetPassword(password)
      const result = await response.json()
      if (this.isSuccess(response)) {
        this.$store.commit('passwordResetIsVisible', false)
        this.$store.commit('addNotification', { message: 'Your password has been changed. You can now use it to Sign In' })
      } else {
        await this.handleErrors(result)
      }
    }

  }
}
</script>

<style lang="stylus">
.reset-password
  top calc(100% - 8px)
  left initial
  right 8px
  .reset-form
    margin-top 10px
  p,
  .badge
    margin-bottom 10px
</style>
