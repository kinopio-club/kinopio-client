<script setup>
import consts from '@/consts.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const referralCreditAmount = computed(() => consts.referralCreditAmount)
const referredByUserId = computed(() => store.state.currentUser.referredByUserId)
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])

</script>

<template lang="pug">
p.badge.success(v-if="referredByUserId && !currentUserIsSignedIn") Signing up will earn you ${{referralCreditAmount}} in referral credits
</template>

<style lang="stylus">
// .component-name
</style>
