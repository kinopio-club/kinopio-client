<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Card from '@/components/Card.vue'
import CardCommentPreview from '@/components/CardCommentPreview.vue'
import utils from '@/utils.js'

const store = useStore()

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerUpdateUrlPreviewComplete') {
      store.dispatch('currentCards/checkIfShouldUpdateNewTweetCards')
    }
  })
})

const unlockedCards = computed(() => store.getters['currentCards/isNotLocked'])

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
  const isHoveringOverConnector = store.state.currentUserIsHoveringOverConnectorCardId
  const isHoveringOverCheckbox = store.state.currentUserIsHoveringOverCheckboxCardId
  const isInteractingWithItem = store.getters.isInteractingWithItem
  return isInteractingWithItem || isHoveringOverConnector || isHoveringOverCheckbox
})
</script>

<template lang="pug">
.cards
  //- locked cards rendered in ItemsLocked
  template(v-for="card in unlockedCards" :key="card.id")
    Card(:card="card")
  CardCommentPreview(:visible="cardCommentPreviewIsVisible" :card="currentHoveredCard")
</template>

<style lang="stylus">
</style>
