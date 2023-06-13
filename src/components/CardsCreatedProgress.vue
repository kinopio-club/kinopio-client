<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'
const store = useStore()

defineProps({
  showReferButton: Boolean
})

const cardsCreatedCount = computed(() => store.state.currentUser.cardsCreatedCount || 0)
const cardsCreatedLimit = computed(() => store.state.cardsCreatedLimit)
const isPricingHidden = computed(() => store.state.isPricingHidden)

const togglePricingIsVisible = () => {
  const value = !store.state.pricingIsVisible
  store.dispatch('closeAllDialogs')
  store.commit('pricingIsVisible', value)
}
</script>

<template lang="pug">
.cards-created-progress
  .info
    p {{cardsCreatedCount}}/{{cardsCreatedLimit}} cards created
    template(v-if="!isPricingHidden")
      button.small-button(@click="togglePricingIsVisible") Pricing
  progress(:value="cardsCreatedCount" :max="cardsCreatedLimit")

</template>

<style lang="stylus">
.cards-created-progress
  width 100%
  .info
    display flex
    justify-content space-between
    align-items center
    button
      margin-top 0
</style>
