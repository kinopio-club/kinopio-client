<template lang="pug">
dialog.search(@click="closeDialogs" v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  SearchFilters
  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    ResultsFilter(
      :showFilter="true"
      :filterIsPersistent="true"
      :items="recentlyUpdatedCards"
      :placeholder="placeholder"
      :initialValue="search"
      @updateFilter="updateSearch"
      @updateFilteredItems="updateSearchResultsCards"
      @clearFilter="clearSearch"
      @focusNextItem="focusNextItem"
      @focusPreviousItem="focusPreviousItem"
      @selectItem="selectItem"
    )
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
      resultsSectionHeight: null
    }
  },
  computed: {
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
        cards = this.searchResultsCards
      } else {
        cards = this.recentlyUpdatedCards
      }
      cards = utils.clone(cards)
      cards = cards.slice(0, 20)
      return cards
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
    updateSearch (search) {
      this.$store.commit('search', search)
      if (!search) {
        this.clearSearch()
      }
      this.$nextTick(() => {
        if (this.cards.length && this.search) {
          this.focusItem(this.cards[0])
        }
      })
    },
    updateSearchResultsCards (cards) {
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
  @media(max-width 400px)
    left -40px
</style>
