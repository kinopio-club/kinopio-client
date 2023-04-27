<script setup>
import UserCredits from '@/components/UserCredits.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  visible: Boolean
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    if (utils.isDevelopment()) {
      console.log('🍇 referral url', url.value)
    }
  }
})

const url = computed(() => {
  if (store.state.currentUser.referrerName) {
    return utils.kinopioDomain() + '/from/' + store.state.currentUser.referrerName
  } else {
    return utils.kinopioDomain() + '/refer/' + store.state.currentUser.id
  }
})
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const referralCreditAmount = computed(() => consts.referralCreditAmount)
const referredByUserId = computed(() => store.state.currentUser.referredByUserId)

const copyUrl = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(url.value)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}

</script>

<template lang="pug">
dialog.narrow.refer(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section(v-if="visible")
    p Earn Credits
  section
    p
      span when someone you refer, or invite to edit, signs up. You'll both earn a{{' '}}
      span.badge.success ${{consts.referralCreditAmount}} credit
    .row
      p There's no limit on the amount of credits you can earn.
    template(v-if="currentUserIsSignedIn")
      section.subsection
        p Share Kinopio with friends
        button(@click.left="copyUrl")
          img.icon.copy(src="@/assets/copy.svg")
          span Copy Referral URL
  template(v-if="currentUserIsSignedIn")
    UserCredits
  template(v-else)
    section
      p.badge.success(v-if="referredByUserId") Signing up will earn you ${{referralCreditAmount}} in referral credits
      p.badge.info
        span Sign Up or In to earn credits by referring your friends to Kinopio
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
</template>

<style lang="stylus">
.refer
  overflow auto
  top calc(100% - 8px)
  left initial
  right 8px
  .badge
    vertical-align 0
    color var(--primary)
  p
    &.badge
      margin-right 0
</style>
