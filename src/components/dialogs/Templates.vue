<template lang="pug">
dialog.templates.narrow(
  v-if="visible"
  :open="visible"
  @touchend.stop
  @click.left.stop
  ref="dialog"
  :style="{'max-height': dialogHeight + 'px'}"
)
  section
    p Templates
  section.add-to-templates
  section.results-section(:style="{'max-height': resultsSectionHeight + 'px'}")
    SpaceList(
      :spaces="templatesList"
      :showCategory="true"
      @selectSpace="changeSpace"
      :isLoading="isLoadingRemoteSpaces"
      :parentDialog="parentDialog"
    )
</template>

<script>
import SpaceList from '@/components/SpaceList.vue'
import templates from '@/data/templates.js'
import cache from '@/cache.js'
import utils from '@/utils.js'

import dayjs from 'dayjs'

export default {
  name: 'Templates',
  components: {
    SpaceList
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  mounted () {
    this.init()
  },
  data () {
    return {
      dialogHeight: null,
      resultsSectionHeight: null,
      localSpaces: [],
      spaces: [],
      isLoadingRemoteSpaces: false
    }
  },
  computed: {
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
    templatesList () {
      const templates = this.localSpaces.concat(this.systemTemplates)
      return templates.map(template => {
        template.previewThumbnailImage = `https://us-east-1.linodeobjects.com/kinopio-uploads/${template.id}/preview-image-thumbnail-${template.id}.jpg`
        return template
      })
    },
    parentDialog () { return 'templates' }
  },
  methods: {
    init () {
      this.updateWithLocalSpaces()
      this.updateWithRemoteSpaces()
    },
    updateWithLocalSpaces () {
      let localSpaces = cache.getAllSpaces().filter(space => {
        return space.isTemplate
      })
      localSpaces = this.sortSpacesByEditedAt(localSpaces)
      this.localSpaces = localSpaces || []
      this.updateHeight()
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
      this.updateHeight()
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', space)
    },
    // copied from SpaceDetails.vue
    sortSpacesByEditedAt (spaces) {
      const sortedSpaces = spaces.sort((a, b) => {
        const bEditedAt = dayjs(b.editedAt).unix()
        const aEditedAt = dayjs(a.editedAt).unix()
        return bEditedAt - aEditedAt
      })
      return sortedSpaces
    },

    // dialog height

    updateHeight () {
      this.updateDialogHeight()
      this.updateResultsSectionHeight()
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element, true)
      })
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    }
  },
  watch: {
    visible (visible) {
      this.updateHeight()
      if (visible) {
        this.init()
      }
    }
  }
}
</script>

<style lang="stylus">
dialog.templates
  overflow auto
  .icon
    display inline-block
  .results-section
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
  section.add-to-templates
    padding-bottom 0
</style>
