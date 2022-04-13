<template lang="pug">
section.templates-component(v-if="visible" :open="visible" @click.left.stop)
  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    // Add to Templates
    .button-wrap(@click.left.prevent="toggleCurrentSpaceIsTemplate" @keydown.stop.enter="toggleCurrentSpaceIsTemplate")
      button(:class="{ active: currentSpaceIsTemplate }")
        img.icon.templates(src="@/assets/templates.svg")
        span(v-if="!currentSpaceIsTemplate") Add Template
        span(v-if="currentSpaceIsTemplate") Is Template

    SpaceList(:spaces="spaces" :showCategory="true" @selectSpace="changeSpace")
</template>

<script>
import templates from '@/data/templates.js'
import SpaceList from '@/components/SpaceList.vue'

export default {
  name: 'TemplatesComponent',
  components: {
    SpaceList
  },
  props: {
    visible: Boolean,
    hideOptions: Boolean
  },
  mounted () {
    this.spaces = this.templates
    // TODO prepend with userTemplates()
  },
  data () {
    return {
      resultsSectionHeight: null,
      spaces: []
    }
  },
  computed: {
    currentSpaceIsTemplate () { return this.$store.state.currentSpace.isTemplate },
    categories () {
      return templates.categories()
    },
    templates () {
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
    userTemplates () {
      // TODO prepend user spaces with .isTemplate
      // TODO sortSpacesByEditedAt
      // update this.s
    },
    toggleCurrentSpaceIsTemplate () {
      const value = !this.currentSpaceIsTemplate
      this.$store.dispatch('currentSpace/updateSpace', { isTemplate: value })
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    }
    // from SpaceDetails.vue
    // sortSpacesByEditedAt (spaces) {
    //   const sortedSpaces = spaces.sort((a, b) => {
    //     const bEditedAt = dayjs(b.editedAt).unix()
    //     const aEditedAt = dayjs(a.editedAt).unix()
    //     return bEditedAt - aEditedAt
    //   })
    //   return sortedSpaces
    // },
  }
}
</script>

<style lang="stylus">
.templates-component
  padding 0
  padding-top 4px
  .button-wrap
    margin 4px
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
