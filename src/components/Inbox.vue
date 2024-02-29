<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import cache from '@/cache.js'
import CardList from '@/components/CardList.vue'
import Loader from '@/components/Loader.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'
import utils from '@/utils.js'

import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
const store = useStore()

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
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const updatePrevPosition = (event) => {
  if (!props.visible) { return }
  prevPosition = utils.cursorPositionInPage(event)
}

const loadInboxSpace = () => {
  store.dispatch('currentSpace/loadInboxSpace')
}

// list cards

const updateInboxCardsLocal = () => {
  state.cards = cache.getInboxSpace()?.cards
  sortCards()
}
const updateInboxCardsRemote = async () => {
  if (!store.state.isOnline) { return }
  await store.dispatch('currentSpace/updateInboxCache')
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
    console.error('🚒 restoreInboxCards')
  }
  state.isLoading = false
}

// remove card

const removeFromCardList = (removedCard) => {
  state.cards = state.cards.filter(card => card.id !== removedCard.id)
  // update cache
  cache.updateSpace('cards', state.cards, removedCard.spaceId)
}
const removeCardFromInbox = (card) => {
  store.dispatch('api/addToQueue', { name: 'removeCard', body: card, spaceId: card.spaceId })
  removeFromCardList(card)
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
  let newCard = utils.clone(card)
  newCard.id = nanoid()
  newCard.spaceId = store.state.currentSpace.id
  newCard.x = scroll.x + 100 // matches KeyboardShortcutsHandler.addCard
  newCard.y = scroll.y + 120 // matches KeyboardShortcutsHandler.addCard
  const spaceCards = store.getters['currentCards/all']
  newCard = utils.uniqueCardPosition(newCard, spaceCards)
  store.dispatch('currentCards/add', newCard)
  store.commit('cardDetailsIsVisibleForCardId', newCard.id)
  removeCardFromInbox(card)
}
const removeCard = (card) => {
  if (card.isLoading) { return }
  updateCardIsLoading(card)
  removeCardFromInbox(card)
}

</script>

<template lang="pug">
section.inbox(v-if="visible")
  .row.title-row
    div
      span Move from Inbox
      Loader(:visible="state.isLoading" :isSmall="true")
    .button-wrap
      button.small-button(@click="loadInboxSpace")
        img.icon(src="@/assets/inbox.svg")
        span Inbox
  OfflineBadge
section.results-section(v-if="visible && isOnline")
  ul.results-list
    CardList(:cards="state.cards" @selectCard="selectCard" :cardsShowRemoveButton="true" @removeCard="removeCard")
</template>

<style lang="stylus">
section.inbox
  .loader
    margin-left 6px
    vertical-align -2px
</style>
