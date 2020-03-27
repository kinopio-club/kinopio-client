<template lang="pug">
.new-spaces(v-if="visible" :open="visible" @click.stop ref="dialog")
  section.header
    p Recently updated spaces made by cool people like you
    ShowInExplore(@updateSpaces="updateCurrentSpace" :label="showInExploreLabel")
    p(v-if="loading")
      Loader(:visible="loading")
  section.results-section
    SpaceList(:spaces="spaces" :showUser="true" :hideExploreBadge="true" @selectSpace="changeSpace")
</template>

<script>
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import ShowInExplore from '@/components/ShowInExplore.vue'

export default {
  name: 'NewSpaces',
  components: {
    Loader,
    SpaceList,
    ShowInExplore
  },
  props: {
    visible: Boolean,
    loading: Boolean,
    spaces: Array
  },
  computed: {
    showInExploreLabel () {
      return 'Show my Space in Explore'
    }
  },
  methods: {
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    },
    updateCurrentSpace () {
      this.$emit('updateCurrentSpace')
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
