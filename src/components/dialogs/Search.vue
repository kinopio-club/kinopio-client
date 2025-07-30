<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import ResultsFilter from '@/components/ResultsFilter.vue'
import SearchFilters from '@/components/SearchFilters.vue'
import CardList from '@/components/CardList.vue'
import SpaceCardList from '@/components/SpaceCardList.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'
import orderBy from 'lodash-es/orderBy'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

const dialogElement = ref(null)
const resultsElement = ref(null)

const maxIterations = 30
let currentIteration, updatePositionTimer
let unsubscribes

onMounted(() => {
  window.addEventListener('resize', updateHeights)

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerSearchScopeIsRemote') {
        updateScopeIsCurrentSpace(false)
      } else if (name === 'triggerSearchScopeIsCurrentSpace') {
        updateScopeIsCurrentSpace(true)
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateHeights)
  unsubscribes()
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  resultsSectionHeight: null,
  isLoading: false,
  scopeIsCurrentSpace: true,
  hasSearched: false,
  searchResultsRemoteCards: []
})

watch(() => props.visible, (value, prevValue) => {
  updateHeights()
  if (value) {
    state.hasSearched = false
    globalStore.shouldExplicitlyHideFooter = true
    if (utils.isMobile()) { return }
    triggerFocusResultsFilter()
  } else {
    globalStore.shouldExplicitlyHideFooter = false
  }
})
const triggerFocusResultsFilter = async () => {
  await nextTick()
  globalStore.triggerFocusResultsFilter()
}
const currentUser = computed(() => userStore.getUserAllState)
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)

// search

const search = computed(() => globalStore.search)
const noResults = computed(() => state.hasSearched && !cards.value.length)
const updateScopeIsCurrentSpace = (value) => {
  state.scopeIsCurrentSpace = value
  updateSearch(search.value)
}
const updateSearch = async (search) => {
  globalStore.search = search
  if (!search) {
    clearSearch()
  }
  if (search && state.scopeIsCurrentSpace) {
    updateResultsFromResultsFilter(cardsToSearch.value)
  } else if (search && !state.scopeIsCurrentSpace) {
    await searchRemoteCards(search)
  }
  await nextTick()
  if (cards.value.length && search.value) {
    focusFirstItem()
  }
}
const searchRemoteCards = async (search) => {
  state.isLoading = true
  const results = await apiStore.searchCards({ query: search })
  const ids = results.map(result => result.id)
  state.searchResultsRemoteCards = results
  globalStore.searchResultsCardIds = ids
  state.isLoading = false
  state.hasSearched = true
}
const updateResultsFromResultsFilter = (cards) => {
  globalStore.previousResultItem = {}
  const ids = cards.map(card => card.id)
  globalStore.searchResultsCardIds = ids
}
const clearSearch = async () => {
  await nextTick()
  globalStore.clearSearch()
  state.hasSearched = false
}
const searchResultsCards = computed(() => {
  if (state.scopeIsCurrentSpace) {
    return globalStore.searchResultsCardIds.map(id => cardStore.getCard(id))
  } else {
    return state.searchResultsRemoteCards
  }
})
const previousResultItem = computed(() => globalStore.previousResultItem)
const cards = computed(() => {
  let cards
  if (search.value) {
    return searchResultsCards.value
  } else {
    return cardsToSearch.value
  }
})
const cardsToSearch = computed(() => {
  if (state.scopeIsCurrentSpace) {
    return recentlyUpdatedCards.value
  } else {
    return searchResultsCards.value
  }
})
const recentlyUpdatedCards = computed(() => {
  let cards = cardStore.getAllCards
  cards = utils.clone(cards)
  cards = cards.filter(card => card.name)
  cards = cards.map(card => {
    const date = card.nameUpdatedAt || card.createdAt
    card.date = dayjs(date)
    return card
  })
  cards = orderBy(cards, (a) => new Date(a.date), ['desc'])
  return cards
})

// select items

const selectCard = (card) => {
  const isCardInCurrentSpace = card.spaceId === spaceStore.id
  if (isCardInCurrentSpace) {
    globalStore.updateFocusOnCardId(card.id)
    focusItem(card)
  } else {
    selectSpaceCard(card)
  }
  closeDialogs()
}
const changeSpace = (spaceId) => {
  if (spaceStore.id === spaceId) { return }
  const space = { id: spaceId }
  spaceStore.changeSpace(space)
}
const selectSpaceCard = (card) => {
  changeSpace(card.spaceId)
  globalStore.loadSpaceFocusOnCardId = card.id
}

// keyboard nav

const selectCurrentFocusedItem = () => {
  globalStore.shouldPreventNextEnterKey = true
  const card = previousResultItem.value
  selectCard(card)
}
const focusNextItem = () => {
  const items = cards.value
  if (!previousResultItem.value.id) {
    focusFirstItem()
    return
  }
  const currentIndex = items.findIndex(card => card.id === previousResultItem.value.id)
  const index = currentIndex + 1
  if (items.length === index) {
    return
  }
  focusItem(items[index])
}
const focusPreviousItem = () => {
  const items = cards.value
  if (!previousResultItem.value.id) {
    focusItem(items[0])
    return
  }
  const currentIndex = items.findIndex(card => card.id === previousResultItem.value.id)
  let index = currentIndex - 1
  if (index < 0) {
    index = 0
  }
  focusItem(items[index])
}
const focusFirstItem = () => {
  const items = cards.value
  focusItem(items[0])
}
const focusItem = (item) => {
  globalStore.previousResultItem = item
}

// dialog

const dialogIsPinned = computed(() => globalStore.searchIsPinned)
const placeholder = computed(() => {
  let text = 'Search Cards'
  let shift = ''
  if (!utils.isMobile()) {
    if (!state.scopeIsCurrentSpace) {
      shift = 'Shift-'
    }
    text = text + ` (${utils.metaKey()}-${shift}F)`
  }
  return text
})
const closeDialogs = () => {
  globalStore.triggerMoreFiltersIsNotVisible()
}
const updateHeights = () => {
  if (!props.visible) {
    window.cancelAnimationFrame(updatePositionTimer)
    updatePositionTimer = undefined
    return
  }
  currentIteration = 0
  if (updatePositionTimer) { return }
  updatePositionTimer = window.requestAnimationFrame(updatePositionFrame)
}
const updatePositionFrame = () => {
  currentIteration++
  updateDialogHeight()
  updateResultsSectionHeight()
  if (currentIteration < maxIterations) {
    window.requestAnimationFrame(updatePositionFrame)
  } else {
    window.cancelAnimationFrame(updatePositionTimer)
    updatePositionTimer = undefined
  }
}

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const updateResultsSectionHeight = async () => {
  await nextTick()
  const element = resultsElement.value
  state.resultsSectionHeight = utils.elementHeight(element) - 2
}
const triggerSignUpOrInIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSignUpOrInIsVisible()
}

</script>

<template lang="pug">
dialog.search.is-pinnable(@click="closeDialogs" v-if="visible" :open="visible" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" :data-is-pinned="dialogIsPinned" :class="{'is-pinned': dialogIsPinned}")
  SearchFilters
  section
    .segmented-buttons
      button(@click="updateScopeIsCurrentSpace(true)" :class="{ active: state.scopeIsCurrentSpace }")
        span Current Space
      button(@click="updateScopeIsCurrentSpace(false)" :class="{ active: !state.scopeIsCurrentSpace }")
        span All Spaces
  section.results-section(v-if="currentUserIsSignedIn" ref="resultsElement" :style="{'max-height': state.resultsSectionHeight + 'px'}")
    ResultsFilter(
      :showFilter="true"
      :isLoading="state.isLoading"
      :filterIsPersistent="true"
      :items="cardsToSearch"
      :placeholder="placeholder"
      :initialValue="search"
      @updateFilter="updateSearch"
      @updateFilteredItems="updateResultsFromResultsFilter"
      @clearFilter="clearSearch"
      @focusNextItem="focusNextItem"
      @focusPreviousItem="focusPreviousItem"
      @selectItem="selectCurrentFocusedItem"
    )

    CardList(:cards="cards" :search="search" @selectCard="selectCard")
    p.description(v-if="noResults")
      span No matches found

  section(v-if="!currentUserIsSignedIn")
    .row.badge.info
      span Sign Up or In to search your spaces
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

</template>

<style lang="stylus">
dialog.search
  top 16px
  max-height calc(100vh - 140px)
  width 252px
  &.is-pinned
    left -80px
  @media(max-width 400px)
    left -40px
  .results-section
    .segmented-buttons
      margin 4px
      button
        position relative
  .description
    padding 4px
    padding-top 0
</style>
