<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'

import Card from '@/components/Card.vue'
import ItemSnapGuide from '@/components/ItemSnapGuide.vue'

const globalStore = useGlobalStore()
const cardStore = useCardStore()

const allCards = computed(() => cardStore.getAllCards)
const lockedCards = computed(() => allCards.value.filter(card => card.isLocked))
const cards = computed(() => {
  return allCards.value.filter(card => {
    return !card.isLocked && !card.listId
  })
})
</script>

<template lang="pug">
.cards
  template(v-for="card in cards" :key="card.id")
    Card(:card="card")
    ItemSnapGuide(:card="card")
  //- locked cards rendered in ItemsLocked
  template(v-for="card in lockedCards" :key="card.id")
    teleport(to="#locked-cards")
      Card(:card="card")
  //- list cards rendered in List
</template>

<style lang="stylus">
</style>
