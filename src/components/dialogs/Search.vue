<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ResultsFilter from '@/components/ResultsFilter.vue'
import SearchFilters from '@/components/SearchFilters.vue'
import CardList from '@/components/CardList.vue'
import SpaceCardList from '@/components/SpaceCardList.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'
import orderBy from 'lodash-es/orderBy'

const store = useStore()

const dialogElement = ref(null)
const resultsElement = ref(null)

const maxIterations = 30
let currentIteration, updatePositionTimer

onMounted(() => {
  window.addEventListener('resize', updateHeights)
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerSearchScopeIsRemote') {
      updateScopeIsCurrentSpace(false)
    } else if (mutation.type === 'triggerSearchScopeIsCurrentSpace') {
      updateScopeIsCurrentSpace(true)
    }
  })
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  resultsSectionHeight: null,
  isLoading: false,
  scopeIsCurrentSpace: true,
  hasSearched: false
})

watch(() => props.visible, (value, prevValue) => {
  updateHeights()
  if (value) {
    state.hasSearched = false
    store.commit('shouldExplicitlyHideFooter', true)
    if (utils.isMobile()) { return }
    triggerFocusResultsFilter()
  } else {
    store.commit('shouldExplicitlyHideFooter', false)
  }
})
const triggerFocusResultsFilter = async () => {
  await nextTick()
  store.commit('triggerFocusResultsFilter')
}
const currentUser = computed(() => store.state.currentUser)
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])

// search

const search = computed(() => store.state.search)
const noResults = computed(() => state.hasSearched && !cards.value.length)
const updateScopeIsCurrentSpace = (value) => {
  state.scopeIsCurrentSpace = value
  updateSearch(search.value)
}
const updateSearch = async (search) => {
  store.commit('search', search)
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
  const results = await store.dispatch('api/searchCards', { query: search })
  store.commit('searchResultsCards', results)
  state.isLoading = false
  state.hasSearched = true
}
const updateResultsFromResultsFilter = (cards) => {
  store.commit('previousResultItem', {})
  store.commit('searchResultsCards', cards)
}
const clearSearch = async () => {
  await nextTick()
  store.commit('clearSearch')
  state.hasSearched = false
}
const searchResultsCards = computed(() => store.state.searchResultsCards)
const previousResultItem = computed(() => store.state.previousResultItem)
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
  let cards = utils.clone(store.getters['currentCards/all'])
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
  const isCardInCurrentSpace = card.spaceId === store.state.currentSpace.id
  if (isCardInCurrentSpace) {
    store.dispatch('focusOnCardId', card.id)
    focusItem(card)
  } else {
    selectSpaceCard(card)
  }
  closeDialogs()
}
const changeSpace = (spaceId) => {
  if (store.state.currentSpace.id === spaceId) { return }
  const space = { id: spaceId }
  store.dispatch('currentSpace/changeSpace', space)
}
const selectSpaceCard = (card) => {
  changeSpace(card.spaceId)
  store.commit('loadSpaceFocusOnCardId', card.id)
}

// keyboard nav

const selectCurrentFocusedItem = () => {
  store.commit('shouldPreventNextEnterKey', true)
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
  store.commit('previousResultItem', item)
}

// dialog

const dialogIsPinned = computed(() => store.state.searchIsPinned)
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
  store.commit('triggerMoreFiltersIsNotVisible')
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
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}

</script>

<template lang="pug">
dialog.search.is-pinnable(@click="closeDialogs" v-if="visible" :open="visible" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" :data-is-pinned="dialogIsPinned" :class="{'is-pinned': dialogIsPinned}")
  SearchFilters
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
    .segmented-buttons
      button(@click="updateScopeIsCurrentSpace(true)" :class="{ active: state.scopeIsCurrentSpace }")
        span Current Space
      button(@click="updateScopeIsCurrentSpace(false)" :class="{ active: !state.scopeIsCurrentSpace }")
        span All Spaces

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
    border-top 1px solid var(--primary-border)
    padding-top 4px
    .segmented-buttons
      margin 4px
      button
        position relative
  .description
    padding 4px
    padding-top 0
</style>
