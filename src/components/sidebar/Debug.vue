<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
const store = useStore()

let prevPosition

onMounted(() => {
  updateHistory()
  window.addEventListener('pointerdown', updatePrevPosition)
})
const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateHistory()
  }
})

const state = reactive({
  history: [],
  isLoading: false,
  unknownServerError: false
})

const isOnline = computed(() => store.state.isOnline)
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const updatePrevPosition = (event) => {
  if (!props.visible) { return }
  prevPosition = utils.cursorPositionInPage(event)
}

// list cards

const updateHistory = async () => {
  state.unknownServerError = false
  if (state.isLoading) { return }
  try {
    state.isLoading = true
    console.log('🍇🍇🍇')
    // await store.dispatch('api/')
    // api/
  } catch (error) {
    console.error('🚒 updateHistory', error)
    state.unknownServerError = true
  }
  state.isLoading = false
}

// update card

// const updateCardIsLoading = (newCard) => {
//   state.cards = state.cards.map(card => {
//     if (card.id === newCard.id) {
//       card.isLoading = true
//     }
//     return card
//   })
// }
// const selectCard = async (card) => {
//   if (card.isLoading) { return }
//   if (!canEditSpace.value) {
//     store.commit('addNotificationWithPosition', { message: 'Space is Read Only', position: prevPosition, type: 'info', layer: 'app', icon: 'cancel' })
//     return
//   }
//   updateCardIsLoading(card)
//   const scroll = store.getters.windowScrollWithSpaceOffset()
//   let newCard = utils.clone(card)
//   newCard.id = nanoid()
//   newCard.spaceId = store.state.currentSpace.id
//   newCard.x = scroll.x + 100 // matches KeyboardShortcutsHandler.addCard
//   newCard.y = scroll.y + 120 // matches KeyboardShortcutsHandler.addCard
//   const spaceCards = store.getters['currentCards/all']
//   newCard = utils.uniqueCardPosition(newCard, spaceCards)
//   store.dispatch('currentCards/add', newCard)
//   store.commit('cardDetailsIsVisibleForCardId', newCard.id)
//   removeCardFromInbox(card)
// }
// const removeCard = (card) => {
//   if (card.isLoading) { return }
//   updateCardIsLoading(card)
//   removeCardFromInbox(card)
// }

</script>

<template lang="pug">
section.inbox(v-if="visible")
  .row.title-row
    div
      span.badge.info Beta
      span Space History Log
      Loader(:visible="state.isLoading" :isSmall="true")
    //- .button-wrap
    //-   button.small-button(@click="loadInboxSpace")
    //-     img.icon(src="@/assets/inbox.svg")
    //-     span Inbox
  OfflineBadge

//- section.results-section.inbox(v-if="visible && isOnline")
//-   ul.results-list(v-if="state.cards.length")
//-     CardList(:cards="state.cards" @selectCard="selectCard" :cardsShowRemoveButton="true" @removeCard="removeCard")
//-   section.subsection(v-else)
//-     p Cards added to your inbox can be moved into this space
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
