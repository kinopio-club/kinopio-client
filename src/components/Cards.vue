<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useListStore } from '@/stores/useListStore'

import Card from '@/components/Card.vue'
import ItemSnapGuide from '@/components/ItemSnapGuide.vue'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const listStore = useListStore()

const cards = computed(() => {
  // exclude if unlocked
  const cards = cardStore.getCardsIsNotLocked
  // exclude if in collapsed list
  const lists = listStore.getCollapsedLists
  const listIds = lists.map(list => list.id)
  return cards.filter(card => !listIds.includes(card.listId))
})
const lockedCards = computed(() => cardStore.getAllCards.filter(card => card.isLocked))

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
</template>

<style lang="stylus">
</style>
