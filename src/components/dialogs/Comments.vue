<template lang="pug">
dialog.comments.narrow.is-pinnable(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}" :data-is-pinned="dialogIsPinned" :class="{'is-pinned': dialogIsPinned}")
  section
    .title-row
      p Comments
      .button-wrap(@click.left="toggleDialogIsPinned"  :class="{active: dialogIsPinned}" title="Pin dialog")
        button
          img.icon.pin(src="@/assets/pin.svg")

  section.results-section
    ul.results-list(v-if="comments")
      template(v-for="(card in comments")
        li
          p
            span.badge.user-badge.user-badge(:style="{background: card.user.color}")
              User(:user="card.user" :isClickable="false" :hideYouLabel="true")
              span {{card.user.name}}
          .comment-name
            img.icon.comment-icon(src="@/assets/comment.svg")
            template(v-for="segment in card.nameSegments")
              img.card-image(v-if="segment.isImage" :src="segment.url")
              NameSegment(:segment="segment")

  //-     .button-wrap(@click.left="toggleDialogIsPinned"  :class="{active: dialogIsPinned}" title="Pin dialog")
  //-       button
  //-         img.icon.pin(src="@/assets/pin.svg")

  //- section.results-section(v-if="shouldShowSpaces" ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
  //-   .button-wrap(v-if="userSpacesToggleShouldBeVisible" @click.left.prevent="toggleCurrentUserSpacesIsVisibleOnly" @keydown.stop.enter="toggleCurrentUserSpacesIsVisibleOnly")
  //-     label(:class="{ active: currentUserSpacesIsVisibleOnly }")
  //-       input(type="checkbox" v-model="currentUserSpacesIsVisibleOnly")
  //-       User(:user="currentUser" :isClickable="false" :hideYouLabel="true")
  //-   SpaceList(:spaces="filteredSpaces" :showUser="true" @selectSpace="changeSpace" :parentIsPinned="dialogIsPinned")

  //- section(v-else-if="loading")
  //-   Loader(:visible="loading")
  //- section(v-else)
  //-   p Spaces with cards that link to this space can be found here.
  //-   p Type
  //-     span {{' '}}
  //-     span.badge.secondary /
  //-     span when editing a card to create links
</template>

<script>
import User from '@/components/User.vue'
import NameSegment from '@/components/NameSegment.vue'
import utils from '@/utils.js'

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
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
      }
    })
  },
  data () {
    return {
      resultsSectionHeight: null,
      dialogHeight: null
    }
  },
  computed: {
    comments () {
      let cards = utils.clone(this.$store.state.currentSpace.cards)
      cards = cards.filter(card => {
        if (card.isComment) { return true }
        return utils.isNameComment(card.name)
      })
      cards = cards.map(card => {
        card.user = this.userById(card.userId)
        card.nameSegments = utils.cardNameSegments(card.name)
        return card
      })
      return cards
    },
    dialogIsPinned () { return this.$store.state.commentsDialogIsPinned }
  },
  methods: {
    userById (userId) {
      return this.$store.getters['currentSpace/userById'](userId)
    },
    toggleDialogIsPinned () {
      const isPinned = !this.dialogIsPinned
      this.$store.dispatch('commentsDialogIsPinned', isPinned)
    },
    // toggleCurrentUserSpacesIsVisibleOnly () {
    //   this.currentUserSpacesIsVisibleOnly = !this.currentUserSpacesIsVisibleOnly
    // },
    // changeSpace (space) {
    //   this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    //   this.$store.dispatch('closeAllDialogs', 'Links.closeAllDialogs')
    // },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        // this.updateLinks()
        this.updateResultsSectionHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
.comments

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
    z-index 0
    left -86px
  .comment-icon
    vertical-align -3px
</style>
