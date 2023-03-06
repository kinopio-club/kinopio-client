<template lang="pug">
dialog.search.is-pinnable(@click="closeDialogs" v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :data-is-pinned="dialogIsPinned" :class="{'is-pinned': dialogIsPinned}")
  SearchFilters
  section.results-section(v-if="currentUserIsSignedIn" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    ResultsFilter(
      :showFilter="true"
      :isLoading="isLoading"
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
      button(@click="updateScopeIsLocal(true)" :class="{ active: scopeIsLocal }")
        span Current Space
      button(@click="updateScopeIsLocal(false)" :class="{ active: !scopeIsLocal }")
        span All Spaces

    template(v-if="scopeIsLocal")
      CardList(:cards="cards" :search="search" @selectCard="selectCard")
    template(v-else)
      SpaceCardList(:groupedItems="cardsBySpace" :search="search" :isLoading="isLoading" @selectSpace="changeSpace" @selectCard="selectSpaceCard")
      p.description(v-if="noResults")
        span No matches found

  section(v-if="!currentUserIsSignedIn")
    .row.badge.info
      span Sign Up or In to search your spaces
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import SearchFilters from '@/components/SearchFilters.vue'
import CardList from '@/components/CardList.vue'
import SpaceCardList from '@/components/SpaceCardList.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'
import orderBy from 'lodash-es/orderBy'

const maxIterations = 30
let currentIteration, updatePositionTimer

export default {
  name: 'Search',
  components: {
    ResultsFilter,
    SearchFilters,
    CardList,
    SpaceCardList
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateHeights()
      } else if (mutation.type === 'triggerSearchScopeIsRemote') {
        this.updateScopeIsLocal(false)
      } else if (mutation.type === 'triggerSearchScopeIsLocal') {
        this.updateScopeIsLocal(true)
      }
    })
  },
  data () {
    return {
      dialogHeight: null,
      resultsSectionHeight: null,
      isLoading: false,
      cardsBySpace: [],
      cardsBySpaceFlattened: [],
      scopeIsLocal: true,
      hasSearched: false
    }
  },
  computed: {
    noResults () { return this.hasSearched && !this.cardsBySpace.length },
    dialogIsPinned () { return this.$store.state.searchIsPinned },
    placeholder () {
      let placeholder = 'Search Cards'
      let shift = ''
      if (!utils.isMobile()) {
        if (!this.scopeIsLocal) {
          shift = 'Shift-'
        }
        placeholder = placeholder + ` (${utils.metaKey()}-${shift}F)`
      }
      return placeholder
    },
    search () { return this.$store.state.search },
    searchResultsCards () { return this.$store.state.searchResultsCards },
    previousResultItem () { return this.$store.state.previousResultItem },
    cards () {
      let cards
      if (this.search) {
        return this.searchResultsCards
      } else {
        return this.cardsToSearch
      }
    },
    cardsToSearch () {
      if (this.scopeIsLocal) {
        return this.recentlyUpdatedCards
      } else {
        return this.searchResultsCards
      }
    },
    itemsToFocus () {
      if (this.scopeIsLocal) {
        return this.cards
      } else {
        return this.cardsBySpaceFlattened
      }
    },
    recentlyUpdatedCards () {
      let cards = utils.clone(this.$store.getters['currentCards/all'])
      cards = cards.filter(card => card.name)
      cards = cards.map(card => {
        const date = card.nameUpdatedAt || card.createdAt
        card.date = dayjs(date)
        return card
      })
      cards = orderBy(cards, (a) => new Date(a.date), ['desc'])
      return cards
    },
    currentUser () { return this.$store.state.currentUser },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] }
  },
  methods: {
    updateScopeIsLocal (value) {
      this.scopeIsLocal = value
      this.updateSearch(this.search)
    },

    // search

    async updateSearch (search) {
      this.$store.commit('search', search)
      if (!search) {
        this.clearSearch()
      }
      if (search && !this.scopeIsLocal) {
        await this.searchRemoteCards(search)
      }
      this.$nextTick(() => {
        if (this.cards.length && this.search) {
          this.focusFirstItem()
        }
      })
    },
    async searchRemoteCards (search) {
      this.isLoading = true
      const results = await this.$store.dispatch('api/searchCards', { query: search })
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
      const cardsInCurrentSpace = results.cards.filter(card => card.spaceId === this.$store.state.currentSpace.id)
      this.cardsBySpace = groups
      this.updateCardsBySpaceFlattened(groups)
      this.cardsInAllSpaces = results.cards
      this.$store.commit('searchResultsCards', cardsInCurrentSpace)
      this.isLoading = false
      this.hasSearched = true
    },
    updateCardsBySpaceFlattened (groups) {
      let items = []
      groups.forEach(group => {
        group.space.isSpace = true
        items.push(group.space)
        group.cards.forEach(card => {
          items.push(card)
        })
      })
      this.cardsBySpaceFlattened = items
    },
    updateResultsFromResultsFilter (cards) {
      this.$store.commit('previousResultItem', {})
      this.$store.commit('searchResultsCards', cards)
    },
    clearSearch () {
      this.$nextTick(() => {
        this.cardsBySpace = []
        this.cardsBySpaceFlattened = []
        this.cardsInCurrentSpace = []
        this.$store.commit('clearSearch')
        this.hasSearched = false
      })
    },

    // select items

    selectCard (card) {
      this.$store.dispatch('closeAllDialogs')
      this.$store.dispatch('currentCards/showCardDetails', card.id)
      this.focusItem(card)
    },
    changeSpace (spaceId) {
      if (this.$store.state.currentSpace.id === spaceId) { return }
      const space = { id: spaceId }
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
      this.closeDialogs()
      this.$store.dispatch('closeAllDialogs')
    },
    selectSpaceCard (card) {
      this.$store.dispatch('closeAllDialogs')
      const isCardInCurrentSpace = card.spaceId === this.$store.state.currentSpace.id
      if (isCardInCurrentSpace) {
        this.selectCard(card)
      } else {
        this.$store.commit('loadSpaceShowDetailsForCardId', card.id)
        this.changeSpace(card.spaceId)
      }
    },

    // keyboard nav

    selectCurrentFocusedItem (event) {
      this.$store.commit('shouldPreventNextEnterKey', true)
      this.$store.dispatch('closeAllDialogs')
      if (this.scopeIsLocal) {
        this.selectCard(this.previousResultItem)
      } else {
        if (this.previousResultItem.isSpace) {
          this.changeSpace(this.previousResultItem.id)
        } else {
          this.selectSpaceCard(this.previousResultItem)
        }
      }
    },
    focusNextItem () {
      const items = this.itemsToFocus
      console.log(items)
      if (!this.previousResultItem.id) {
        this.focusFirstItem()
        return
      }
      const currentIndex = items.findIndex(card => card.id === this.previousResultItem.id)
      let index = currentIndex + 1
      if (items.length === index) {
        return
      }
      this.focusItem(items[index])
    },
    focusPreviousItem () {
      const items = this.itemsToFocus
      if (!this.previousResultItem.id) {
        this.focusItem(items[0])
        return
      }
      const currentIndex = items.findIndex(card => card.id === this.previousResultItem.id)
      let index = currentIndex - 1
      if (index < 0) {
        index = 0
      }
      this.focusItem(items[index])
    },
    focusFirstItem () {
      const items = this.itemsToFocus
      this.focusItem(items[0])
    },
    focusItem (item) {
      this.$store.commit('previousResultItem', item)
    },

    // dialog

    closeDialogs () {
      this.$store.commit('triggerMoreFiltersIsNotVisible')
    },
    updateHeights () {
      if (!this.visible) {
        window.cancelAnimationFrame(updatePositionTimer)
        updatePositionTimer = undefined
        return
      }
      currentIteration = 0
      if (updatePositionTimer) { return }
      updatePositionTimer = window.requestAnimationFrame(this.updatePositionFrame)
    },
    updatePositionFrame () {
      currentIteration++
      this.updateDialogHeight()
      this.updateResultsSectionHeight()
      if (currentIteration < maxIterations) {
        window.requestAnimationFrame(this.updatePositionFrame)
      } else {
        window.cancelAnimationFrame(updatePositionTimer)
        updatePositionTimer = undefined
      }
    },
    updateDialogHeight () {
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element) - 100
      })
    },
    updateResultsSectionHeight () {
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element) - 2 - 100
      })
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    }
  },
  watch: {
    visible (visible) {
      this.updateHeights()
      if (visible) {
        this.hasSearched = false
        if (utils.isMobile()) { return }
        this.$nextTick(() => {
          this.$store.commit('triggerFocusResultsFilter')
        })
      }
    }
  }
}
</script>

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
