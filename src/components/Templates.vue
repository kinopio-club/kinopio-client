<template lang="pug">
section.templates-component(v-if="visible" :open="visible" @click.left.stop)
  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(:spaces="spaces" :showCategory="true" @selectSpace="changeSpace")
</template>

<script>
import templates from '@/data/templates.js'
import SpaceList from '@/components/SpaceList.vue'
import utils from '@/utils.js'

export default {
  name: 'TemplatesComponent',
  components: {
    SpaceList
  },
  props: {
    visible: Boolean,
    hideOptions: Boolean
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
    categories () {
      return templates.categories()
    },
    spaces () {
      let spaces = templates.spaces()
      return spaces.map(space => {
        const category = this.categories.find(category => category.id === space.categoryId)
        space.category = category.name
        space.fullName = `${space.category} – ${space.name}`
        return space
      })
    }
  },
  methods: {
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
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
.templates-component
  padding 0
  padding-top 4px
  .categories
    border-top 1px solid var(--primary)
    border-top-left-radius 0
    border-top-right-radius 0
  .category-wrap
    > button
      .badge
        margin 0
  // template category colors
  .inline-badge
    &.learning
      background-color #f0e68c
    &.life
      background-color #b9a8ff
    &.planning
      background-color #ffc0cb
    &.product
      background-color #ee83ee
</style>
