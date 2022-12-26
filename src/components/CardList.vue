<template lang="pug">
ul.results-list.card-list
  template(v-for="card in normalizedCards")
    li(@click="selectCard(card)" :data-card-id="card.id" :class="{active: cardDetailsIsVisible(card), hover: cardIsFocused(card)}")
      span.badge.status.inline-badge
        img.icon.time(src="@/assets/time.svg")
        span {{ relativeDate(card) }}

      UserLabelInline(v-if="userIsNotCurrentUser(card.user.id)" :user="card.user")

      span.card-info
        template(v-for="segment in card.nameSegments")
          img.card-image(v-if="segment.isImage" :src="segment.url")
          NameSegment(:segment="segment" :search="search" :isStrikeThrough="isStrikeThrough(card)")
      button.small-button.secondary-action(v-if="secondaryActionLabel" @click.stop="secondaryAction")
        img.icon.visit(src="@/assets/visit.svg")
        span {{secondaryActionLabel}}
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
    search: String,
    secondaryActionLabel: String
  },
  computed: {
    ...mapState([
      'cardDetailsIsVisibleForCardId',
      'previousResultCardId',
      'currentUser'
    ]),
    ...mapGetters([
    ]),
    normalizedCards () {
      return this.cards.map(card => {
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
    }
  },
  methods: {
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

    selectCard (card) {
      this.$emit('selectCard', card)
    },
    secondaryAction (card) {
      this.$emit('secondaryAction', card)
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
    position relative
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
  .inline-badge
    display inline-block
  .secondary-action
    position absolute
    top 6px
    right 6px
  .icon.visit
    vertical-align 1px
</style>
