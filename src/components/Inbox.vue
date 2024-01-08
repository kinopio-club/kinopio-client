<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import cache from '@/cache.js'
import CardList from '@/components/CardList.vue'
import Loader from '@/components/Loader.vue'

import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'
const store = useStore()

onMounted(() => {
  restoreInboxCards()
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

const loadInboxSpace = () => {
  store.dispatch('currentSpace/loadInboxSpace')
}

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

const updateCardIsLoading = (newCard) => {
  state.cards = state.cards.map(card => {
    if (card.id === newCard.id) {
      card.isLoading = true
    }
    return card
  })
}

const selectCard = (card) => {
  console.log(card, card.isLoading)
  if (card.isLoading) { return }
  updateCardIsLoading(card)
  // const inboxId = cache.getInboxSpace().id
  // api req: move card to currentSpace
  // api req operation: remove card from inbox
}

const removeCard = (card) => {
  console.log('🐸', card)
  if (card.isLoading) { return }
  updateCardIsLoading(card)
  // queue operation: remove card from inbox
}
</script>

<template lang="pug">
section.inbox
  .row.title-row
    div
      span Move from Inbox
      Loader(:visible="state.isLoading" :isSmall="true")
    .button-wrap
      button.small-button(@click="loadInboxSpace")
        img.icon(src="@/assets/inbox.svg")
        span Inbox

section.results-section(v-if="visible")
  ul.results-list
    CardList(:cards="state.cards" @selectCard="selectCard" :cardsShowRemoveButton="true" @removeCard="removeCard")
//- button(@click="incrementBy")
//-   span Count is: {{ state.count }}
//- p Current theme is: {{ themeName }}, prop is {{ visible }}
//- template(v-if="state.noInboxCardsFound")
//-   section // .badge.danger
//-     p Inbox not found
//-     p Add space..
</template>

<style lang="stylus">
// .component-name
section.inbox
  .loader
    margin-left 6px
    vertical-align -2px
//   padding-top 4px
//   border-top 1px solid var(--primary-border)
//   padding 4px
</style>
