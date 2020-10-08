<template lang="pug">
span
  ResultsFilter(:hideFilter="hideFilter" :items="spaces" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredSpaces")
  ul.results-list.space-list
    template(v-for="(space in spacesFiltered")
      li(@click.left="selectSpace(space)" :class="{ active: spaceIsActive(space) }" :key="space.id" tabindex="0" v-on:keyup.enter="selectSpace(space)")
        User(v-if="showUser" :user="user(space)" :isClickable="false" :key="user(space).id")
        template(v-else-if="showUserIfCurrentUserIsCollaborator && space.currentUserIsCollaborator")
          User(:user="user(space)" :isClickable="false" :key="user(space).id")
        MoonPhase(v-if="space.moonPhase" :moonPhase="space.moonPhase")
        .badge.info.template-badge(v-if="showCategory") {{space.category}}
        .badge.info.template-badge(v-else-if="spaceIsTemplate(space)") Template
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

export default {
  name: 'SpaceList',
  components: {
    User: () => import('@/components/User.vue'),
    ResultsFilter,
    Loader,
    MoonPhase
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
      filteredSpaces: []
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
      return space.user || space.users[0]
    }
  }
}
</script>

<style lang="stylus">
.space-list
  .template-badge
    margin-left 0
    flex none

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

  .user
    margin-right 6px
    vertical-align middle

  .loader
    margin-left 6px
</style>
