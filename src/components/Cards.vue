<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Card from '@/components/Card.vue'
import CardCommentPreview from '@/components/CardCommentPreview.vue'
import utils from '@/utils.js'

const store = useStore()

const unlockedCards = computed(() => store.getters['currentCards/isNotLocked'])
const lockedCards = computed(() => store.getters['currentCards/isLocked'])

// card comment preview

const currentHoveredCard = computed(() => {
  const cardId = store.state.currentUserIsHoveringOverCardId
  if (!cardId) { return }
  const card = store.getters['currentCards/byId'](cardId)
  return card
})
const currentHoveredCardIsComment = computed(() => {
  const card = currentHoveredCard.value
  if (!card) { return }
  const isComment = store.getters['currentCards/isComment'](card)
  return isComment
})
const cardCommentPreviewIsVisible = computed(() => {
  if (shouldPrevent.value) { return }
  const cardId = store.state.currentUserIsHoveringOverCardId
  const cardDetailsIsVisible = cardId === store.state.cardDetailsIsVisibleForCardId
  if (cardDetailsIsVisible) { return }
  return currentHoveredCardIsComment.value
})
const shouldPrevent = computed(() => {
  const isHoveringOverConnector = store.state.currentUserIsHoveringOverConnectorItemId
  const isHoveringOverCheckbox = store.state.currentUserIsHoveringOverCheckboxCardId
  const isHoveringOverLinkButton = store.state.currentUserIsHoveringOverUrlButtonCardId
  const isInteractingWithItem = store.getters.isInteractingWithItem
  return isInteractingWithItem || isHoveringOverConnector || isHoveringOverCheckbox || isHoveringOverLinkButton
})
</script>

<template lang="pug">
.cards
  template(v-for="card in unlockedCards" :key="card.id")
    Card(:card="card")
  CardCommentPreview(:visible="cardCommentPreviewIsVisible" :card="currentHoveredCard")
  //- locked cards rendered in ItemsLocked
  template(v-for="card in lockedCards" :key="card.id")
    teleport(to="#locked-cards")
      Card(:card="card")
</template>

<style lang="stylus">
</style>
