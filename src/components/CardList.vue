<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import CardListItem from '@/components/CardListItem.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import { colord, extend } from 'colord'
import namesPlugin from 'colord/plugins/names'

dayjs.extend(isToday)

const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const themeStore = useThemeStore()
const globalStore = useGlobalStore()

const itemsPerPage = 15
const minItemHeight = 32 // 36 // 37.5
const resultsListElement = ref(null)
let unsubscribes

onMounted(() => {
  updateScroll()
  resultsListElement.value.closest('section').addEventListener('scroll', updateScroll)
  if (props.disableListOptimizations) {
    state.currentPage = totalPages.value
  }

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerRemoveCardFromCardList') {
        const card = args[0]
        state.removedCardIds.push(card.id)
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const emit = defineEmits(['selectCard', 'removeCard'])

const props = defineProps({
  cards: Array,
  search: String,
  cardsShowRemoveButton: Boolean,
  shouldHideDate: Boolean,
  dateIsCreatedAt: Boolean,
  resultsSectionHeight: Number,
  currentCard: Object,
  disableListOptimizations: Boolean
})

const state = reactive({
  removedCardIds: [],
  scrollY: 0,
  currentPage: 1,
  prevScrollAreaHeight: 0
})

const normalizedCards = computed(() => {
  const items = props.cards.filter(card => !state.removedCardIds.includes(card.id))
  return items.map(card => {
    card = cardStore.cardWithNameSegments(card, true)
    card.user = spaceStore.getSpaceUserById(card.userId)
    globalStore.updateOtherUsers(card.user)
    if (!card.user) {
      card.user = {
        id: '',
        name: '',
        color: undefined
      }
    }
    return card
  })
})
const selectCard = (card) => {
  emit('selectCard', card)
}
const removeCard = (card) => {
  emit('removeCard', card)
}

// scroll

watch(() => props.resultsSectionHeight, async (value, prevValue) => {
  await nextTick()
  updateScroll()
})
watch(() => props.isLoading, async (value, prevValue) => {
  await nextTick()
  updateScroll()
})
const updateScroll = async () => {
  await nextTick()
  let element = resultsListElement.value
  if (!element) { return }
  element = element.closest('section')
  if (!element) {
    console.error('scroll element not found', element)
  }
  state.scrollY = element.scrollTop
  const scrollHeight = element.getBoundingClientRect().height
  state.pageHeight = itemsPerPage * minItemHeight * state.currentPage
  updateCurrentPage()
}

// list render optimization

const updateCurrentPage = () => {
  const zoom = utils.pinchCounterZoomDecimal()
  const perPageHeight = itemsPerPage * minItemHeight
  const isNextPage = (state.scrollY * zoom) + perPageHeight >= state.pageHeight
  if (isNextPage) {
    state.currentPage = Math.min(state.currentPage + 1, totalPages.value)
  }
}
const totalPages = computed(() => {
  const items = props.cards
  const total = Math.ceil(items.length / itemsPerPage)
  return total
})
const itemsRendered = computed(() => {
  const max = state.currentPage * itemsPerPage
  return normalizedCards.value.slice(0, max)
})

</script>

<template lang="pug">
span
  ul.results-list.card-list(ref="resultsListElement")
    .prev-scroll-area-height(:style="{height: state.prevScrollAreaHeight + 'px'}")
    template(v-for="card in itemsRendered" :key="card.id")
      CardListItem(
        :card="card"
        :search="props.search"
        :cardsShowRemoveButton="props.cardsShowRemoveButton"
        :shouldHideDate="props.shouldHideDate"
        :dateIsCreatedAt="props.dateIsCreatedAt"
        :resultsSectionHeight="props.resultsSectionHeight"
        :currentCard="props.currentCard"
        @selectCard="selectCard"
      )
</template>

<style lang="stylus">
// .card-list
</style>
