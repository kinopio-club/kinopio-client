<template lang="pug">
.community(v-if="visible" :open="visible" @click.left.stop)
  section.header
    .segmented-buttons
      button(@click.left.stop="toggleAllSpacesIsVisible(true)" :class="{ active: allSpacesIsVisible }")
        span All
      button(@click.left.stop="toggleAllSpacesIsVisible(false)" :class="{ active: !allSpacesIsVisible }")
        img.icon(src="@/assets/heart.svg")
        span Best Of
    template(v-if="allSpacesIsVisible")
      p Recently updated spaces made by cool people like you
      ShowInExploreButton(@updateSpaces="updateCurrentSpace" :label="showInExploreLabel")
    template(v-if="!allSpacesIsVisible")
      p Selections by the creator of Kinopio
    p(v-if="loading")
      Loader(:visible="loading")
  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(:spaces="spaces" :showUser="true" :hideExploreBadge="true" @selectSpace="changeSpace")
</template>

<script>
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import ShowInExploreButton from '@/components/ShowInExploreButton.vue'
import utils from '@/utils.js'

export default {
  name: 'Community',
  components: {
    Loader,
    SpaceList,
    ShowInExploreButton
  },
  props: {
    visible: Boolean,
    loading: Boolean,
    spaces: Array,
    allSpacesIsVisible: Boolean
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
      resultsSectionHeight: null
    }
  },
  computed: {
    showInExploreLabel () {
      return 'Show Space in Explore'
    }
  },
  methods: {
    toggleAllSpacesIsVisible (value) {
      this.$emit('toggleAllSpacesIsVisible', value)
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
  .header
    border-top 1px solid var(--primary)
    border-top-left-radius 0
    border-top-right-radius 0
  .badge
    display flex
  button + a
    margin-left 6px
</style>
