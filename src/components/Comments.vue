<template lang="pug">
//- dialog.comments.narrow.is-pinnable(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :data-is-pinned="dialogIsPinned" :class="{'is-pinned': dialogIsPinned}")
//- section
//-   .title-row
//-     p Comments
//-     .button-wrap(@click.left="toggleDialogIsPinned"  :class="{active: dialogIsPinned}" title="Pin dialog")
//-       button
//-         img.icon.pin(src="@/assets/pin.svg")

.comments(v-if="visible")
  section.results-section(v-if="comments.length")
    ul.results-list
      template(v-for="(card in comments")
        li(@click="showCardDetails(card)")
          p
            span.badge.user-badge.user-badge(:style="{background: card.user.color}")
              User(:user="card.user" :isClickable="false" :hideYouLabel="true")
              span {{card.user.name}}
          .comment-name
            img.icon.comment-icon(src="@/assets/comment.svg")
            template(v-for="segment in card.nameSegments")
              img.card-image(v-if="segment.isImage" :src="segment.url")
              NameSegment(:segment="segment")

  section.no-comments-section(v-if="!comments.length")
    p No comment cards in this space yet
    p
      span.badge.secondary Card → Style →
        img.icon.comment-icon(src="@/assets/comment.svg")
</template>

<script>
import User from '@/components/User.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'

import sortBy from 'lodash-es/sortBy'
import dayjs from 'dayjs'

export default {
  name: 'Comments',
  components: {
    NameSegment,
    User
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateResultsSectionHeight()
      }
    })
  },
  mounted () {
    this.updateResultsSectionHeight()
  },
  data () {
    return {
      resultsSectionHeight: null
    }
  },
  computed: {
    dialogIsPinned () { return this.$store.state.commentsDialogIsPinned },
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
    toggleDialogIsPinned () {
      const isPinned = !this.dialogIsPinned
      this.$store.dispatch('commentsDialogIsPinned', isPinned)
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element, true)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateResultsSectionHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.comments
  @media(max-width 414px)
    left -40px
  @media(max-width 350px)
    left -90px
  .results-section
    border-top 1px solid var(--primary)
    padding-top 4px
    li
      display block
  .button-wrap
    padding 4px
  .comment-name
    margin-top 4px
  &.is-pinned
    left -186px
  .comment-icon
    vertical-align -3px

  .no-comments-section
    .comment-icon
      margin-left 4px
      vertical-align -2px
</style>
