<template lang="pug">
span.space-list-wrap
  ResultsFilter(
    :hideFilter="hideFilter"
    :items="spaces"
    :placeholder="placeholder"
    :isLoading="isLoading"
    :parentIsPinned="parentIsPinned"
    @updateFilter="updateFilter"
    @updateFilteredItems="updateFilteredSpaces"
    @focusNextItem="focusNextItemFromFilter"
    @focusPreviousItem="focusPreviousItemFromFilter"
    @selectItem="selectItemFromFilter"
  )
  ul.results-list.space-list
    template(v-for="space in spacesFiltered" :key="space.id")
      a(:href="space.url")
        li(
          @click.left.prevent.stop="selectSpace(space)"
          :class="{ active: spaceIsActive(space), hover: focusOnId === space.id }"
          tabindex="0"
          v-on:keyup.enter="selectSpace(space)"
        )
          //- User(s)
          template(v-if="showOtherUsers")
            .users
              User(:user="user(space)" :isClickable="false" :key="user(space).id")
              template(v-for="otherUser in space.otherUsers" :key="otherUser.id")
                User(:user="otherUser" :isClickable="false")
          template(v-else-if="showUser")
            User(:user="user(space)" :isClickable="false" :key="user(space).id")
          template(v-else-if="showCollaborator(space)")
            User(:user="user(space)" :isClickable="false" :key="user(space).id")
          //- NEW badge
          span(v-if="isNew(space)")
            .badge.info.inline-badge.new-badge New
          //- today journal badge
          span.badge.info.inline-badge(v-if="isTodayJournal(space)" title="Today's journal")
            img.icon.today-icon(src="@/assets/today.svg")
          //- space meta
          span(v-if="space.isFavorite")
            img.icon.favorite-icon(src="@/assets/heart.svg")

          //- span(v-if="space.backgroundTint")
          //-   .badge.inline-badge.color-only-badge(:style="{ background: space.backgroundTint }")
          MoonPhase(v-if="space.moonPhase" :moonPhase="space.moonPhase")
          .badge.info.inline-badge(v-if="showCategory" :class="categoryClassName(space)") {{space.category}}
          .badge.info.inline-badge(v-else-if="spaceIsTemplate(space)") Template
          //- space details
          .name
            span {{space.name}}
            PrivacyIcon(:privacy="space.privacy" :closedIsNotVisible="true")
            img.icon.sunglasses(src="@/assets/sunglasses.svg" v-if="showInExplore(space)" title="Shown in Explore")

</template>

<script>
import templates from '@/data/templates.js'
import ResultsFilter from '@/components/ResultsFilter.vue'
import MoonPhase from '@/components/MoonPhase.vue'
import utils from '@/utils.js'
import { defineAsyncComponent } from 'vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'

import last from 'lodash-es/last'
const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})

export default {
  name: 'SpaceList',
  components: {
    User,
    ResultsFilter,
    MoonPhase,
    PrivacyIcon
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
    parentIsPinned: Boolean
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
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
        this.selectSpace(currentSpace)
        this.$store.commit('shouldPreventNextEnterKey', true)
      }
    })
  },
  data () {
    return {
      filter: '',
      filteredSpaces: [],
      focusOnId: ''
    }
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
    isNew (space) {
      const isEditedByOtherUser = space.editedByUserId !== this.currentUser.id
      if (isEditedByOtherUser) {
        return space.isEdited
      } else {
        return false
      }
    },
    isTodayJournal (space) {
      if (space.moonPhase) {
        const createdAt = utils.journalSpaceDateFromName(space.name)
        if (!createdAt) { return }
        const today = utils.journalSpaceName()
        return createdAt === today
      } else {
        return false
      }
    },
    showCollaborator (space) {
      const isUser = Boolean(this.user(space))
      return this.showUserIfCurrentUserIsCollaborator && space.currentUserIsCollaborator && isUser
    },
    categoryClassName (space) {
      return space.category.toLowerCase()
    },
    updateFilteredSpaces (spaces) {
      this.filteredSpaces = spaces
    },
    updateFilter (filter) {
      this.filter = filter
      const spaces = this.spacesFiltered || this.spaces
      if (!spaces.length) { return }
      this.focusOnId = spaces[0].id
    },
    spaceIsActive (space) {
      if (this.selectedSpace) {
        return Boolean(this.selectedSpace.id === space.id)
      } else {
        return this.spaceIsCurrentSpace(space)
      }
    },
    spaceIsCurrentSpace (space) {
      const currentSpace = this.$store.state.currentSpace.id
      return Boolean(currentSpace === space.id)
    },
    spaceIsTemplate (space) {
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
    selectSpace (space) {
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
      const spaces = this.spacesFiltered
      const space = spaces.find(space => space.id === this.focusOnId)
      this.$store.commit('shouldPreventNextEnterKey', true)
      this.selectSpace(space)
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

  .new-badge
    word-break keep-all

  .badge
    margin-left 0

  .sunglasses
    width 16px

  .today-icon
    width 12px
    height 12px
    vertical-align -2px

  .name
    margin 0
    white-space wrap
    overflow hidden
    .icon
      margin-left 6px

  .privacy-icon
    height 12px
    vertical-align -2px

  .favorite-icon
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
</style>
