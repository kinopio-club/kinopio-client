<script setup>
import consts from '@/consts.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const referralCreditAmount = computed(() => consts.referralCreditAmount)
const referredByUserId = computed(() => store.state.currentUser.referredByUserId)
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const referrerName = computed(() => store.state.currentUser.referrerName)
const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)

</script>

<template lang="pug">
template(v-if="!isSecureAppContextIOS")
  p.badge.success(v-if="referrerName && !currentUserIsSignedIn") welcome {{referrerName}}, once you sign up your account will be upgraded to free
  p.badge.success(v-else-if="referredByUserId && !currentUserIsSignedIn") Signing up will earn you ${{referralCreditAmount}} in referral credits
</template>

<style lang="stylus">
// .component-name
</style>
