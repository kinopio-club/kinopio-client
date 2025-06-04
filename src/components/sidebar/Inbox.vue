<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import cache from '@/cache.js'
import CardList from '@/components/CardList.vue'
import Loader from '@/components/Loader.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'
import AddToInbox from '@/components/AddToInbox.vue'
import utils from '@/utils.js'

import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'
import { nanoid } from 'nanoid'

const store = useStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

let prevPosition

onMounted(() => {
  restoreInboxCards()
  window.addEventListener('pointerdown', updatePrevPosition)
})
const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    restoreInboxCards()
  }
})

const state = reactive({
  cards: [],
  isLoading: false,
  noInboxCardsFound: false
})

const isOnline = computed(() => store.state.isOnline)
const canEditSpace = computed(() => userStore.getUserCanEditSpace())
const updatePrevPosition = (event) => {
  if (!props.visible) { return }
  prevPosition = utils.cursorPositionInPage(event)
}

const loadInboxSpace = () => {
  spaceStore.loadInboxSpace()
}

// list cards

const updateInboxCardsLocal = async () => {
  const inboxSpace = await cache.getInboxSpace()
  if (inboxSpace) {
    state.cards = inboxSpace.cards
    sortCards()
  }
}
const updateInboxCardsRemote = async () => {
  if (!store.state.isOnline) { return }
  await spaceStore.updateInboxCache()
  updateInboxCardsLocal()
}
const sortCards = () => {
  state.cards = sortBy(state.cards, card => dayjs(card.nameUpdatedAt || card.updatedAt).valueOf())
  state.cards.reverse()
}
const restoreInboxCards = async () => {
  if (state.isLoading) { return }
  try {
    state.isLoading = true
    updateInboxCardsLocal()
    updateInboxCardsRemote()
  } catch (error) {
    console.error('🚒 restoreInboxCards', error)
  }
  state.isLoading = false
}

// remove card

const removeFromCardList = (removedCard) => {
  state.cards = state.cards.filter(card => card.id !== removedCard.id)
  // update cache
  cache.updateSpace('cards', state.cards, removedCard.spaceId)
}
const removeCardFromInbox = async (card) => {
  removeFromCardList(card)
  await apiStore.addToQueue({ name: 'removeCard', body: card, spaceId: card.spaceId })
}

// update card

const updateCardIsLoading = (newCard) => {
  state.cards = state.cards.map(card => {
    if (card.id === newCard.id) {
      card.isLoading = true
    }
    return card
  })
}
const selectCard = async (card) => {
  if (card.isLoading) { return }
  if (!canEditSpace.value) {
    store.commit('addNotificationWithPosition', { message: 'Space is Read Only', position: prevPosition, type: 'info', layer: 'app', icon: 'cancel' })
    return
  }
  updateCardIsLoading(card)
  const scroll = store.getters.windowScrollWithSpaceOffset()
  const skipCardDetailsIsVisible = true
  let newCard = utils.clone(card)
  newCard.id = nanoid()
  newCard.spaceId = spaceStore.id
  newCard.x = scroll.x + 100 // matches KeyboardShortcutsHandler.addCard
  newCard.y = scroll.y + 120 // matches KeyboardShortcutsHandler.addCard
  const spaceCards = cardStore.getAllCards
  newCard = utils.uniqueCardPosition(newCard, spaceCards)
  cardStore.createCard(newCard, skipCardDetailsIsVisible)
  store.dispatch('focusOnCardId', newCard.id)
  removeCardFromInbox(card)
}
const removeCard = (card) => {
  if (card.isLoading) { return }
  updateCardIsLoading(card)
  removeCardFromInbox(card)
}
const addCard = (card) => {
  state.cards.unshift(card)
}
</script>

<template lang="pug">
template(v-if="visible")
  AddToInbox(:visible="isOnline" @addCard="addCard")
  section.inbox
    span Move from Inbox
    Loader(:visible="state.isLoading" :isSmall="true")
    OfflineBadge

  section.results-section.inbox(v-if="isOnline")
    ul.results-list(v-if="state.cards.length")
      CardList(:cards="state.cards" @selectCard="selectCard" :cardsShowRemoveButton="true" @removeCard="removeCard")
    section.subsection(v-else)
      p Cards added to your inbox can be moved into this space
</template>

<style lang="stylus">
section.inbox
  .loader
    margin-left 6px
    vertical-align -2px
  .subsection
    margin 4px
    margin-top 0
</style>
