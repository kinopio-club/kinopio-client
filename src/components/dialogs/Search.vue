<template lang="pug">
dialog.search(v-if="visible" :open="visible" ref="dialog")
  section.results-section
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
          span.badge.secondary.inline-badge
            img.icon.time(src="@/assets/time.svg")
            span {{ relativeDate(card) }}

          template(v-if="card.user.id")
            span.badge.user-badge.user-badge(v-if="userIsNotCurrentUser(card.user.id)" :style="{background: card.user.color}")
              User(:user="card.user" :isClickable="false" :hideYouLabel="true")
              span {{card.user.name}}
          span.card-info
            template(v-for="segment in card.nameSegments")
              img.card-image(v-if="segment.isImage" :src="segment.url")
              NameSegment(:segment="segment")

</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import User from '@/components/User.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

export default {
  name: 'Search',
  components: {
    ResultsFilter,
    User,
    NameSegment
  },
  props: {
    visible: Boolean
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
        cards = cards.slice(0, 20)
      }
      cards = utils.clone(cards)
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
      let cards = utils.clone(this.$store.state.currentSpace.cards)
      cards = cards.filter(card => card.name)
      cards = cards.map(card => {
        const date = card.nameUpdatedAt || card.createdAt
        card.updatedAt = dayjs(date)
        return card
      })
      cards = cards.sort((a, b) => {
        return a.updatedAt.isBefore(b.updatedAt)
      })
      return cards
    },
    currentUser () { return this.$store.state.currentUser }
  },
  methods: {
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
      this.$store.dispatch('currentSpace/showCardDetails', card.id)
      if (utils.isMobile()) {
        this.$store.dispatch('closeAllDialogs', 'Search.selectCard')
      }
      this.focusItem(card)
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
        index = 0
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
        index = cards.length - 1
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
      const card = this.$store.getters['currentSpace/cardById'](this.previousResultCardId)
      this.$store.commit('shouldPreventNextEnterKey', true)
      this.$store.dispatch('closeAllDialogs', 'Search.selectItem')
      this.selectCard(card)
    },
    relativeDate (card) {
      let relativeTime = dayjs(card.updatedAt).fromNow(true)
      // https://day.js.org/docs/en/customization/relative-time
      relativeTime = relativeTime.replace('a few seconds', 'now')
      relativeTime = relativeTime.replace('a minute', '1m')
      relativeTime = relativeTime.replace(' minutes', 'm')
      relativeTime = relativeTime.replace('an hour', '1h')
      relativeTime = relativeTime.replace(' hours', 'h')
      relativeTime = relativeTime.replace('a day', '1d')
      relativeTime = relativeTime.replace(' days', 'd')
      relativeTime = relativeTime.replace('a month', '1mo')
      relativeTime = relativeTime.replace(' months', 'mo')
      relativeTime = relativeTime.replace('a year', '1yr')
      relativeTime = relativeTime.replace(' years', 'y')
      return relativeTime
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('previousResultCardId', '')
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
  @media(max-width 360px)
    left -40px
  .search-wrap
    padding-top 8px
  li
    display block !important
    .button-badge
      box-shadow none
      &:hover,
      &:active
        box-shadow none
    img
      max-width 48px
      border-radius 3px
      vertical-align middle
  .name-segment
    word-break break-all
</style>
