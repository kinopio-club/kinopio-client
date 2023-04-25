<template lang="pug">
section.community(v-if="visible" :open="visible" @click.left.stop='closeDialogs')
  .row.title-row
    span.title Explore Community Spaces
    .button-wrap
      button.small-button(@click.stop="toggleExploreRssFeedIsVisible" :class="{active: exploreRssFeedIsVisible}")
        span RSS
      ExploreRssFeed(:visible="exploreRssFeedIsVisible")
  //- Add to Explore
  section.subsection(v-if="isSpaceMember")
    p Share this space with the community
    p
      AddToExplore(@updateLocalSpaces="updateLocalSpaces")
  section.subsection(v-else-if="!isSpaceMember && !currentSpaceInExplore")
    p Share this space with the community
    p
      AskToAddToExplore

  p(v-if="loading")
    Loader(:visible="loading")
section.results-section(ref="results")
  SpaceList(:spaces="exploreSpaces" :showUser="true" :hideExploreBadge="true" @selectSpace="changeSpace" :userShowInExploreDate="userShowInExploreDate")
</template>

<script>
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import ExploreRssFeed from '@/components/dialogs/ExploreRssFeed.vue'
import AddToExplore from '@/components/AddToExplore.vue'
import AskToAddToExplore from '@/components/AskToAddToExplore.vue'
import utils from '@/utils.js'

export default {
  name: 'Community',
  components: {
    Loader,
    SpaceList,
    ExploreRssFeed,
    AddToExplore,
    AskToAddToExplore
  },
  props: {
    visible: Boolean,
    loading: Boolean,
    spaces: Array,
    userShowInExploreDate: String
  },
  data () {
    return {
      exploreRssFeedIsVisible: false,
      filteredSpaces: undefined
    }
  },
  computed: {
    showInExploreLabel () {
      return 'Show Space in Explore'
    },
    currentSpace () { return this.$store.state.currentSpace },
    currentSpaceInExplore () { return this.currentSpace.showInExplore },
    exploreSpaces () { return this.filteredSpaces || this.spaces },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() }
  },
  methods: {
    updateLocalSpaces () {
      if (this.currentSpaceInExplore) {
        this.removeCurrentSpaceFromFilteredSpaces()
        this.filteredSpaces.unshift(this.currentSpace)
      } else {
        this.removeCurrentSpaceFromFilteredSpaces()
      }
    },
    removeCurrentSpaceFromFilteredSpaces () {
      let spaces = this.exploreSpaces
      spaces = spaces.filter(space => space.id !== this.currentSpace.id)
      this.filteredSpaces = spaces
    },
    closeDialogs () {
      this.exploreRssFeedIsVisible = false
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    },
    toggleExploreRssFeedIsVisible () {
      this.exploreRssFeedIsVisible = !this.exploreRssFeedIsVisible
    }
  }
}
</script>

<style lang="stylus">
.community
  .badge
    display flex
  button + a
    margin-left 6px
  .title
    color var(--primary)
</style>
