<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Card from '@/components/Card.vue'
const store = useStore()

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerUpdateUrlPreviewComplete') {
      store.dispatch('currentCards/checkIfShouldUpdateNewTweetCards')
    }
  })
})

const unlockedCards = computed(() => store.getters['currentCards/isNotLocked'])
</script>

<template lang="pug">
.cards
  //- locked cards rendered in ItemsLocked
  template(v-for="card in unlockedCards")
    Card(:card="card")
</template>

<style lang="stylus">
</style>
