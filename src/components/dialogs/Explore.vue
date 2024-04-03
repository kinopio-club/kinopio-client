<template lang="pug">
dialog.explore.wide(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section.community(v-if="visible" :open="visible" @click.left.stop='closeDialogs')
    .row.title-row
      .segmented-buttons
        button.active
          span Highlights
        button
          span Following
        button
          span Everyone

      .button-wrap
        button.small-button(@click.stop="toggleExploreRssFeedsIsVisible" :class="{active: exploreRssFeedsIsVisible}")
          span RSS
        ExploreRssFeeds(:visible="exploreRssFeedsIsVisible")
    p(v-if="loading")
      Loader(:visible="loading")
  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(
      :spaces="exploreSpaces"
      :showUser="true"
      :hideExploreBadge="true"
      @selectSpace="changeSpace"
      :userShowInExploreDate="userShowInExploreDate"
      :resultsSectionHeight="resultsSectionHeight"
      :parentDialog="parentDialog"
    )
</template>

<script>
import SpaceList from '@/components/SpaceList.vue'
import ExploreRssFeeds from '@/components/dialogs/ExploreRssFeeds.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

export default {
  name: 'Explore',
  components: {
    Loader,
    SpaceList,
    ExploreRssFeeds
  },
  props: {
    visible: Boolean,
    preloadedSpaces: Object
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
      dialogHeight: null,
      resultsSectionHeight: null,
      loading: false,
      spaces: [],
      newSpaces: [],
      userShowInExploreDate: null,
      exploreRssFeedsIsVisible: false,
      filteredSpaces: undefined
    }
  },
  computed: {
    currentSpace () { return this.$store.state.currentSpace },
    currentSpaceInExplore () { return this.currentSpace.showInExplore },
    exploreSpaces () { return this.filteredSpaces || this.spaces },
    parentDialog () { return 'explore' }
  },
  methods: {
    async updateSpaces () {
      if (this.loading) { return }
      this.loading = true
      if (!this.spaces.length) {
        this.spaces = this.preloadedSpaces || []
      }
      this.spaces = await this.$store.dispatch('api/getExploreSpaces')
      this.newSpaces = this.spaces
      this.loading = false
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element, true)
      })
    },
    async updateUserShowInExploreUpdatedAt () {
      this.userShowInExploreDate = this.$store.state.currentUser.showInExploreUpdatedAt
      let serverDate = await this.$store.dispatch('api/getDate')
      serverDate = serverDate.date
      this.$store.dispatch('currentUser/showInExploreUpdatedAt', serverDate)
    },
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
      this.exploreRssFeedsIsVisible = false
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', space)
    },
    toggleExploreRssFeedsIsVisible () {
      this.exploreRssFeedsIsVisible = !this.exploreRssFeedsIsVisible
    }
  },
  watch: {
    visible (visible) {
      this.$store.commit('clearNotificationsWithPosition')
      if (visible) {
        this.updateSpaces()
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
        this.updateUserShowInExploreUpdatedAt()
        this.$store.commit('shouldExplicitlyHideFooter', true)
      } else {
        this.exploreRssFeedsIsVisible = false
        this.$store.commit('shouldExplicitlyHideFooter', false)
      }
    },
    loading (value) {
      this.updateDialogHeight()
      this.updateResultsSectionHeight()
    }
  }
}
</script>

<style lang="stylus">
dialog.explore
  &.wide
    width 320px
  left initial
  right -35px
  overflow auto
  .community
    .badge
      display flex
    button + a
      margin-left 6px
    .title
      color var(--primary)

</style>
