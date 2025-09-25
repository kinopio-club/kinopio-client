<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import cache from '@/cache.js'
import CardList from '@/components/CardList.vue'
import Loader from '@/components/Loader.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'
import AddToInbox from '@/components/AddToInbox.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'
import { nanoid } from 'nanoid'

const globalStore = useGlobalStore()
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

const isOnline = computed(() => globalStore.isOnline)
const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const updatePrevPosition = (event) => {
  if (!props.visible) { return }
  prevPosition = utils.cursorPositionInPage(event)
}
const inboxUrl = computed(() => `${consts.kinopioDomain()}/inbox`)

// list cards

const updateInboxCardsLocal = async () => {
  const inboxSpace = await cache.getInboxSpace()
  if (inboxSpace) {
    state.cards = inboxSpace.cards
    sortCards()
  }
}
const updateInboxCardsRemote = async () => {
  await spaceStore.updateInboxCache()
  await updateInboxCardsLocal()
}
const sortCards = () => {
  state.cards = sortBy(state.cards, card => dayjs(card.nameUpdatedAt || card.updatedAt).valueOf())
  state.cards.reverse()
}
const restoreInboxCards = async () => {
  if (state.isLoading) { return }
  try {
    state.isLoading = true
    await updateInboxCardsLocal()
    await updateInboxCardsRemote()
  } catch (error) {
    console.error('🚒 restoreInboxCards', error)
  } finally {
    state.isLoading = false
  }
}

// remove card

const removeFromCardList = (removedCard) => {
  state.cards = state.cards.filter(card => card.id !== removedCard.id)
  // update cache
  cache.updateSpace('cards', state.cards, removedCard.spaceId)
}
const removeCardFromInbox = async (card) => {
  card = utils.clone(card)
  delete card.user
  removeFromCardList(card)
  await apiStore.addToQueue({ name: 'removeCard', body: card, spaceId: card.spaceId })
}
const removeCard = (card) => {
  if (card.isLoading) { return }
  updateCardIsLoading(card)
  removeCardFromInbox(card)
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
  console.error('🐸🐸🐸', card)

  if (card.isLoading) { return }
  if (!canEditSpace.value) {
    globalStore.addNotificationWithPosition({ message: 'Space is Read Only', position: prevPosition, type: 'info', layer: 'app', icon: 'cancel' })
    return
  }
  updateCardIsLoading(card)
  console.log('🔮🔮🔮3')

  const scroll = globalStore.getWindowScrollWithSpaceOffset
  let newCard = utils.clone(card)
  console.log('💐💐', newCard)

  newCard.id = nanoid()
  newCard.spaceId = spaceStore.id
  newCard.x = scroll.x + 100 // matches KeyboardShortcutsHandler.addCard
  newCard.y = scroll.y + 120 // matches KeyboardShortcutsHandler.addCard
  const spaceCards = cardStore.getAllCards
  console.log('🔮🔮', newCard)

  newCard = utils.uniqueCardPosition(newCard, spaceCards)

  delete newCard.user
  console.log('🔮', newCard)

  cardStore.createCard(newCard, true) // skipCardDetailsIsVisible
  globalStore.updateFocusOnCardId(newCard.id)
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
    .row.title-row
      div
        span Move from Inbox
        Loader(:visible="state.isLoading" :isSmall="true")
        OfflineBadge
      a(:href="inboxUrl")
        button.small-button
          img.icon(src="@/assets/inbox.svg")
          img.icon.visit(src="@/assets/visit.svg")

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
