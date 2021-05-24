<template lang="pug">
dialog.search(v-if="visible" :open="visible" ref="dialog")
  section.results-section
    ResultsFilter(:showFilter="true" :items="recentlyUpdatedCards" :placeholder="placeholder" @updateFilter="updateSearch" @updateFilteredItems="updateSearchResultsCards" @clearFilter="clearSearch")
    .badge.secondary.inline-badge(v-if="!search")
      img.icon.time(src="@/assets/time.svg")
      span Recent
    ul.results-list
      template(v-for="card in cards")
        //- card list item
        li(@click="selectCard(card)" :data-card-id="card.id" :class="{active: cardDetailsIsVisibleForCardId(card)}")
          template(v-if="card.user.id")
            span.badge.user-badge.user-badge(v-if="userIsNotCurrentUser(card.user.id)" :style="{background: card.user.color}")
              User(:user="card.user" :isClickable="false" :hideYouLabel="true")
              span {{card.user.name}}
          .card-info
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
  data () {
    return {
      placeholder: undefined
    }
  },
  computed: {
    search () { return this.$store.state.search },
    searchResultsCards () { return this.$store.state.searchResultsCards },
    cards () {
      let cards
      if (this.search) {
        cards = this.searchResultsCards
      } else {
        cards = this.recentlyUpdatedCards
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
    currentUser () { return this.$store.state.currentUser },
    meta () { return utils.metaKey() }
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
      this.$store.commit('previousResultCardId', card.id)
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.placeholder = `Search Cards (${this.meta}-F)`
        if (utils.isMobile()) {
          this.placeholder = 'Search Cards'
        }
      }
    }
  }
}
</script>

<style lang="stylus">
.search
  top 16px
  max-height calc(100vh - 140px)
  @media(max-width 360px)
    left -40px
  .search-wrap
    padding-top 8px
  .inline-badge
    display inline-block
    margin-left 6px
    margin-bottom 4px
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
</style>
