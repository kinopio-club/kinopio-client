<template lang="pug">
dialog.filters.narrow(v-if="visible" :open="visible")
  section.header

    p
      span.badge.info(v-if="totalFilters") {{totalFilters}}
      span Filters
    button(@click="clearAllFilters") Clear all
    //- button has 'cancel' icon

  section.results-section
    ul.results-list
      template(v-for="(type in connectionTypes")
        li(:class="{ active: connectionTypeIsActive(type) }" @click="toggleFilteredConnectionType(type)" :key="type.id")
          .badge(:style="{backgroundColor: type.color}")
          .name {{type.name}}

  section.results-section
    ul.results-list.frames-list
      template(v-for="(frame in frames")
        li(:class="{active: frameIsActive(frame)}" @click="toggleFilteredCardFrame(frame)" :key="frame.id")
          .badge
            template(v-if="frameHasBadge(frame)")
              img(:src="frameBadge(frame).path")
          .name {{frame.name}}

</template>

<script>
import uniq from 'lodash-es/uniq'

import frames from '@/frames.js'
import utils from '@/utils.js'

export default {
  name: 'Filters',
  props: {
    visible: Boolean
  },
  computed: {
    connectionTypes () {
      return this.$store.state.currentSpace.connectionTypes
    },
    frames () {
      const cards = utils.clone(this.$store.state.currentSpace.cards)
      let framesInUse = cards.map(card => card.frameId)
      framesInUse = uniq(framesInUse.filter(frame => frame))
      return framesInUse.map(frame => frames[frame])
    },
    totalFilters () {
      const types = this.$store.state.filteredConnectionTypes
      const frames = this.$store.state.filteredFrames
      return types.length + frames.length
    }
  },
  methods: {
    clearAllFilters () {
      // run store mutation clearAllFilters, both arrays = []
    },
    connectionTypeIsActive (type) {
      // const types = this.$store.state.filteredConnectionTypes
      return false// Boolean(type.id === this.currentConnection.connectionTypeId)
    },
    frameIsActive (frame) {
      // const filtered = this.$store.state.filteredFrames
      return false
    },
    toggleFilteredConnectionType (type) {
      const filtered = this.$store.state.filteredConnectionTypes
      console.log(filtered, type.id)
    },
    toggleFilteredCardFrame (frame) {
      const filtered = this.$store.state.filteredFrames
      console.log(filtered, frame.id)
    },
    frameHasBadge (frame) {
      return Boolean(frame.badge)
    },
    frameBadge (frame) {
      return {
        path: require(`@/assets/frames/${frame.badge}`)
      }
    }

  }
}
</script>

<style lang="stylus">
.filters
  .frames-list
    .badge
      width 17px
      height 19px
      display block
      padding 0
      img
        width 100%
  .header
    border-bottom 1px solid var(--primary)
    margin-bottom 4px
</style>
