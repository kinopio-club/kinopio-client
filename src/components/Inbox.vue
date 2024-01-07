<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import cache from '@/cache.js'
import CardList from '@/components/CardList.vue'
import Loader from '@/components/Loader.vue'
const store = useStore()

onMounted(() => {
  console.log(`🐴🐴🐴`)
  updateInboxCache()
  restoreCards()
  // store.subscribe((mutation, state) => {
  //   if (mutation.type === 'triggerUpdateOtherCard') {
  //     mutation.payload
  //   }
  // })
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  cards: [],
  inboxCache: [],
  isLoading: true
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    console.log('🐸🐸🐸')
    updateInboxCache()
    restoreCards()
  }
})

// const hasInboxSpace = computed(() => !state.cards.length)
const updateInboxCache = () => {
  state.inboxCache = cache.getInboxSpace()
}

const restoreCards = async () => {
  try {
    state.cards = [{ id: 1, name: 'yoyoyoy' }]
    // const inboxCache = inboxSpace
    // state.cards = cached inbox
    // state.isLoading = true
    // const inboxRemote = await
    // compare cache vs remote dates, replace state.cards if newer
  } catch (error) {

  }
}
const changeSpaceToInbox = () => {

}
const selectCard = (card) => {
  console.log(card)
}
</script>

<template lang="pug">
//- template(v-if="hasInboxSpace")
section.inbox
  .row.title-row
    div
      span Inbox Cards
      Loader(:visible="true" :isSmall="true")
    .button-wrap
      button.small-button(@click="changeSpaceToInbox")
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
