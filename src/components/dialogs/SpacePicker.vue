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
    excludeCurrentSpace: Boolean,
    userSpaces: Array,
    loading: Boolean,
    shouldCloseWhenSelecting: Boolean
  },
  computed: {
    spaces () {
      let spaces
      if (this.userSpaces) {
        spaces = this.userSpaces
      } else {
        spaces = cache.getAllSpaces()
      }
      if (this.excludeCurrentSpace) {
        const currentSpace = this.$store.state.currentSpace
        spaces = spaces.filter(space => space.id !== currentSpace.id)
      }
      return spaces
    },
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
          this.scrollIntoView()
        }
      })
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
