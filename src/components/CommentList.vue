<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import CardList from '@/components/CardList.vue'
import utils from '@/utils.js'

import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'

const store = useStore()

const comments = computed(() => {
  let cards = store.getters['currentCards/all']
  cards = utils.clone(cards)
  cards = cards.filter(card => {
    if (card.isComment) { return true }
    return utils.isNameComment(card.name)
  })
  cards = cards.map(card => {
    card.user = userById(card.userId)
    card.nameSegments = utils.cardNameSegments(card.name)
    return card
  })
  cards = sortBy(cards, card => dayjs(card.nameUpdatedAt || card.updatedAt).valueOf())
  cards.reverse()
  return cards
})

const showCardDetails = (card) => {
  const filterComments = store.state.currentUser.filterComments
  if (filterComments) {
    store.dispatch('currentUser/toggleFilterComments', false)
  }
  store.dispatch('currentCards/showCardDetails', card.id)
}
const userById = (userId) => {
  return store.getters['currentSpace/userById'](userId)
}
const relativeDate = (card) => {
  return utils.shortRelativeTime(card.nameUpdatedAt || card.updatedAt)
}
</script>

<template lang="pug">
section.results-section.comments
  CardList(:cards="comments" @selectCard="showCardDetails")
  section.subsection.tips-section(v-if="!comments.length")
    p No comment cards in this space yet
    p
      span.badge.secondary Card →{{' '}}
        img.icon.down-arrow.down-arrow-inline(src="@/assets/down-arrow.svg")
        span →
        img.icon.comment-icon(src="@/assets/comment.svg")
</template>

<style lang="stylus">
section.comments
  section.tips-section
    margin 4px
    margin-top 0
    .comment-icon
      margin-left 4px
      vertical-align -2px
    .down-arrow-inline
      vertical-align 2px
</style>
