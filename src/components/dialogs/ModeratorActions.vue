<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useApiStore } from '@/stores/useApiStore'
import { useGlobalStore } from '@/stores/useGlobalStore'
import Loader from '@/components/Loader.vue'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const apiStore = useApiStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['updateCount'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  studentDiscountUser: undefined,
  loading: {
    studentDiscount: false
  },
  error: {
    restartServer: {
      unknownServerError: false
    },
    studentDiscount: {
      unknownServerError: false,
      emailIsMissing: false,
      userNotFound: false
    }
  }
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    clearState()
    clearErrors()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const clearErrors = () => {
  state.error.restartServer.unknownServerError = false
  state.error.studentDiscount.unknownServerError = false
  state.error.studentDiscount.emailIsMissing = false
  state.error.studentDiscount.userNotFound = false
}
const clearState = () => {
  state.studentDiscountUser = null
}

// restart

const moderatorIsLoadingRestartServer = computed(() => globalStore.moderatorIsLoadingRestartServer)
const restartServer = async () => {
  try {
    if (globalStore.moderatorIsLoadingRestartServer) { return }
    globalStore.moderatorIsLoadingRestartServer = true
    await apiStore.moderatorRestartServer()
  } catch (error) {
    console.error('🚒 restartServer', error)
    state.error.restartServer.unknownServerError = true
  }
}

// student discount

const applyStudentDiscount = async (event) => {
  try {
    clearErrors()
    state.loading.studentDiscount = true
    const email = event.target.elements[0].value
    if (!email) {
      state.error.studentDiscount.emailIsMissing = true
    }
    const data = await apiStore.applyStudentDiscount(email)
    state.studentDiscountUser = data.user
  } catch (error) {
    const body = await error.response.json()
    console.error('🚒 applyStudentDiscount', error, body.message)
    if (body.message === 'user not found') {
      state.error.studentDiscount.userNotFound = true
    } else {
      state.error.studentDiscount.unknownServerError = true
    }
  } finally {
    state.loading.studentDiscount = false
  }
}
const studentDiscountMessage = computed(() => {
  return `Hey ${state.studentDiscountUser.name},\n\nI just updated your account to use the student discount. Thanks for using Kinopio!`
})
const copyStudentDiscountMessage = async (event) => {
  globalStore.clearNotificationsWithPosition()
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(studentDiscountMessage.value)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
</script>

<template lang="pug">
dialog.narrow.moderator-actions(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    p Moderator Actions
  //- restart server
  section
    .row
      button(@click="restartServer" :disabled="moderatorIsLoadingRestartServer")
        span 🚒 Restart Server
        Loader(:visible="moderatorIsLoadingRestartServer")
    //- error
    .row(v-if="moderatorIsLoadingRestartServer && !state.error.restartServer.unknownServerError")
      .badge.info
        span Server is Restarting. Refresh and try again in ~5 minutes.
    .row(v-if="state.error.restartServer.unknownServerError")
      .badge.danger
        span (シ_ _)シ Something went wrong, Please try again or contact support
  //- student discount
  section
    p Apply Student Discount
    form(@submit.prevent="applyStudentDiscount")
      input(placeholder="User Email" type="email")
      button(type="submit" :class="{active : state.loading.studentDiscount}")
        span Submit
        Loader(:visible="state.loading.studentDiscount")
    //- error
    template(v-if="state.error.studentDiscount.userNotFound")
      p
        span.badge.danger User account not found
    //- success
    template(v-if="state.studentDiscountUser")
      p
        span.badge.success success
      section.subsection
        p {{studentDiscountMessage}}
        p
          button(@click.left="copyStudentDiscountMessage")
            img.icon.copy(src="@/assets/copy.svg")
            span Copy Message
  section
    p All moderator actions are logged and will notify admins.
</template>

<style lang="stylus">
dialog.moderator-actions
  overflow auto
  left initial
  right 8px
  @media(max-height 600px)
    top -200px
  form,
  section.subsection
    margin-top 10px
</style>
