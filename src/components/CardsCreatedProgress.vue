<script setup>
// import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
// https://vuex.vuejs.org/guide/composition-api.html#accessing-state-and-getters
import { useStore } from 'vuex'
const store = useStore()

const cardsCreatedCount = computed(() => store.state.currentUser.cardsCreatedCount || 0)
const cardsCreatedLimit = computed(() => store.state.cardsCreatedLimit)

</script>

<template lang="pug">
.cards-created-progress
  p {{cardsCreatedCount}}/{{cardsCreatedLimit}} cards created
  progress(:value="cardsCreatedCount" :max="cardsCreatedLimit")

</template>

<style lang="stylus">
.cards-created-progress
  progress
    margin-top 2px
    margin-bottom 10px
</style>
