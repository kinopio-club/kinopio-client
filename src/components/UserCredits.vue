<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import consts from '@/consts.js'
import utils from '@/utils.js'
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
  creditsUnused: 0,
  usersReferred: 0,
  detailsIsVisible: false
})

const updateCredits = async () => {
  state.isLoading = true
  try {
    const data = await store.dispatch('api/getReferralsByUser')
    console.log('🫧', data)
    state.usersReferred = data.referrals.length
    state.creditsEarned = data.creditsEarned
    state.creditsUsed = data.creditsUsed
    state.creditsUnused = data.creditsUnused
  } catch (error) {
    console.error('🚒', error)
  }
  state.isLoading = false
}

const triggerEarnCreditsIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerEarnCreditsIsVisible')
}
const toggleDetailsIsVisible = () => {
  state.detailsIsVisible = !state.detailsIsVisible
  console.log(state.detailsIsVisible)
}

</script>

<template lang="pug">
section.user-credits
  .row.title-row-flex
    p.section-title Your Credits
    button.small-button(@click="toggleDetailsIsVisible" :class="{active: state.detailsIsVisible}")
      span Details
  Loader(:visible="state.isLoading")

  template(v-if="!state.isLoading")
    p.badge.success(v-if="!state.detailsIsVisible")
      span ${{state.creditsUnused}} credit remaining for future payments
    section.subsection.table-subsection(v-if="state.detailsIsVisible")
      section
        p {{state.usersReferred}} people referred so far
      section
        p ${{state.creditsEarned}} total credit earned
      section
        .badge.success ${{state.creditsUnused}} credit remaining for future payments

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
  .title-row-flex
    margin-top 0 !important
    p,
    button
      margin 0

</style>
