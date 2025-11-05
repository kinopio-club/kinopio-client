<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useLineStore } from '@/stores/useLineStore'

import Line from '@/components/Line.vue'
// import CardCommentPreview from '@/components/CardCommentPreview.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const lineStore = useLineStore()

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
const lines = computed(() => lineStore.getAllLines)
</script>

<template lang="pug">
.lines
  template(v-for="line in lines" :key="line.id")
    Line(:line="line")
</template>

<style lang="stylus">
.lines
  position absolute
  pointer-events none
  width 100%
  height 100%
</style>
