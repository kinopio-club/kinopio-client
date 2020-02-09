<template lang="pug">
dialog.narrow.space-picker(v-if="visible" :open="visible" @click.stop ref="dialog")
  section.results-section
    ul.results-list
      template(v-for="(space in spaces")
        li(@click="select(space)" :class="{ active: spaceIsActive(space.id) }" :key="space.id" tabindex="0" v-on:keyup.enter="select(space)")
          .name
            img.icon(v-if="spaceIsPrivate(space)" src="@/assets/lock.svg")
            span {{space.name}}
</template>

<script>
import scrollIntoView from 'smooth-scroll-into-view-if-needed' // polyfil

import cache from '@/cache.js'

export default {
  name: 'SpacePicker',
  props: {
    visible: Boolean,
    selectedSpace: Object,
    excludeCurrentSpace: Boolean,
    userSpaces: Array
  },
  data () {
    return {
      spaces: []
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
      this.$emit('closeDialog')
    },
    spaceIsPrivate (space) {
      return space.privacy === 'private'
    },
    updateSpaces () {
      if (this.userSpaces) {
        this.spaces = this.userSpaces
      } else {
        this.spaces = cache.getAllSpaces()
      }
      if (this.excludeCurrentSpace) {
        const currentSpace = this.$store.state.currentSpace
        this.spaces = this.spaces.filter(space => space.id !== currentSpace.id)
      }
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
          this.scrollIntoView()
          this.updateSpaces()
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
</style>
