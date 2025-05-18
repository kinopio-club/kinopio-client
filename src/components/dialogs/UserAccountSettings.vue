<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'
import UpdatePassword from '@/components/UpdatePassword.vue'
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'

const store = useStore()
const userStore = useUserStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  email: '',
  loading: false,
  success: false,
  error: {
    unknownServerError: false,
    accountAlreadyExists: false
  }
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    state.email = userStore.email
    clearStatus()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const updateEmail = async () => {
  if (state.loading) { return }
  if (!state.email) { return }
  if (state.email === userStore.email) { return }
  clearStatus()
  state.loading = true
  const response = await store.dispatch('api/updateEmail', state.email)
  const result = await response.json()
  if (isSuccess(response)) {
    state.success = true
    store.commit('currentUser/email', state.email)
  } else {
    await handleErrors(result)
  }
  state.loading = false
}
const isSuccess = (response) => {
  const success = [200, 201, 202, 204]
  return Boolean(success.includes(response.status))
}
const handleErrors = async (response) => {
  if (!response) {
    state.error.unknownServerError = true
    return
  }
  if (response.type === 'unique violation') {
    state.error.accountAlreadyExists = true
  } else {
    state.error.unknownServerError = true
  }
}
const clearStatus = () => {
  state.error.unknownServerError = false
  state.error.accountAlreadyExists = false
  state.success = false
}

// developer info

</script>

<template lang="pug">
dialog.narrow.update-email(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p Account
  template(v-if="!currentUserIsSignedIn")
    section
      p After you sign up you'll be able to update your email address here
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
  template(v-else)
    section
      form(@submit.prevent="updateEmail")
        input(type="text" placeholder="Email" required autocomplete="email" v-model="state.email")
        button(type="submit" :class="{active : state.loading}")
          span Update Email
          Loader(:visible="state.loading")
      p.badge.success(v-if="state.success")
        span Email Updated. A confirmation email has been sent to both your new and previous addresses
      p.badge.danger(v-if="state.error.unknownServerError.email")
        span (シ_ _)シ Something went wrong, Please try again or contact support
      p.badge.danger(v-else-if="state.error.accountAlreadyExists")
        span An account with this email already exists
    UpdatePassword
</template>

<style lang="stylus">
.update-email
  overflow auto
  @media(max-height 650px)
    top -100px !important
</style>
