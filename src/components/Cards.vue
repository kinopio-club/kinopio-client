<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'

import Card from '@/components/Card.vue'
import CardCommentPreview from '@/components/CardCommentPreview.vue'
import ItemSnapGuide from '@/components/ItemSnapGuide.vue'

const globalStore = useGlobalStore()
const cardStore = useCardStore()

const cards = computed(() => cardStore.getAllCards)
const lockedCards = computed(() => cards.value.filter(card => card.isLocked))
const unlockedCards = computed(() => cards.value.filter(card => !card.isLocked))

// card comment preview

const currentHoveredCard = computed(() => {
  const cardId = globalStore.currentUserIsHoveringOverCardId
  if (!cardId) { return }
  const card = cardStore.getCard(cardId)
  return card
})
const currentHoveredCardIsComment = computed(() => {
  const card = currentHoveredCard.value
  if (!card) { return }
  return cardStore.getIsCommentCard(card)
})
const cardCommentPreviewIsVisible = computed(() => {
  if (shouldPrevent.value) { return }
  const cardId = globalStore.currentUserIsHoveringOverCardId
  const cardDetailsIsVisible = cardId === globalStore.cardDetailsIsVisibleForCardId
  if (cardDetailsIsVisible) { return }
  return currentHoveredCardIsComment.value
})
const shouldPrevent = computed(() => {
  const isHoveringOverConnector = globalStore.currentUserIsHoveringOverConnectorItemId
  const isHoveringOverCheckbox = globalStore.currentUserIsHoveringOverCheckboxCardId
  const isHoveringOverLinkButton = globalStore.currentUserIsHoveringOverUrlButtonCardId
  const isInteractingWithItem = globalStore.getIsInteractingWithItem
  return isInteractingWithItem || isHoveringOverConnector || isHoveringOverCheckbox || isHoveringOverLinkButton
})
</script>

<template lang="pug">
.cards
  template(v-for="card in unlockedCards" :key="card.id")
    Card(:card="card")
    ItemSnapGuide(:card="card")
  CardCommentPreview(:visible="cardCommentPreviewIsVisible" :card="currentHoveredCard")
  //- locked cards rendered in ItemsLocked
  template(v-for="card in lockedCards" :key="card.id")
    teleport(to="#locked-cards")
      Card(:card="card")
</template>

<style lang="stylus">
</style>
