<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
import FreeLimitFAQ from '@/components/dialogs/FreeLimitFAQ.vue'
const store = useStore()

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeChildDialogs()
    }
  })
})

const state = reactive({
  freeLimitFAQIsVisible: false
})

const cardsCreatedCount = computed(() => store.state.currentUser.cardsCreatedCount || 0)
const cardsCreatedLimit = computed(() => store.state.cardsCreatedLimit)

const triggerUpgradeUserIsVisible = () => {
  const currentUserIsSignedIn = store.getters['currentUser/isSignedIn']
  store.dispatch('closeAllDialogs')
  if (currentUserIsSignedIn) {
    store.commit('triggerUpgradeUserIsVisible')
  } else {
    store.commit('triggerSignUpOrInIsVisible')
  }
}

const toggleFreeLimitFAQIsVisible = () => {
  const value = !state.freeLimitFAQIsVisible
  store.commit('triggerCloseChildDialogs')
  state.freeLimitFAQIsVisible = value
}
const closeChildDialogs = () => {
  state.freeLimitFAQIsVisible = false
}
</script>

<template lang="pug">
section.subsection.cards-created-progress(@click="closeChildDialogs")
  .row
    p
      img.icon.card(src="@/assets/card.svg")
      span {{cardsCreatedCount}}/{{cardsCreatedLimit}} free cards created
    .button-wrap
      button.small-button(@click.stop="toggleFreeLimitFAQIsVisible" :class="{active: state.freeLimitFAQIsVisible}")
        span ?
      FreeLimitFAQ(:visible="state.freeLimitFAQIsVisible")
  progress(:value="cardsCreatedCount" :max="cardsCreatedLimit")
  .row
    .button-wrap
      button(@click="triggerUpgradeUserIsVisible")
        span Upgrade for Unlimited
</template>

<style lang="stylus">
.cards-created-progress
  width 100%
  .row
    display flex
    justify-content space-between
    align-items center
    margin-bottom 0
    .button-wrap,
    .small-button
      margin-top 0
  progress
    margin-bottom 10px
    margin-top 10px
</style>
