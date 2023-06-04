<template lang="pug">
span.space-list-wrap
  ResultsFilter(
    :hideFilter="hideFilter"
    :items="spaces"
    :placeholder="placeholder"
    :isLoading="isLoading"
    :parentIsPinned="parentIsPinned"
    :showCreateNewSpaceFromSearch="showCreateNewSpaceFromSearch"
    @updateFilter="updateFilter"
    @updateFilteredItems="updateFilteredSpaces"
    @focusNextItem="focusNextItemFromFilter"
    @focusPreviousItem="focusPreviousItemFromFilter"
    @selectItem="selectItemFromFilter"
  )
  ul.results-list.space-list(ref="spaceList")
    template(v-for="(space, index) in spacesFiltered" :key="space.id")
      .space-wrap(:data-item-is-visible="itemIsVisible(index)" :style="{height: heightByIndex[index] + 'px'}")
        a(:href="space.url")
          li(
            @click.left="selectSpace($event, space)"
            :class="{ active: spaceIsActive(space), hover: focusOnId === space.id }"
            tabindex="0"
            @keyup.enter="selectSpace(null, space)"
          )
            template(v-if="itemIsVisible(index)")
              Loader(:visible="isLoadingSpace(space)")
              //- new
              span(v-if="isNew(space)")
                .badge.info.inline-badge.new-unread-badge
              //- user(s)
              template(v-if="showOtherUsers")
                .users(:class="{'multiple-users': space.otherUsers.length > 1}")
                  User(:user="user(space)" :isClickable="false" :key="user(space).id")
                  template(v-for="otherUser in space.otherUsers" :key="otherUser.id")
                    User(:user="otherUser" :isClickable="false")
              template(v-else-if="showUser")
                User(:user="user(space)" :isClickable="false" :key="user(space).id")
              template(v-else-if="showCollaborator(space)")
                User(:user="user(space)" :isClickable="false" :key="user(space).id")
              //- space meta
              span(v-if="space.isFavorite")
                img.icon.favorite-icon(src="@/assets/heart.svg")
              span(v-if="space.name === 'Inbox'")
                img.icon.inbox-icon(src="@/assets/inbox.svg")
              SpaceTodayJournalBadge(:space="space")
              MoonPhase(v-if="space.moonPhase" :moonPhase="space.moonPhase")
              //- template
              span(v-if="space.isTemplate")
                img.icon.templates(src="@/assets/templates.svg" title="Template")
              .badge.info.inline-badge(v-if="showCategory && space.category" :class="categoryClassName(space)") {{space.category}}
              //- tweet space
              span(v-if="space.isFromTweet" title="Tweet space")
                img.icon.tweet(src="@/assets/twitter.svg")

              //- space details
              .name
                span(v-if="this.filter")
                  NameMatch(:name="space.name" :indexes="space.matchIndexes")
                span(v-else)
                  span {{space.name}}
                template(v-if='space.privacy')
                  PrivacyIcon(:privacy="space.privacy" :closedIsNotVisible="true")
                img.icon.sunglasses(src="@/assets/sunglasses.svg" v-if="showInExplore(space)" title="Shown in Explore")
              button.button-checkmark(v-if="showCheckmarkSpace" @mousedown.left.stop="checkmarkSpace(space)" @touchstart.stop="checkmarkSpace(space)")
                img.icon.checkmark(src="@/assets/checkmark.svg")
          button.inline-duplicate.small-button(v-if="spaceIsActive(space) && spaceIsTemplate(space)")
            img.icon(src="@/assets/add.svg")
            span Copy
          .button-wrap.inline-favorite-wrap(@click.stop.prevent="toggleIsFavoriteSpace(space)")
            button.inline-favorite.small-button(v-if="spaceIsActive(space) && showFavoriteButton"  :class="{ active: isFavorite(space) }")
              img.icon.favorite-icon(v-if="isFavorite(space)" src="@/assets/heart.svg")
              img.icon.favorite-icon(v-else src="@/assets/heart-empty.svg")

</template>

<script>
import templates from '@/data/templates.js'
import ResultsFilter from '@/components/ResultsFilter.vue'
import MoonPhase from '@/components/MoonPhase.vue'
import utils from '@/utils.js'
import { defineAsyncComponent } from 'vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import Loader from '@/components/Loader.vue'
import NameMatch from '@/components/NameMatch.vue'
import SpaceTodayJournalBadge from '@/components/SpaceTodayJournalBadge.vue'

import dayjs from 'dayjs'
import last from 'lodash-es/last'
const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})

let unsubscribe, shouldPreventSelectSpace

export default {
  name: 'SpaceList',
  components: {
    User,
    ResultsFilter,
    MoonPhase,
    PrivacyIcon,
    Loader,
    NameMatch,
    SpaceTodayJournalBadge
  },
  props: {
    spaces: Array,
    selectedSpace: Object,
    showCategory: Boolean,
    showUser: Boolean,
    showOtherUsers: Boolean,
    showUserIfCurrentUserIsCollaborator: Boolean,
    hideExploreBadge: Boolean,
    hideFilter: Boolean,
    isLoading: Boolean,
    parentIsSpaceDetails: Boolean,
    parentIsPinned: Boolean,
    showCheckmarkSpace: Boolean,
    userShowInExploreDate: String,
    showCreateNewSpaceFromSearch: Boolean,
    resultsSectionHeight: Number,
    disableListOptimizations: Boolean,
    showFavoriteButton: Boolean
  },
  data () {
    return {
      filter: '',
      filteredSpaces: [],
      focusOnId: '',
      scrollY: 0,
      scrollHeight: null,
      heightByIndex: {}
    }
  },
  mounted () {
    unsubscribe = this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerPickerNavigationKey') {
        const key = mutation.payload
        const spaces = this.spaces
        let currentIndex = spaces.findIndex(space => space.id === this.focusOnId)
        if (!utils.arrayHasItems(spaces)) {
          this.closeDialog()
        } else if (key === 'ArrowUp') {
          this.focusPreviousItem(currentIndex)
        } else if (key === 'ArrowDown') {
          this.focusNextItem(currentIndex)
        }
      }
      if (mutation.type === 'triggerPickerSelect') {
        const spaces = this.spaces
        const currentSpace = spaces.find(space => space.id === this.focusOnId)
        this.selectSpace(null, currentSpace)
        this.$store.commit('shouldPreventNextEnterKey', true)
      }
    })
    this.updateScroll()
    this.$refs.spaceList.closest('section').addEventListener('scroll', this.updateScroll)
  },
  beforeUnmount () {
    unsubscribe()
    this.$refs.spaceList.closest('section').removeEventListener('scroll', this.updateScroll)
  },
  computed: {
    currentUser () { return this.$store.state.currentUser },
    placeholder () {
      if (!this.parentIsSpaceDetails) { return }
      let placeholder = 'Search Spaces'
      if (!utils.isMobile()) {
        placeholder = placeholder + ` (${utils.metaKey()}-K)`
      }
      return placeholder
    },
    spacesFiltered () {
      if (this.filter) {
        return this.filteredSpaces
      } else {
        return this.spaces
      }
    }
  },
  methods: {
    // favorite
    isFavorite (space) {
      const favorites = this.$store.state.currentUser.favoriteSpaces
      const isFavorite = favorites.find(favorite => favorite.id === space.id)
      return Boolean(isFavorite)
    },
    toggleIsFavoriteSpace (space) {
      if (this.isFavorite(space)) {
        this.$store.dispatch('currentUser/removeFavorite', { type: 'space', item: space })
      } else {
        this.$store.dispatch('currentUser/addFavorite', { type: 'space', item: space })
      }
    },
    updateScroll () {
      let element = this.$refs.spaceList
      if (!element) { return }
      element = element.closest('section')
      if (!element) {
        console.error('scroll element not found', element)
      }
      this.scrollY = element.scrollTop
      this.scrollHeight = element.getBoundingClientRect().height
    },
    itemIsVisible (index) {
      if (this.disableListOptimizations) { return true }
      if (!this.scrollY) {
        this.updateScroll()
      }
      let threshold = 0
      if (this.scrollY) {
        threshold = this.scrollHeight / 2
      }
      const defaultHeight = 33
      let yStart = index * defaultHeight
      const prevHeight = this.heightByIndex[index - 1]
      if (prevHeight) {
        let yStart = 0
        for (let i = 0; i - 1 < index; i++) {
          yStart = yStart + this.heightByIndex[i]
        }
      }
      const yEnd = yStart + defaultHeight
      const isAboveScroll = (yEnd + threshold) < this.scrollY
      const isBelowScroll = (yStart - threshold) > (this.scrollHeight + this.scrollY)
      if (isAboveScroll || isBelowScroll) { return }
      this.updateItemHeight(index)
      return true
    },
    updateItemHeight (index) {
      let element = this.$refs.spaceList
      if (!element) { return }
      const elements = element.getElementsByClassName('.space-wrap')
      if (!elements.length) { return }
      const offset = 3
      let height = elements[index].getBoundingClientRect().height
      this.heightByIndex[index] = height
    },
    duplicateSpace () {
      this.$store.dispatch('currentSpace/duplicateSpace')
      this.$store.dispatch('closeAllDialogs')
    },
    isNew (space) {
      if (this.userShowInExploreDate) {
        const readDate = dayjs(this.userShowInExploreDate)
        const spaceDate = dayjs(space.showInExploreUpdatedAt)
        const delta = readDate.diff(spaceDate, 'second')
        return delta < 0
      }
      const isEditedByOtherUser = space.editedByUserId !== this.currentUser.id
      if (isEditedByOtherUser) {
        return space.isEdited
      } else {
        return false
      }
    },
    showCollaborator (space) {
      const isUser = Boolean(this.user(space))
      return this.showUserIfCurrentUserIsCollaborator && space.currentUserIsCollaborator && isUser
    },
    categoryClassName (space) {
      const className = utils.normalizeString(space.category)
      return className
    },
    updateFilteredSpaces (spaces) {
      this.filteredSpaces = spaces
    },
    updateFilter (filter) {
      this.filter = filter
      const spaces = this.spacesFiltered || this.spaces
      if (!spaces.length) { return }
      if (!filter) {
        this.focusOnId = ''
        return
      }
      this.focusOnId = spaces[0].id
    },
    spaceIsActive (space) {
      if (this.selectedSpace) {
        return Boolean(this.selectedSpace.id === space.id)
      } else {
        return this.spaceIsCurrentSpace(space)
      }
    },
    isLoadingSpace (space) {
      const isLoadingSpace = this.$store.state.isLoadingSpace
      return isLoadingSpace && this.spaceIsCurrentSpace(space)
    },
    spaceIsCurrentSpace (space) {
      const currentSpace = this.$store.state.currentSpace.id
      return Boolean(currentSpace === space.id)
    },
    spaceIsTemplate (space) {
      if (space.isTemplate) { return true }
      const templateSpaceIds = templates.spaces().map(template => template.id)
      return templateSpaceIds.includes(space.id)
    },
    showInExplore (space) {
      if (this.hideExploreBadge) { return }
      if (space.privacy === 'private') { return }
      return space.showInExplore
    },
    user (space) {
      let users = []
      if (utils.arrayExists(space.users)) {
        users = space.users
      }
      return space.user || users[0]
    },
    focusPreviousItem (currentIndex) {
      const spaces = this.spacesFiltered
      const focusedSpaceName = this.spaces.find(space => space.id === this.focusOnId)
      const firstItemIsFocused = this.search === focusedSpaceName
      const firstItem = spaces[0]
      const previousItem = spaces[currentIndex - 1]
      if (firstItemIsFocused) {
        this.closeDialog()
      } else if (previousItem) {
        this.focusOnId = previousItem.id
      } else {
        this.focusOnId = firstItem.id
        this.$emit('focusBeforeFirstItem')
      }
    },
    focusNextItem (currentIndex) {
      const spaces = this.spacesFiltered
      const lastItem = last(spaces)
      const lastItemIsFocused = lastItem.name === this.focusOnId
      const nextItem = spaces[currentIndex + 1]
      if (lastItemIsFocused) {
        this.closeDialog()
      } else if (nextItem) {
        this.focusOnId = nextItem.id
      } else {
        this.focusOnId = lastItem.id
      }
    },
    selectSpace (event, space) {
      if (event) {
        if (event.metaKey || event.ctrlKey) {
          return
        } else {
          event.preventDefault()
          event.stopPropagation()
        }
      }
      if (shouldPreventSelectSpace) {
        shouldPreventSelectSpace = false
        return
      }
      if (!space) { return }
      this.$emit('selectSpace', space)
    },
    closeDialog () {
      this.$emit('closeDialog')
    },

    focusNextItemFromFilter () {
      const spaces = this.spacesFiltered
      const currentIndex = spaces.findIndex(space => space.id === this.focusOnId)
      this.focusNextItem(currentIndex)
    },
    focusPreviousItemFromFilter () {
      const spaces = this.spacesFiltered
      const currentIndex = spaces.findIndex(space => space.id === this.focusOnId)
      this.focusPreviousItem(currentIndex)
    },
    selectItemFromFilter () {
      if (shouldPreventSelectSpace) {
        shouldPreventSelectSpace = false
        return
      }
      const spaces = this.spacesFiltered
      const space = spaces.find(space => space.id === this.focusOnId)
      this.$store.commit('shouldPreventNextEnterKey', true)
      this.selectSpace(null, space)
    },
    checkmarkSpace (space) {
      shouldPreventSelectSpace = true
      this.$emit('checkmarkSpace', space)
    }
  },
  watch: {
    spaces: {
      handler (spaces) {
        const cardDetailsIsVisible = this.$store.state.cardDetailsIsVisibleForCardId
        if (spaces && cardDetailsIsVisible) {
          this.focusOnId = spaces[0].id
        }
      },
      deep: true
    },
    resultsSectionHeight (value) {
      this.$nextTick(() => {
        this.updateScroll()
      })
    },
    isLoading (value) {
      this.$nextTick(() => {
        this.updateScroll()
      })
    }
  }
}
</script>

<style lang="stylus">
.space-list-wrap
  position relative

.space-list
  .inline-badge
    margin-left 0
    flex none

  .new-unread-badge
    margin-top 7px

  .badge
    margin-left 0

  .sunglasses
    width 16px

  .icon.tweet
    min-width 12px
    margin-right 4px
    vertical-align -1px

  .name
    margin 0
    margin-top 1px
    white-space wrap
    overflow hidden
    .icon
      margin-left 6px

  .privacy-icon
    height 12px
    vertical-align -2px

  .favorite-icon,
  .inbox-icon
    margin-right 4px
    width 12px
    min-width 12px

  .user
    margin-right 6px
    vertical-align middle

  .users
    margin-right 6px
    display flex
    flex-wrap wrap
    justify-content flex-end
    align-content flex-start
    .user
      margin-right 0

  a
    color var(--primary)
    text-decoration none

  .color-only-badge
    width 16px
    height 16px
    padding 0
    min-width initial
    min-height initial

  .button-checkmark
    margin-left auto

  .checkmark
    vertical-align 1px
    width 10px

  li
    position relative
    width 100%
    min-height 30px
    .loader
      position absolute
      width 13px
      height 13px
      top 5px
    .icon.templates
      margin-right 4px

  .space-wrap
    position relative
    button.inline-duplicate,
    button.inline-favorite
      cursor pointer
      z-index 1
      padding 0
      padding-left 6px
      padding-right 2px
  .inline-favorite-wrap
    cursor pointer
    position absolute
    right 4px
    top 3px
    padding 6px
    padding-right 0

</style>
