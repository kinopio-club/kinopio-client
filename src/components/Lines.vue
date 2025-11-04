<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useLineStore } from '@/stores/useLineStore'

import Line from '@/components/Line.vue'
// import CardCommentPreview from '@/components/CardCommentPreview.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
// const cardStore = useCardStore()

// const cards = computed(() => cardStore.getAllCards)
// const lockedCards = computed(() => cards.value.filter(card => card.isLocked))
// const unlockedCards = computed(() => cards.value.filter(card => !card.isLocked))

// card comment preview

// const currentHoveredCard = computed(() => {
//   const cardId = globalStore.currentUserIsHoveringOverCardId
//   if (!cardId) { return }
//   const card = cardStore.getCard(cardId)
//   return card
// })
// const currentHoveredCardIsComment = computed(() => {
//   const card = currentHoveredCard.value
//   if (!card) { return }
//   return cardStore.getIsCommentCard(card)
// })
// const cardCommentPreviewIsVisible = computed(() => {
//   if (shouldPrevent.value) { return }
//   const cardId = globalStore.currentUserIsHoveringOverCardId
//   const cardDetailsIsVisible = cardId === globalStore.cardDetailsIsVisibleForCardId
//   if (cardDetailsIsVisible) { return }
//   return currentHoveredCardIsComment.value
// })
// const shouldPrevent = computed(() => {
//   const isHoveringOverConnector = globalStore.currentUserIsHoveringOverConnectorItemId
//   const isHoveringOverCheckbox = globalStore.currentUserIsHoveringOverCheckboxCardId
//   const isHoveringOverLinkButton = globalStore.currentUserIsHoveringOverUrlButtonCardId
//   const isInteractingWithItem = globalStore.getIsInteractingWithItem
//   return isInteractingWithItem || isHoveringOverConnector || isHoveringOverCheckbox || isHoveringOverLinkButton
// })
</script>

<template lang="pug">
.lines
  Line

  //- .cards
  //-   template(v-for="card in unlockedCards" :key="card.id")
  //-     Card(:card="card")
</template>

<style lang="stylus">
.lines
  position absolute
  pointer-events none
  width 100%
  height 100%
</style>
