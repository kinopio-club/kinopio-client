<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import CardList from '@/components/CardList.vue'
import utils from '@/utils.js'

import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'

const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const comments = computed(() => {
  let cards = cardStore.getAllCards
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
  const filterComments = userStore.filterComments
  if (filterComments) {
    userStore.updateCard({ filterComments: false })
  }
  cardStore.showCardDetails(card.id)
}
const userById = (userId) => {
  return spaceStore.getSpaceUserById(userId)
}
</script>

<template lang="pug">
section.results-section.comments
  CardList(:cards="comments" @selectCard="showCardDetails" :dateIsCreatedAt="true")
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
