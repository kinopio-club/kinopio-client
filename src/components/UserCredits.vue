<script setup>
import Loader from '@/components/Loader.vue'
import consts from '@/consts.js'
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

onMounted(() => {
  updateCredits()
})

defineProps({
  showEarnCreditsButton: Boolean
})

const state = reactive({
  isLoading: true,
  creditsUsed: 0,
  creditsEarned: 0,
  usersReferred: 0
})

const updateCredits = async () => {
  state.isLoading = true
  try {
    const data = await store.dispatch('api/getReferralsByUser')
    state.usersReferred = data.referrals.length
    state.creditsEarned = data.referrals.length * consts.referralCreditAmount
    state.creditsUsed = data.creditsUsed
  } catch (error) {
    console.error('🚒', error)
  }
  state.isLoading = false
}

const creditsUnused = computed(() => state.creditsEarned - state.creditsUsed)

const triggerEarnCreditsIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerEarnCreditsIsVisible')
}
</script>

<template lang="pug">
section.user-credits
  p.section-title Your Credits
  Loader(:visible="state.isLoading")
  section.subsection.table-subsection(v-if="!state.isLoading")
    section
      p {{state.usersReferred}} people referred so far
    section
      p ${{state.creditsEarned}} total credit earned
    section
      .badge.success ${{creditsUnused}} credit remaining for future payments
  .row(v-if="showEarnCreditsButton")
    .button-wrap
      button(@click="triggerEarnCreditsIsVisible")
        span Earn Credits
</template>

<style lang="stylus">
.user-credits
  .subsection.table-subsection
    padding 0 8px
    section
      padding-left 0
      padding-right 0
    .badge
      margin 0
  .section-title
    margin-bottom 10px
</style>
