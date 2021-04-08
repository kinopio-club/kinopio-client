<template lang="pug">
span.space-list-wrap
  ResultsFilter(:hideFilter="hideFilter" :items="spaces" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredSpaces")
  ul.results-list.space-list
    template(v-for="(space in spacesFiltered")
      a(:href="space.url")
        li(
          @click.left.prevent.stop="selectSpace(space)"
          :class="{ active: spaceIsActive(space), hover: focusOnName === space.name }"
          :key="space.id"
          tabindex="0"
          v-on:keyup.enter="selectSpace(space)"
        )
          template(v-if="showUser")
            User(:user="user(space)" :isClickable="false" :key="user(space).id")
          template(v-else-if="showCollaborator(space)")
            User(:user="user(space)" :isClickable="false" :key="user(space).id")
          //- NEW
          span(v-if="space.isEdited")
            .badge.info.inline-badge.new-badge New
          //- space meta
          span(v-if="space.isFavorite")
            img.icon.favorite-icon(src="@/assets/heart.svg")
          MoonPhase(v-if="space.moonPhase" :moonPhase="space.moonPhase")
          .badge.info.inline-badge(v-if="showCategory" :class="categoryClassName(space)") {{space.category}}
          .badge.info.inline-badge(v-else-if="spaceIsTemplate(space)") Template
          //- space details
          .name
            span {{space.name}}
            img.icon.privacy-icon(v-if="spaceIsNotClosed(space)" :src="privacyIcon(space)")
            .badge.status(v-if="showInExplore(space)")
              img.icon(src="@/assets/checkmark.svg")
    Loader(:visible="isLoading")

</template>

<script>
import privacy from '@/data/privacy.js'
import templates from '@/data/templates.js'
import ResultsFilter from '@/components/ResultsFilter.vue'
import MoonPhase from '@/components/MoonPhase.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

import last from 'lodash-es/last'

export default {
  name: 'SpaceList',
  components: {
    User: () => import('@/components/User.vue'),
    ResultsFilter,
    Loader,
    MoonPhase
  },
  mounted () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerPickerNavigationKey') {
        const key = mutation.payload
        const spaces = this.spaces
        let currentIndex = spaces.findIndex(space => space.name === this.focusOnName)
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
        const currentSpace = spaces.find(space => space.name === this.focusOnName)
        this.selectSpace(currentSpace)
      }
    })
  },
  props: {
    spaces: Array,
    selectedSpace: Object,
    showCategory: Boolean,
    showUser: Boolean,
    showUserIfCurrentUserIsCollaborator: Boolean,
    hideExploreBadge: Boolean,
    hideFilter: Boolean,
    isLoading: Boolean
  },
  data () {
    return {
      filter: '',
      filteredSpaces: [],
      focusOnName: ''
    }
  },
  computed: {
    spacesFiltered () {
      if (this.filter) {
        return this.filteredSpaces
      } else {
        return this.spaces
      }
    }
  },
  methods: {
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
    selectSpace (space) {
      this.$emit('selectSpace', space)
    },
    spaceIsNotClosed (space) {
      return space.privacy !== 'closed'
    },
    privacyIcon (space) {
      const privacyState = privacy.states().find(state => {
        return state.name === space.privacy
      })
      if (privacyState) {
        return require(`@/assets/${privacyState.icon}.svg`)
      }
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
      const spaces = this.spaces
      const firstItemIsFocused = this.search === this.focusOnName
      const firstItem = spaces[0]
      const previousItem = spaces[currentIndex - 1]
      if (firstItemIsFocused) {
        this.closeDialog()
      } else if (previousItem) {
        this.focusOnName = previousItem.name
      } else {
        this.focusOnName = firstItem.name
      }
    },
    focusNextItem (currentIndex) {
      const spaces = this.spaces
      const lastItem = last(spaces)
      const lastItemIsFocused = lastItem.name === this.focusOnName
      const nextItem = spaces[currentIndex + 1]
      if (lastItemIsFocused) {
        this.closeDialog()
      } else if (nextItem) {
        this.focusOnName = nextItem.name
      } else {
        this.focusOnName = lastItem.name
      }
    },
    closeDialog () {
      this.$emit('closeDialog')
    }
  },
  watch: {
    spaces (spaces) {
      const cardDetailsIsVisible = this.$store.state.cardDetailsIsVisibleForCardId
      if (spaces && cardDetailsIsVisible) {
        this.focusOnName = spaces[0].name
      }
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

  .badge.status
    display inline-flex
    margin 0
    margin-left 6px
    min-height auto
    height 14px
    img
      margin 0

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

  .user
    margin-right 6px
    vertical-align middle

  .loader
    position absolute
    top 4px
    left 4px
    height 14px
    width 14px

  a
    color var(--primary)
    text-decoration none
</style>
