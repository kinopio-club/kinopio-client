<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const state = reactive({
  tipsIsVisible: false
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

const toggleTipsIsVisible = () => {
  state.tipsIsVisible = !state.tipsIsVisible
}
</script>

<template lang="pug">
section.subsection.cards-created-progress
  .info
    p {{cardsCreatedCount}}/{{cardsCreatedLimit}} free cards created
  progress(:value="cardsCreatedCount" :max="cardsCreatedLimit")
  .row
    .button-wrap
      button(@click="triggerUpgradeUserIsVisible")
        span Upgrade for Unlimited
  .row
    .button-wrap
      button(@click.stop="toggleTipsIsVisible" :class="{active: state.tipsIsVisible}")
        span What Happens When I Run Out of Free Cards?
  .row(v-if="state.tipsIsVisible")
    p You'll always have access to your cards. But you won't be able to create new cards unless you remove some to decrease your card count.
</template>

<style lang="stylus">
.cards-created-progress
  width 100%
  .info
    display flex
    justify-content space-between
    align-items center
  progress
    margin-bottom 10px
    margin-top 10px
</style>
