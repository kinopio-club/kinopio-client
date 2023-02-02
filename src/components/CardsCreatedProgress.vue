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

</script>

<template lang="pug">
.cards-created-progress
  .info
    p {{cardsCreatedCount}}/{{cardsCreatedLimit}} cards created
  progress(:value="cardsCreatedCount" :max="cardsCreatedLimit")

</template>

<style lang="stylus">
.cards-created-progress
  width 100%
  .info
    display flex
    justify-content space-between
    align-items center
</style>
