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
    ul.results-list
      template(v-for="card in cards")
        //- card list item
        li(@click="selectCard(card)" :data-card-id="card.id" :class="{active: cardDetailsIsVisibleForCardId(card), hover: cardIsFocused(card)}")
          span.badge.status.inline-badge
            img.icon.time(src="@/assets/time.svg")
            span {{ relativeDate(card) }}

          template(v-if="card.user.id")
            span.badge.user-badge.user-badge(v-if="userIsNotCurrentUser(card.user.id)" :style="{background: card.user.color}")
              User(:user="card.user" :isClickable="false" :hideYouLabel="true")
              span {{card.user.name}}
          span.card-info
            template(v-for="segment in card.nameSegments")
              img.card-image(v-if="segment.isImage" :src="segment.url")
              NameSegment(:segment="segment" :search="search" :isStrikeThrough="isStrikeThrough(card)")

</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import User from '@/components/User.vue'
import NameSegment from '@/components/NameSegment.vue'
import SearchFilters from '@/components/SearchFilters.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import dayjs from 'dayjs'
import orderBy from 'lodash-es/orderBy'

const maxIterations = 30
let currentIteration, updatePositionTimer

export default {
  name: 'Search',
  components: {
    ResultsFilter,
    User,
    NameSegment,
    SearchFilters
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
      cards.map(card => {
        card.nameSegments = this.cardNameSegments(card.name)
        card.user = this.$store.getters['currentSpace/userById'](card.userId)
        if (!card.user) {
          card.user = {
            id: '',
            name: '',
            color: undefined
          }
        }
        return card
      })
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
    isStrikeThrough (card) {
      return card.name.startsWith('[x]')
    },
    cardDetailsIsVisibleForCardId (card) {
      return this.$store.state.cardDetailsIsVisibleForCardId === card.id
    },
    userIsNotCurrentUser (userId) {
      return this.currentUser.id !== userId
    },
    segmentTagColor (segment) {
      const spaceTag = this.$store.getters['currentSpace/tagByName'](segment.name)
      const cachedTag = cache.tagByName(segment.name)
      if (spaceTag) {
        return spaceTag.color
      } else if (cachedTag) {
        return cachedTag.color
      } else {
        return this.currentUser.color
      }
    },
    cardNameSegments (name) {
      let url = utils.urlFromString(name)
      let imageUrl
      if (utils.urlIsImage(url)) {
        imageUrl = url
        name = name.replace(url, '')
      }
      let segments = utils.cardNameSegments(name)
      if (imageUrl) {
        segments.unshift({
          isImage: true,
          url: imageUrl
        })
      }
      return segments.map(segment => {
        if (!segment.isTag) { return segment }
        segment.color = this.segmentTagColor(segment)
        return segment
      })
    },
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
    cardIsFocused (card) {
      if (this.previousResultCardId === card.id) {
        return true
      }
    },
    selectItem () {
      const card = this.$store.getters['currentCards/byId'](this.previousResultCardId)
      this.$store.commit('shouldPreventNextEnterKey', true)
      this.$store.dispatch('closeAllDialogs', 'Search.selectItem')
      this.selectCard(card)
    },
    relativeDate (card) {
      return utils.shortRelativeTime(card.nameUpdatedAt || card.updatedAt)
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
  @media(max-width 400px)
    left -40px
  li
    display block !important
    .button-badge
      box-shadow none
      display initial
      margin-right 0
      &:hover,
      &:active
        box-shadow none
    img
      max-width 48px
      border-radius 3px
      vertical-align middle
  .time
    vertical-align -1px
    height 11px

</style>
