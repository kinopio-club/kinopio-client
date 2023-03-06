<template lang="pug">
dialog.more-filters.narrow(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}" @click.stop)
  section
    //- Clear
    button(@click.left="clearAllFilters")
      img.icon.cancel(src="@/assets/add.svg")
      span Clear All
      span.badge.info.total-filters-active(v-if="totalFiltersActive") {{totalFiltersActive}}

  section.results-section.connection-types(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    ResultsFilter(:hideFilter="shouldHideResultsFilter" :items="allItems" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredItems")
    ul.results-list
      //- Tags
      template(v-for="tag in itemsFiltered.tags" :key="tag.id")
        li(:class="{ active: tagIsActive(tag) }" @click.left="toggleFilteredTag(tag)" tabindex="0" v-on:keyup.enter="toggleFilteredTag(tag)")
          input(type="checkbox" :checked="isSelected(tag)")
          .badge(:style="{backgroundColor: tag.color}") {{tag.name}}
      //- Connection Types
      template(v-for="type in itemsFiltered.connectionTypes" :key="type.id")
        li(:class="{ active: connectionTypeIsActive(type) }" @click.left="toggleFilteredConnectionType(type)" tabindex="0" v-on:keyup.enter="toggleFilteredConnectionType(type)")
          input(type="checkbox" :checked="isSelected(type)")
          .badge(:style="{backgroundColor: type.color}")
          .name {{type.name}}
      //- Frames
      template(v-for="(frame in itemsFiltered.frames" :key="frame.id")
        li.frames-list(:class="{active: frameIsActive(frame)}" @click.left="toggleFilteredCardFrame(frame)" tabindex="0" v-on:keyup.enter="toggleFilteredCardFrame(frame)")
          input(type="checkbox" :checked="isSelected(frame)")
          .badge
            FrameBadge(:frame="frame")
          .name {{frame.name}}

</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import frames from '@/data/frames.js'
import utils from '@/utils.js'
import FrameBadge from '@/components/FrameBadge.vue'

import uniq from 'lodash-es/uniq'

export default {
  name: 'MoreFilters',
  components: {
    ResultsFilter,
    FrameBadge
  },
  props: {
    visible: Boolean
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
      }
    })
  },
  data () {
    return {
      filter: '',
      filteredItems: [],
      resultsSectionHeight: null,
      dialogHeight: null
    }
  },
  computed: {
    totalFiltersActive () { return this.$store.getters['currentUser/totalFiltersActive'] },
    connectionTypes () {
      return utils.clone(this.$store.getters['currentConnections/allTypes'])
    },
    frames () {
      const cards = utils.clone(this.$store.getters['currentCards/all'])
      let framesInUse = cards.map(card => card.frameId)
      framesInUse = uniq(framesInUse.filter(frame => frame))
      return framesInUse.map(frame => frames[frame])
    },
    tags () { return utils.clone(this.$store.getters['currentSpace/spaceTags']) },
    allItems () {
      const tags = this.tags.map(tag => {
        tag.isTag = true
        return tag
      })
      const connectionTypes = this.connectionTypes.map(type => {
        type.isConnectionType = true
        return type
      })
      const frames = this.frames.map(frame => {
        frame.isFrame = true
        return frame
      })
      return tags.concat(connectionTypes, frames)
    },
    shouldHideResultsFilter () {
      if (this.allItems.length < 5) {
        return true
      } else {
        return false
      }
    },
    itemsFiltered () {
      if (this.filter) {
        let items = {
          tags: [],
          connectionTypes: [],
          frames: []
        }
        this.filteredItems.forEach(item => {
          if (item.isTag) {
            items.tags.push(item)
          } else if (item.isConnectionType) {
            items.connectionTypes.push(item)
          } else if (item.isFrame) {
            items.frames.push(item)
          }
        })
        return items
      } else {
        return {
          tags: this.tags,
          connectionTypes: this.connectionTypes,
          frames: this.frames
        }
      }
    }
  },
  methods: {
    updateFilteredItems (items) {
      this.filteredItems = items
    },
    updateFilter (filter) {
      this.filter = filter
    },
    isSelected (item) {
      const types = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      const tags = this.$store.state.filteredTagNames
      return types.includes(item.id) || frames.includes(item.id) || tags.includes(item.name)
    },
    clearResultsFilter () {
      this.filter = ''
      this.filteredItems = []
      const searchElement = document.querySelector('dialog.filters .search-wrap input')
      if (searchElement) {
        searchElement.value = ''
      }
    },
    clearAllFilters () {
      this.$store.dispatch('clearAllFilters')
      this.clearResultsFilter()
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeight(element, true)
      })
    },

    // Toggle filters

    toggleFilteredTag (tag) {
      const tags = this.$store.state.filteredTagNames
      if (tags.includes(tag.name)) {
        this.$store.commit('removeFromFilteredTagNames', tag.name)
      } else {
        this.$store.commit('addToFilteredTagNames', tag.name)
      }
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

    // Item state

    tagIsActive (tag) {
      const tags = this.$store.state.filteredTagNames
      return tags.includes(tag.name)
    },
    connectionTypeIsActive (type) {
      const types = this.$store.state.filteredConnectionTypeIds
      return types.includes(type.id)
    },
    frameIsActive (frame) {
      const frames = this.$store.state.filteredFrameIds
      return frames.includes(frame.id)
    }
  },
  watch: {
    visible (value) {
      if (value) {
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
      }
    }
  }
}
</script>

<style lang="stylus">
dialog.more-filters
  @media(max-width 630px)
    left -100px
  @media(max-width 510px)
    left -150px
  .badge
    display inline-block
    vertical-align middle
  .name
    display inline-block
  .frames-list
    .badge
      width 17px
      height 19px
      padding 0
      display inline-block
      img
        width 100%
  .connection-types
    padding-bottom 0
  .results-section
    overflow scroll
  input[type="checkbox"]
    margin-top 1px
  .total-filters-active
    margin 0
    margin-left 5px
    margin-top -8px
    transform translateY(2px)
</style>
