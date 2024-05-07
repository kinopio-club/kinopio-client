<template lang="pug">

section(v-if="visible")
  p Comments

section.results-section.comments(v-if="visible")
  ul.results-list(v-if="comments.length")
    template(v-for="card in comments" :key="card.id")
      li(@click="showCardDetails(card)")
        p.user
          UserLabelInline(:user="card.user")
          br
          span.badge.status.inline-badge
            img.icon.time(src="@/assets/time.svg")
            span {{ relativeDate(card) }}
        .comment-name
          img.icon.comment-icon(src="@/assets/comment.svg")
          template(v-for="segment in card.nameSegments")
            img.card-image(v-if="segment.isImage" :src="segment.url")
            NameSegment(:segment="segment")
  section.subsection.tips-section(v-if="!comments.length")
    p No comment cards in this space yet
    p
      span.badge.secondary Card →{{' '}}
        img.icon.down-arrow.down-arrow-inline(src="@/assets/down-arrow.svg")
        span →
        img.icon.comment-icon(src="@/assets/comment.svg")
</template>

<script>
import UserLabelInline from '@/components/UserLabelInline.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'

import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'

export default {
  name: 'Comments',
  components: {
    NameSegment,
    UserLabelInline
  },
  props: {
    visible: Boolean
  },
  computed: {
    comments () {
      let cards = this.$store.getters['currentCards/all']
      cards = utils.clone(cards)
      cards = cards.filter(card => {
        if (card.isComment) { return true }
        return utils.isNameComment(card.name)
      })
      cards = cards.map(card => {
        card.user = this.userById(card.userId)
        card.nameSegments = utils.cardNameSegments(card.name)
        return card
      })
      cards = sortBy(cards, card => dayjs(card.nameUpdatedAt || card.updatedAt).valueOf())
      cards.reverse()
      return cards
    }
  },
  methods: {
    showCardDetails (card) {
      const filterComments = this.$store.state.currentUser.filterComments
      if (filterComments) {
        this.$store.dispatch('currentUser/toggleFilterComments', false)
      }
      this.$store.dispatch('currentCards/showCardDetails', card.id)
    },
    userById (userId) {
      return this.$store.getters['currentSpace/userById'](userId)
    },
    relativeDate (card) {
      return utils.shortRelativeTime(card.nameUpdatedAt || card.updatedAt)
    }
  }
}
</script>

<style lang="stylus">
section.comments
  .results-section
    border-top 1px solid var(--primary-border)
    padding-top 4px
    li
      display block
  .comment-icon
    vertical-align -3px
  .user
    flex-shrink 0
    max-width 44%

section.tips-section
  margin 4px
  margin-top 0
  .comment-icon
    margin-left 4px
    vertical-align -2px
  .down-arrow-inline
    vertical-align 2px
</style>
