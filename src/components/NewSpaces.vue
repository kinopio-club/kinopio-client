<template lang="pug">
.new-spaces(v-if="visible" :open="visible" @click.left.stop)
  section.header
    p Recently updated spaces made by cool people like you
    ShowInExploreButton(@updateSpaces="updateCurrentSpace" :label="showInExploreLabel")
    p(v-if="loading")
      Loader(:visible="loading")
  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(:hideFilter="true" :spaces="spaces" :showUser="true" :hideExploreBadge="true" @selectSpace="changeSpace")
</template>

<script>
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import ShowInExploreButton from '@/components/ShowInExploreButton.vue'
import utils from '@/utils.js'

export default {
  name: 'NewSpaces',
  components: {
    Loader,
    SpaceList,
    ShowInExploreButton
  },
  props: {
    visible: Boolean,
    loading: Boolean,
    spaces: Array
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
.new-spaces
  .header
    border-top 1px solid var(--primary)
    border-top-left-radius 0
    border-top-right-radius 0
  .badge
    display flex
  button + a
    margin-left 6px
</style>
