<template lang="pug">
span
  ul.results-list.card-list(ref="resultsList")
    template(v-for="card in normalizedCards")
      li(@click.stop="selectCard($event, card)" :data-card-id="card.id" :class="{active: cardIsActive(card), hover: cardIsFocused(card)}")
        span.badge.status.inline-badge
          img.icon.time(src="@/assets/time.svg")
          span {{ relativeDate(card) }}
        UserLabelInline(v-if="userIsNotCurrentUser(card.user.id)" :user="card.user")
        span.card-info
          template(v-for="segment in card.nameSegments")
            img.card-image(v-if="segment.isImage" :src="segment.url")
            NameSegment(:segment="segment" :search="search" :isStrikeThrough="isStrikeThrough(card)")
        //- button.small-button.secondary-action(v-if="secondaryActionLabel" @click.stop="secondaryAction")
        //-   img.icon.visit(src="@/assets/visit.svg")
        //-   span {{secondaryActionLabel}}
</template>

<script>
import UserLabelInline from '@/components/UserLabelInline.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'

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
    // secondaryActionLabel: String,
    // primaryActionIsCardListOptions: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerRemoveCardFromCardList') {
        const card = mutation.payload
        this.removedCardIds.push(card.id)
      }
    })
  },
  data () {
    return {
      removedCardIds: []
    }
  },
  computed: {
    ...mapState([
      'cardDetailsIsVisibleForCardId',
      'previousResultItem',
      'currentUser'
    ]),
    ...mapGetters([
    ]),
    normalizedCards () {
      let cards = utils.clone(this.cards)
      cards = cards.filter(card => !this.removedCardIds.includes(card.id))
      return cards.map(card => {
        card = this.$store.getters['currentCards/nameSegments'](card)
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
    }
  },
  methods: {
    selectCard (event, card) {
      this.$emit('selectCard', card)
    },
    cardIsActive (card) {
      const isCardDetailsVisible = this.cardDetailsIsVisibleForCardId === card.id
      return isCardDetailsVisible
    },
    cardIsFocused (card) {
      return this.previousResultItem.id === card.id
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
    position relative
    display block !important
    .button-badge
      box-shadow none
      display initial
      margin-right 0
      pointer-events none
      &:hover,
      &:active
        box-shadow none
    img
      max-width 48px
      border-radius var(--small-entity-radius)
      vertical-align middle
  .time
    vertical-align 0
    height 11px
  .inline-badge
    display inline-block
  .secondary-action
    position absolute
    top 6px
    right 6px
  .icon.visit
    vertical-align 1px
</style>
