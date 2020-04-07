<template lang="pug">
dialog.narrow.space-picker(v-if="visible" :open="visible" @click.stop ref="dialog")
  section.results-section
    Loader(:visible="loading")
    SpaceList(:spaces="spaces" :showUserIfCurrentUserIsCollaborator="showUserIfCurrentUserIsCollaborator" :selectedSpace="selectedSpace" @selectSpace="selectSpace")
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'SpacePicker',
  components: {
    Loader,
    SpaceList: () => import('@/components/SpaceList.vue')
  },
  props: {
    visible: Boolean,
    selectedSpace: Object,
    shouldExcludeCurrentSpace: Boolean,
    userSpaces: Array,
    loading: Boolean,
    showUserIfCurrentUserIsCollaborator: Boolean
  },
  data () {
    return {
      spaces: []
    }
  },
  computed: {
    maxHeight () {
      const favoritesDialog = document.querySelector('dialog.favorites')
      let height = 120
      if (favoritesDialog) {
        const dialogHeight = favoritesDialog.offsetHeight
        if (dialogHeight > 250) { height = dialogHeight }
      } else {
        return undefined
      }
      return height
    }
  },
  methods: {
    excludeCurrentSpace () {
      if (!this.shouldExcludeCurrentSpace) { return }
      const currentSpace = this.$store.state.currentSpace
      this.spaces = this.spaces.filter(space => space.id !== currentSpace.id)
    },
    updateSpaces () {
      if (this.userSpaces) {
        this.spaces = this.userSpaces
      } else {
        this.spaces = cache.getAllSpaces()
        this.updateWithRemoteSpaces()
      }
      this.excludeCurrentSpace()
    },
    async updateWithRemoteSpaces () {
      const spaces = await this.$store.dispatch('api/getUserSpaces')
      if (!spaces) { return }
      this.spaces = spaces
      this.excludeCurrentSpace()
    },
    selectSpace (space) {
      this.$emit('selectSpace', space)
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    }
  },
  watch: {
    visible (visible) {
      this.$nextTick(() => {
        if (visible) {
          this.updateSpaces()
          this.scrollIntoView()
        }
      })
    },
    userSpaces (userSpaces) {
      this.updateSpaces()
    }
  }
}
</script>

<style lang="stylus">
.space-picker
  .results-section
    padding-top 4px
    @media(max-height 700px)
      max-height 40vh

</style>
