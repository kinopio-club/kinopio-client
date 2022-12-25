<template lang="pug">
ul.results-list.card-list
  template(v-for="card in cards")
    li(@click="selectCard(card)" :data-card-id="card.id" :class="{active: cardDetailsIsVisible(card), hover: cardIsFocused(card)}")
      span.badge.status.inline-badge
        img.icon.time(src="@/assets/time.svg")
        span {{ relativeDate(card) }}

      UserLabelInline(v-if="userIsNotCurrentUser(card.user.id)" :user="card.user")

      span.card-info
        template(v-for="segment in card.nameSegments")
          img.card-image(v-if="segment.isImage" :src="segment.url")
          NameSegment(:segment="segment" :search="search" :isStrikeThrough="isStrikeThrough(card)")
</template>

<script>
import UserLabelInline from '@/components/UserLabelInline.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'

import { mapState, mapGetters } from 'vuex'

export default {
  name: 'ComponentName',
  components: {
    UserLabelInline,
    NameSegment
  },
  props: {
    cards: Array,
    search: String
  },
  computed: {
    ...mapState([
      'cardDetailsIsVisibleForCardId',
      'previousResultCardId',
      'currentUser'
    ]),
    ...mapGetters([
    ])
  },
  methods: {
    selectCard (card) {
      this.$emit('selectCard', card)
    },
    cardDetailsIsVisible (card) {
      return this.cardDetailsIsVisibleForCardId === card.id
    },
    cardIsFocused (card) {
      if (this.previousResultCardId === card.id) {
        return true
      }
    },
    relativeDate (card) {
      return utils.shortRelativeTime(card.nameUpdatedAt || card.updatedAt)
    },
    userIsNotCurrentUser (userId) {
      return this.currentUser.id !== userId
    },
    isStrikeThrough (card) {
      return card.name.startsWith('[x]')
    }
  }
}
</script>

<style lang="stylus">
.card-list
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
