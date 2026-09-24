<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()

const state = reactive({
  email: ''
})

const email = computed({
  get () {
    return state.email
  },
  set (newValue) {
    state.email = newValue
  }
})

// const isEmailValid = computed(() => Boolean(utils.emailsFromString(state.email).length))

</script>

<template lang="pug">
section.blog-subscribe
  section.subsection
    img.email(src="@/assets/email.gif")
    .subscribe-form-wrap
      p Subscribe to New Posts by Email
      .subscribe-form
        input.name(
          placeholder="space@jam.com"
          v-model="email"
          name="email"
          maxlength=200
          ref="emailInputElement"
        )
        button.small-button Subscribe
</template>

<style lang="stylus">
section.blog-subscribe
  max-width 450px
  display flex
  flex-direction row
  flex-wrap nowrap
  img
    max-width 50px
    height fit-content
    margin-right 1rem
  section.subsection
    padding 5px 10px
    display flex
    flex-direction row
    flex-wrap nowrap
    align-items center

  .subscribe-form
    display flex
    margin-top 10px
    input
      flex-shrink 1
      margin-right 6px
      // margin-top 6px

</style>
