<script setup>
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

defineProps({
  showEarnCreditsButton: Boolean
})

const state = reactive({
  creditsUsed: 0,
  creditsEarned: 0,
  usersReferred: 0
})

const creditsUnused = computed(() => state.creditsEarned - state.creditsUsed)

const triggerEarnCreditsIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerEarnCreditsIsVisible')
}
</script>

<template lang="pug">
section.user-credits
  p.section-title Your Credits
  section.subsection.table-subsection
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
