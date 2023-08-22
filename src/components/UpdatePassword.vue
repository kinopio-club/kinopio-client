<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

// import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
const store = useStore()

const state = reactive({
  password: '',
  error: {
    passwordMatch: false,
    unknownServerError: false,
    tooManyAttempts: false,
    passwordTooShort: false
  },
  loading: {
    updatePassword: false
  },
  success: false
})

const clearErrors = () => {
  for (const errorType in state.error) {
    state.error[errorType] = false
  }
}
const hasErrors = () => {
  let hasErrors
  for (const errorType in state.error) {
    if (state.error[errorType] === true) {
      hasErrors = true
    }
  }
  return hasErrors
}

// validate form

const isPasswordsMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    state.error.passwordMatch = true
  } else {
    return true
  }
}
const isPasswordTooShort = (password) => {
  if (password.length < 4) {
    state.error.passwordTooShort = true
  } else {
    return true
  }
}

// update password

const isSuccess = (response) => {
  const success = [200, 201, 202, 204]
  return Boolean(success.includes(response.status))
}
const handleErrors = async (response) => {
  state.loading.updatePassword = false
  state.error.tooManyAttempts = false
  state.error.unknownServerError = false
  if (!response) {
    state.error.unknownServerError = true
    return
  }
  if (response.status === 429) {
    state.error.tooManyAttempts = true
  } else {
    state.error.unknownServerError = true
  }
}
const updatePassword = async (event) => {
  if (state.loading.updatePassword) { return }
  const password = event.target[0].value
  const confirmPassword = event.target[1].value
  if (!isPasswordTooShort(password)) { return }
  if (!isPasswordsMatch(password, confirmPassword)) { return }
  state.loading.updatePassword = true
  const apiKey = store.state.updatePasswordApiKey || store.state.currentUser.apiKey
  const response = await store.dispatch('api/updatePassword', { password, apiKey })
  const result = await response.json()
  if (isSuccess(response)) {
    state.success = true
  } else {
    await handleErrors(result)
  }
  state.loading.updatePassword = false
}

</script>

<template lang="pug">
section
  form(@submit.prevent="updatePassword")
    input(type="password" placeholder="New Password" required @input="clearErrors" v-model="state.password")
    input(type="password" placeholder="Confirm New Password" required @input="clearErrors")
    .row(v-if="state.error.passwordMatch")
      .badge.danger Passwords can't match
    .row(v-if="state.error.passwordTooShort")
      .badge.danger Password must be longer than 4 characters
    .row(v-if="state.error.tooManyAttempts")
      .badge.danger Too many attempts, try again in 10 minutes
    .row(v-if="state.error.unknownServerError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
    button(type="submit" :class="{active : state.loading.updatePassword}")
      span Update Password
      Loader(:visible="state.loading.updatePassword")
    p.row(v-if="state.success")
      .badge.success Your password has been changed. You can now use it to Sign In
</template>

<style lang="stylus">
// .component-name
</style>
