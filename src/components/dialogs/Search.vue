<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
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
  store.subscribe((mutation, state) => {
    if (mutation.type === 'updatePageSizes') {
      updateHeights()
    } else if (mutation.type === 'triggerSearchScopeIsRemote') {
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
  cardsBySpace: [],
  cardsBySpaceFlattened: [],
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
const noResults = computed(() => state.hasSearched && !state.cardsBySpace.length)
const updateScopeIsCurrentSpace = (value) => {
  state.scopeIsCurrentSpace = value
  updateSearch(search.value)
}
const updateSearch = async (search) => {
  store.commit('search', search)
  if (!search) {
    clearSearch()
  }
  if (search && !state.scopeIsCurrentSpace) {
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
  let groups = results.spaces.map(space => {
    return {
      spaceName: space.name,
      spaceId: space.id,
      space: space,
      background: space.background,
      backgroundTint: space.backgroundTint,
      cards: []
    }
  })
  results.cards.forEach(card => {
    const index = groups.findIndex(group => group.spaceId === card.spaceId)
    groups[index].cards.push(card)
  })
  const cardsInCurrentSpace = results.cards.filter(card => card.spaceId === store.state.currentSpace.id)
  state.cardsBySpace = groups
  updateCardsBySpaceFlattened(groups)
  // cardsInAllSpaces = results.cards
  store.commit('searchResultsCards', cardsInCurrentSpace)
  state.isLoading = false
  state.hasSearched = true
}
const updateCardsBySpaceFlattened = (groups) => {
  let items = []
  groups.forEach(group => {
    group.space.isSpace = true
    items.push(group.space)
    group.cards.forEach(card => {
      items.push(card)
    })
  })
  state.cardsBySpaceFlattened = items
}
const updateResultsFromResultsFilter = (cards) => {
  store.commit('previousResultItem', {})
  store.commit('searchResultsCards', cards)
}
const clearSearch = async () => {
  await nextTick()
  state.cardsBySpace = []
  state.cardsBySpaceFlattened = []
  // cardsInCurrentSpace = []
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
  store.dispatch('closeAllDialogs')
  store.dispatch('currentCards/showCardDetails', card.id)
  focusItem(card)
}
const changeSpace = (spaceId) => {
  if (store.state.currentSpace.id === spaceId) { return }
  const space = { id: spaceId }
  store.dispatch('currentSpace/changeSpace', space)
  closeDialogs()
  store.dispatch('closeAllDialogs')
}
const selectSpaceCard = (card) => {
  store.dispatch('closeAllDialogs')
  const isCardInCurrentSpace = card.spaceId === store.state.currentSpace.id
  if (isCardInCurrentSpace) {
    selectCard(card)
  } else {
    store.commit('loadSpaceShowDetailsForCardId', card.id)
    changeSpace(card.spaceId)
  }
}

// keyboard nav

const selectCurrentFocusedItem = (event) => {
  store.commit('shouldPreventNextEnterKey', true)
  store.dispatch('closeAllDialogs')
  if (state.scopeIsCurrentSpace) {
    selectCard(previousResultItem.value)
  } else {
    if (previousResultItem.value.isSpace) {
      changeSpace(previousResultItem.value.id)
    } else {
      selectSpaceCard(previousResultItem.value)
    }
  }
}
const focusNextItem = () => {
  const items = itemsToFocus.value
  if (!previousResultItem.value.id) {
    focusFirstItem()
    return
  }
  const currentIndex = items.findIndex(card => card.id === previousResultItem.value.id)
  let index = currentIndex + 1
  if (items.length === index) {
    return
  }
  focusItem(items[index])
}
const focusPreviousItem = () => {
  const items = itemsToFocus.value
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
  const items = itemsToFocus.value
  focusItem(items[0])
}
const focusItem = (item) => {
  store.commit('previousResultItem', item)
}
const itemsToFocus = computed(() => {
  if (state.scopeIsCurrentSpace) {
    return cards.value
  } else {
    return state.cardsBySpaceFlattened
  }
})

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
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const updateResultsSectionHeight = async () => {
  await nextTick()
  let element = resultsElement.value
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

    template(v-if="state.scopeIsCurrentSpace")
      CardList(:cards="cards" :search="search" @selectCard="selectCard")
    template(v-else)
      SpaceCardList(:groupedItems="state.cardsBySpace" :search="search" :state.isLoading="state.isLoading" @selectSpace="changeSpace" @selectCard="selectSpaceCard")
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
