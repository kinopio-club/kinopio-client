<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import cache from '@/cache.js'
import CardList from '@/components/CardList.vue'
import Loader from '@/components/Loader.vue'
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
  isLoading: false
})

const loadInboxSpace = () => {
  store.dispatch('currentSpace/loadInboxSpace')
}

// const hasInboxSpace = computed(() => !state.cards.length)
const updateInboxCardsLocal = () => {
  state.cards = cache.getInboxSpace()?.cards
}
const updateInboxCardsRemote = async () => {
  if (!store.state.isOnline) { return }
  const inboxLocal = cache.getInboxSpace()
  // inboxRemote = await
  // compare cache vs remote dates, replace state.cards if newer (or if no inboxLocal)
  // update LS w fetched space
  // state.cards = ..
}

const restoreInboxCards = async () => {
  if (state.isLoading) { return }
  try {
    state.isLoading = true
    updateInboxCardsLocal()
    // await updateInboxCardsRemote()
  } catch (error) {
    console.error('🚒 restoreInboxCards')
  }
  state.isLoading = false
}
const selectCard = (card) => {
  console.log(card)
  // queue operation: remove card from inbox
  // queue operation: move card to currentSpace
}
</script>

<template lang="pug">
//- template(v-if="hasInboxSpace")
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
    CardList(:cards="state.cards" @selectCard="selectCard")
//- button(@click="incrementBy")
//-   span Count is: {{ state.count }}
//- p Current theme is: {{ themeName }}, prop is {{ visible }}
//- template(v-else)
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
