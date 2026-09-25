<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useApiStore } from '@/stores/useApiStore'

import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'

const globalStore = useGlobalStore()
const apiStore = useApiStore()

const state = reactive({
  email: '',
  isLoading: false,
  isSuccess: false,
  error: {
    email: false,
    unknownServerError: false
  }
})

const email = computed({
  get () {
    return state.email
  },
  set (newValue) {
    state.email = newValue
  }
})

const clearErrors = () => {
  state.error.email = false
  state.error.unknownServerError = false
}
const subscribe = async () => {
  clearErrors()
  if (!state.email || state.isLoading) {
    return
  } else if (!utils.emailIsValid(state.email)) {
    state.error.email = true
    return
  }
  try {
    state.isLoading = true
    const response = await apiStore.kinopioBlogNewPostSubscribe(state.email)
    state.isSuccess = true
  } catch (error) {
    console.error('🚒 subscribe', error)
    state.unknownServerError = true
  }
  state.isLoading = false
}
</script>

<template lang="pug">
section.blog-subscribe
  section.subsection
    .row
      img.email(src="@/assets/email.gif")

    .subscribe-form-wrap
      .row
        span Subscribe to New Posts by Email
      .row.subscribe-form(v-if="!state.isSuccess")
        input.name(
          placeholder="space@jam.com"
          v-model="email"
          name="email"
          maxlength=200
          ref="emailInputElement"
          type="email"
          @keydown.enter.exact="subscribe"
        )
        button.small-button(@click="subscribe")
          span Subscribe

      .row.success-row(v-if="state.isSuccess")
        span.badge.success
          span Subscribed

      Loader(:visible="state.isLoading")

      .row(v-if="state.error.email")
        span.badge.danger Email is not valid
      .row(v-if="state.error.unknownServerError")
        span.badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
</template>

<style lang="stylus">
section.blog-subscribe
  max-width 450px
  display flex
  flex-direction row
  flex-wrap nowrap
  img.email
    max-width 50px
    height fit-content
    margin-right 1rem
  section.subsection
    padding 6px 10px
    display flex
    flex-direction row
    flex-wrap nowrap
    align-items 10px

  .subscribe-form
    display flex
    input
      flex-shrink 1
      margin 0
      margin-right 6px
  .row
    margin 10px 0

  .loader
    margin-bottom 5px
</style>
