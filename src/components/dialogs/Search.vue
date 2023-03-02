<template lang="pug">
dialog.search.is-pinnable(@click="closeDialogs" v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :data-is-pinned="dialogIsPinned" :class="{'is-pinned': dialogIsPinned}")
  SearchFilters
  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
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
      scopeIsLocal: true
    }
  },
  computed: {
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
    previousResultItemId () { return this.$store.state.previousResultItemId },
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
    currentUser () { return this.$store.state.currentUser }
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
      this.$store.commit('previousResultItemId', '')
      this.$store.commit('searchResultsCards', cards)
    },
    clearSearch () {
      this.$nextTick(() => {
        this.cardsBySpace = []
        this.cardsBySpaceFlattened = []
        this.cardsInCurrentSpace = []
        this.$store.commit('clearSearch')
      })
    },

    // select items

    changeSpace (space) {
      console.log('🍋 changeSpace', space)
    },
    selectCard (card) {
      this.$store.dispatch('closeAllDialogs', 'Search.selectCard')
      this.$store.dispatch('currentCards/showCardDetails', card.id)
      this.focusItem(card)
    },
    selectSpaceCard (card) {
      const isCardInCurrentSpace = card.spaceId === this.$store.state.currentSpace.id
      console.log('🌙 selectSpaceCard', card, isCardInCurrentSpace)
      if (isCardInCurrentSpace) {
        this.selectCard(card)
      } else {
        console.log('🍇🍇🍇', card)
        // change to space, then to card
      }
    },

    // keyboard nav

    selectCurrentFocusedItem () {
      this.$store.commit('shouldPreventNextEnterKey', true)
      this.$store.dispatch('closeAllDialogs')
      if (this.scopeIsLocal) {
        const card = this.$store.getters['currentCards/byId'](this.previousResultItemId)
        this.selectCard(card)
      } else {
        console.log('🐣 selectCurrentFocusedItem', this.previousResultItemId)
        // selectSpaceCard or changespace
      }
    },
    focusNextItem () {
      const items = this.itemsToFocus
      console.log(items)
      if (!this.previousResultItemId) {
        this.focusFirstItem()
        return
      }
      const currentIndex = items.findIndex(card => card.id === this.previousResultItemId)
      let index = currentIndex + 1
      if (items.length === index) {
        return
      }
      this.focusItem(items[index])
    },
    focusPreviousItem () {
      const items = this.itemsToFocus
      if (!this.previousResultItemId) {
        this.focusItem(items[0])
        return
      }
      const currentIndex = items.findIndex(card => card.id === this.previousResultItemId)
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
      this.$store.commit('previousResultItemId', item.id)
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
    }
  },
  watch: {
    visible (visible) {
      this.updateHeights()
      if (visible) {
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
</style>
