<template lang="pug">
.community(v-if="visible" :open="visible" @click.left.stop='closeDialogs')
  section
    p
      img.icon.sunglasses(src="@/assets/sunglasses.svg")
      span Explore Community Spaces
      .button-wrap
        button.small-button(@click.stop="toggleExploreRssFeedIsVisible" :class="{active: exploreRssFeedIsVisible}")
          span RSS
        ExploreRssFeed(:visible="exploreRssFeedIsVisible")
    p(v-if="loading")
      Loader(:visible="loading")
  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(:spaces="spaces" :showUser="true" :hideExploreBadge="true" @selectSpace="changeSpace" :userShowInExploreDate="userShowInExploreDate")
</template>

<script>
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import ExploreRssFeed from '@/components/dialogs/ExploreRssFeed.vue'
import utils from '@/utils.js'

export default {
  name: 'Community',
  components: {
    Loader,
    SpaceList,
    ExploreRssFeed
  },
  props: {
    visible: Boolean,
    loading: Boolean,
    spaces: Array,
    userShowInExploreDate: String
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateResultsSectionHeight()
      }
    })
  },
  data () {
    return {
      resultsSectionHeight: null,
      exploreRssFeedIsVisible: false
    }
  },
  computed: {
    showInExploreLabel () {
      return 'Show Space in Explore'
    }
  },
  methods: {
    closeDialogs () {
      this.exploreRssFeedIsVisible = false
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    },
    updateCurrentSpace () {
      this.$emit('updateCurrentSpace')
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
      })
    },
    toggleExploreRssFeedIsVisible () {
      this.exploreRssFeedIsVisible = !this.exploreRssFeedIsVisible
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateResultsSectionHeight()
      }
    },
    loading (loading) {
      this.updateResultsSectionHeight()
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
</style>
