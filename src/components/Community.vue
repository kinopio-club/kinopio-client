<template lang="pug">
.community(v-if="visible" :open="visible" @click.left.stop)
  section
    template
      p
        img.icon.sunglasses(src="@/assets/sunglasses.svg")
        span Explore cool community spaces
      ShowInExploreButton(@updateSpaces="updateCurrentSpace" :label="showInExploreLabel")
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
.community
  .badge
    display flex
  button + a
    margin-left 6px
</style>
