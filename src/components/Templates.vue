<template lang="pug">
section.templates(v-if="visible" :open="visible" @click.left.stop)
  section.results-section(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    // Add to Templates
    .button-wrap(@click.left.prevent="toggleCurrentSpaceIsTemplate" @keydown.stop.enter="toggleCurrentSpaceIsTemplate")
      button.variable-length-content(:class="{ active: currentSpaceIsTemplate }")
        img.icon.templates(src="@/assets/templates.svg")
        span(v-if="!currentSpaceIsTemplate") Turn Current Space Into Template
        span(v-if="currentSpaceIsTemplate") Is Template

    SpaceList(:spaces="templates" :showCategory="true" @selectSpace="changeSpace" :isLoading="isLoadingRemoteSpaces")
</template>

<script>
import templates from '@/data/templates.js'
import SpaceList from '@/components/SpaceList.vue'
import cache from '@/cache.js'

import dayjs from 'dayjs'

export default {
  name: 'Templates',
  components: {
    SpaceList
  },
  props: {
    visible: Boolean,
    hideOptions: Boolean
  },
  mounted () {
    this.init()
  },
  data () {
    return {
      resultsSectionHeight: null,
      userSpaces: [],
      spaces: [],
      isLoadingRemoteSpaces: false
    }
  },
  computed: {
    currentSpaceIsTemplate () { return this.$store.state.currentSpace.isTemplate },
    categories () {
      return templates.categories()
    },
    systemTemplates () {
      let spaces = templates.spaces()
      return spaces.map(space => {
        if (!space.categoryId) { return }
        const category = this.categories.find(category => category.id === space.categoryId)
        space.category = category.name
        space.fullName = `${space.category} – ${space.name}`
        return space
      })
    },
    templates () {
      return this.userSpaces.concat(this.spaces)
    }
  },
  methods: {
    init () {
      this.spaces = this.systemTemplates
      this.userSpaces = this.localSpaces().concat(this.userSpaces)
      this.updateWithRemoteSpaces()
    },
    localSpaces () {
      let localSpaces = cache.getAllSpaces().filter(space => {
        return space.isTemplate
      })
      localSpaces = this.sortSpacesByEditedAt(localSpaces)
      return localSpaces || []
    },

    async updateWithRemoteSpaces () {
      const currentUserIsSignedIn = this.$store.getters['currentUser/isSignedIn']
      if (!currentUserIsSignedIn) { return }
      this.isLoadingRemoteSpaces = true
      let remoteSpaces = await this.$store.dispatch('api/getUserSpaces')
      remoteSpaces = remoteSpaces.filter(space => space.isTemplate)
      remoteSpaces = this.sortSpacesByEditedAt(remoteSpaces)
      this.localSpaces = remoteSpaces
      this.isLoadingRemoteSpaces = false
    },
    toggleCurrentSpaceIsTemplate () {
      const currentSpace = this.$store.state.currentSpace
      const value = !this.currentSpaceIsTemplate
      this.$store.dispatch('currentSpace/updateSpace', { isTemplate: value })
      if (value) {
        this.userSpaces.unshift(currentSpace)
      } else {
        this.userSpaces = this.userSpaces.filter(space => space.id !== currentSpace.id)
      }
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    },
    // copied from SpaceDetails.vue
    sortSpacesByEditedAt (spaces) {
      const sortedSpaces = spaces.sort((a, b) => {
        const bEditedAt = dayjs(b.editedAt).unix()
        const aEditedAt = dayjs(a.editedAt).unix()
        return bEditedAt - aEditedAt
      })
      return sortedSpaces
    }
  }
}
</script>

<style lang="stylus">
.templates
  padding 0
  padding-top 4px
  .button-wrap
    margin 4px
  .inline-badge
    &.learning
      background-color #f0e68c
      color var(--primary-on-light-background)
    &.life
      background-color #b9a8ff
      color var(--primary-on-light-background)
    &.work-school
      background-color #ffc0cb
      color var(--primary-on-light-background)
    &.product
      background-color #ee83ee
      color var(--primary-on-light-background)
</style>
