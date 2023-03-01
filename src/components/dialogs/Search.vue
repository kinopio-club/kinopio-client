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
      @selectItem="selectItem"
    )
    .segmented-buttons
      button(@click="updateScope('local')" :class="{ active: isScopeLocal }")
        span Current Space
      button(@click="updateScope('remote')" :class="{ active: isScopeRemote }")
        span All Spaces
    CardList(:cards="cards" :search="search" @selectCard="selectCard")
</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import SearchFilters from '@/components/SearchFilters.vue'
import CardList from '@/components/CardList.vue'
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
    CardList
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateHeights()
      }
    })
  },
  data () {
    return {
      dialogHeight: null,
      resultsSectionHeight: null,
      isLoading: false,
      scope: 'local' // 'local', 'remote'
    }
  },
  computed: {
    isScopeRemote () { return this.scope === 'remote' },
    isScopeLocal () { return this.scope === 'local' },
    dialogIsPinned () { return this.$store.state.searchIsPinned },
    placeholder () {
      let placeholder = 'Search Cards'
      if (!utils.isMobile()) {
        placeholder = placeholder + ` (${utils.metaKey()}-F)`
      }
      return placeholder
    },
    search () { return this.$store.state.search },
    searchResultsCards () { return this.$store.state.searchResultsCards },
    previousResultCardId () { return this.$store.state.previousResultCardId },
    cards () {
      let cards
      if (this.search) {
        return this.searchResultsCards
      } else {
        return this.cardsToSearch
      }
    },
    cardsToSearch () {
      if (this.isScopeLocal) {
        return this.recentlyUpdatedCards
      } else {
        return this.searchResultsCards
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
    updateScope (scope) {
      this.scope = scope
      this.updateSearch(this.search)
    },
    async updateSearch (search) {
      this.$store.commit('search', search)
      if (!search) {
        this.clearSearch()
      }
      if (search && this.isScopeRemote) {
        await this.searchRemoteCards(search)
      }
      this.$nextTick(() => {
        if (this.cards.length && this.search) {
          this.focusItem(this.cards[0])
        }
      })
    },
    async searchRemoteCards (search) {
      this.isLoading = true
      const results = await this.$store.dispatch('api/searchCards', { query: search })
      this.$store.commit('searchResultsCards', results.cards)
      this.isLoading = false
    },
    updateResultsFromResultsFilter (cards) {
      this.$store.commit('previousResultCardId', '')
      this.$store.commit('searchResultsCards', cards)
    },
    clearSearch () {
      this.$nextTick(() => {
        this.$store.commit('clearSearch')
      })
    },
    selectCard (card) {
      this.$store.dispatch('closeAllDialogs', 'Search.selectCard')
      this.$store.dispatch('currentCards/showCardDetails', card.id)
      this.focusItem(card)
    },
    closeDialogs () {
      this.$store.commit('triggerMoreFiltersIsNotVisible')
    },
    focusNextItem () {
      const cards = this.cards
      if (!this.previousResultCardId) {
        this.focusItem(cards[0])
        return
      }
      const currentIndex = cards.findIndex(card => card.id === this.previousResultCardId)
      let index = currentIndex + 1
      if (cards.length === index) {
        return
      }
      this.focusItem(cards[index])
    },
    focusPreviousItem () {
      const cards = this.cards
      if (!this.previousResultCardId) {
        this.focusItem(cards[0])
        return
      }
      const currentIndex = cards.findIndex(card => card.id === this.previousResultCardId)
      let index = currentIndex - 1
      if (index < 0) {
        index = 0
      }
      this.focusItem(cards[index])
    },
    focusItem (card) {
      this.$store.commit('previousResultCardId', card.id)
    },
    selectItem () {
      const card = this.$store.getters['currentCards/byId'](this.previousResultCardId)
      this.$store.commit('shouldPreventNextEnterKey', true)
      this.$store.dispatch('closeAllDialogs', 'Search.selectItem')
      this.selectCard(card)
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
</style>
