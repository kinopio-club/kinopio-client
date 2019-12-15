<template lang="pug">
dialog.filters.narrow(v-if="visible" :open="visible")
  section.header

    p
      span.badge.info(v-if="totalFilters") {{totalFilters}}
      span Filters
    button(@click="clearAllFilters")
      img.icon.cancel(src="@/assets/add.svg")
      span Clear all

  section.results-section.connection-types
    ul.results-list
      template(v-for="(type in connectionTypes")
        li(:class="{ active: connectionTypeIsActive(type) }" @click="toggleFilteredConnectionType(type)" :key="type.id")
          input(type="checkbox" :checked="isSelected(type)")
          .badge(:style="{backgroundColor: type.color}")
          .name {{type.name}}

  section.results-section
    ul.results-list.frames-list
      template(v-for="(frame in frames")
        li(:class="{active: frameIsActive(frame)}" @click="toggleFilteredCardFrame(frame)" :key="frame.id")
          input(type="checkbox" :checked="isSelected(frame)")
          .badge
            template
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
      const types = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      return types.length + frames.length
    }
  },
  methods: {
    isSelected ({ id }) {
      const types = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      return types.includes(id) || frames.includes(id)
    },

    clearAllFilters () {
      this.$store.commit('clearAllFilters')
    },

    toggleFilteredConnectionType (type) {
      const filtered = this.$store.state.filteredConnectionTypeIds
      if (filtered.includes(type.id)) {
        this.$store.commit('removeFromFilteredConnectionTypeId', type.id)
      } else {
        this.$store.commit('addToFilteredConnectionTypeId', type.id)
      }
    },
    toggleFilteredCardFrame (frame) {
      const filtered = this.$store.state.filteredFrameIds
      if (filtered.includes(frame.id)) {
        this.$store.commit('removeFromFilteredFrameIds', frame.id)
      } else {
        this.$store.commit('addToFilteredFrameIds', frame.id)
      }
    },

    connectionTypeIsActive (type) {
      const types = this.$store.state.filteredConnectionTypeIds
      return types.includes(type.id)
    },
    frameIsActive (frame) {
      const frames = this.$store.state.filteredFrameIds
      return frames.includes(frame.id)
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
  .connection-types
    padding-bottom 0
  .results-section
    overflow visible
  input[type="checkbox"]
    margin-top 1px
  .cancel
    transform rotate(45deg)
</style>
