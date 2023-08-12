<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const cardsCreatedCount = computed(() => store.state.currentUser.cardsCreatedCount || 0)
const cardsCreatedLimit = computed(() => store.state.cardsCreatedLimit)

const triggerUpgradeUserIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerUpgradeUserIsVisible')
}

</script>

<template lang="pug">
section.subsection.cards-created-progress
  .info
    p {{cardsCreatedCount}}/{{cardsCreatedLimit}} cards created
  progress(:value="cardsCreatedCount" :max="cardsCreatedLimit")
  .button-wrap
    button(@click="triggerUpgradeUserIsVisible")
      span Upgrade for Unlimited

</template>

<style lang="stylus">
.cards-created-progress
  width 100%
  .info
    display flex
    justify-content space-between
    align-items center
  .button-wrap
    margin-top 10px
</style>
