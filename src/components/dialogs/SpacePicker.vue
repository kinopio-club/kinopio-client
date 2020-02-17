<template lang="pug">
dialog.narrow.space-picker(v-if="visible" :open="visible" @click.stop ref="dialog")
  section.results-section
    Loader(:visible="loading")
    ul.results-list(:style="{'max-height': maxHeight + 'px'}")
      template(v-for="(space in spaces")
        li(@click="select(space)" :class="{ active: spaceIsActive(space.id) }" :key="space.id" tabindex="0" v-on:keyup.enter="select(space)")
          .name
            span {{space.name}}
          .badge.status(v-if="shouldShowInExploreBadge(space)")
            img.icon(src="@/assets/checkmark.svg")
          img.icon.lock(v-if="spaceIsPrivate(space)" src="@/assets/lock.svg")
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import cache from '@/cache.js'
import Loader from '@/components/Loader.vue'

export default {
  name: 'SpacePicker',
  components: {
    Loader
  },
  props: {
    visible: Boolean,
    selectedSpace: Object,
    shouldExcludeCurrentSpace: Boolean,
    userSpaces: Array,
    loading: Boolean,
    shouldCloseWhenSelecting: Boolean
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
      if (!this.excludeCurrentSpace) { return }
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
    spaceIsActive (spaceId) {
      let selectedSpaceId = this.$store.state.currentSpace.id
      if (this.selectedSpace) {
        selectedSpaceId = this.selectedSpace.id
      }
      return Boolean(selectedSpaceId === spaceId)
    },
    select (space) {
      this.$emit('selectSpace', space)
      if (this.shouldCloseWhenSelecting) {
        this.$emit('closeDialog')
      }
    },
    spaceIsPrivate (space) {
      return space.privacy === 'private'
    },
    scrollIntoView () {
      const element = this.$refs.dialog
      scrollIntoView(element, {
        behavior: 'smooth',
        scrollMode: 'if-needed'
      })
    },
    shouldShowInExploreBadge (space) {
      if (space.privacy === 'private') { return }
      return space.showInExplore
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
  .lock,
  .badge
    margin-left 6px
    img
      vertical-align middle
  .name
    max-width calc(100% - 30px)
</style>
