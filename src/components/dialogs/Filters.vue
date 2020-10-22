<template lang="pug">
dialog.filters.narrow(v-if="visible" :open="visible" ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p
      span.badge.info(v-if="totalFiltersActive") {{totalFiltersActive}}
      span Filters
    button(@click.left="clearAllFilters")
      img.icon.cancel(src="@/assets/add.svg")
      span Clear all

  section
    .row
      .button-wrap
        label.show-users(:class="{active: filterShowUsers}" @click.left.prevent="toggleFilterShowUsers" @keydown.stop.enter="toggleFilterShowUsers")
          input(type="checkbox" v-model="filterShowUsers")
          User(:user="currentUser" :key="currentUser.id" :hideYouLabel="true")
      .button-wrap
        label(:class="{active: filterShowDateUpdated}" @click.left.prevent="toggleFilterShowDateUpdated" @keydown.stop.enter="toggleFilterShowDateUpdated")
          input(type="checkbox" v-model="filterShowDateUpdated")
          img.icon.time(src="@/assets/time.svg")
          span Updated
    .row
      .button-wrap
        label(:class="{active: filterUnchecked}" @click.left.prevent="toggleFilterUnchecked" @keydown.stop.enter="toggleFilterUnchecked")
          input(type="checkbox" v-model="filterUnchecked")
          span Unchecked

  section.results-section.connection-types(ref="results" :style="{'max-height': resultsSectionHeight + 'px'}")
    ResultsFilter(:hideFilter="shouldHideResultsFilter" :items="allItems" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredItems")
    ul.results-list
      //- Tags
      template(v-for="tag in itemsFiltered.tags")
        li(:class="{ active: tagIsActive(tag) }" @click.left="toggleFilteredTag(tag)" tabindex="0" v-on:keyup.enter="toggleFilteredTag(tag)")
          input(type="checkbox" :checked="isSelected(tag)")
          .badge(:style="{backgroundColor: tag.color}") {{tag.name}}
      //- Connection Types
      template(v-for="type in itemsFiltered.connectionTypes")
        li(:class="{ active: connectionTypeIsActive(type) }" @click.left="toggleFilteredConnectionType(type)" :key="type.id" tabindex="0" v-on:keyup.enter="toggleFilteredConnectionType(type)")
          input(type="checkbox" :checked="isSelected(type)")
          .badge(:style="{backgroundColor: type.color}")
          .name {{type.name}}
      //- Frames
      template(v-for="(frame in itemsFiltered.frames")
        li.frames-list(:class="{active: frameIsActive(frame)}" @click.left="toggleFilteredCardFrame(frame)" :key="frame.id" tabindex="0" v-on:keyup.enter="toggleFilteredCardFrame(frame)")
          input(type="checkbox" :checked="isSelected(frame)")
          .badge
            template
              img(:src="frameBadge(frame).path")
          .name {{frame.name}}

</template>

<script>
import ResultsFilter from '@/components/ResultsFilter.vue'
import frames from '@/frames.js'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'

export default {
  name: 'Filters',
  components: {
    User: () => import('@/components/User.vue'),
    ResultsFilter
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
    connectionTypes () {
      return this.$store.state.currentSpace.connectionTypes
    },
    frames () {
      const cards = utils.clone(this.$store.state.currentSpace.cards)
      let framesInUse = cards.map(card => card.frameId)
      framesInUse = uniq(framesInUse.filter(frame => frame))
      return framesInUse.map(frame => frames[frame])
    },
    totalFiltersActive () {
      const currentUser = this.$store.state.currentUser
      let userFilters = 0
      if (currentUser.filterShowUsers) {
        userFilters += 1
      }
      if (currentUser.filterShowDateUpdated) {
        userFilters += 1
      }
      if (currentUser.filterUnchecked) {
        userFilters += 1
      }
      const tagNames = this.$store.state.filteredTagNames
      const connections = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      return userFilters + tagNames.length + connections.length + frames.length
    },
    currentUser () { return this.$store.state.currentUser },
    filterShowUsers () { return this.$store.state.currentUser.filterShowUsers },
    filterShowDateUpdated () { return this.$store.state.currentUser.filterShowDateUpdated },
    filterUnchecked () { return this.$store.state.currentUser.filterUnchecked },
    tags () { return this.$store.getters['currentSpace/spaceTags']() },
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
        this.dialogHeight = utils.elementHeightFromHeader(element)
      })
    },
    updateResultsSectionHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.results
        this.resultsSectionHeight = utils.elementHeightFromHeader(element, true)
      })
    },

    // Toggle filters

    toggleFilterShowUsers () {
      const value = !this.filterShowUsers
      this.$store.dispatch('currentUser/toggleFilterShowUsers', value)
    },
    toggleFilterShowDateUpdated () {
      const value = !this.filterShowDateUpdated
      this.$store.dispatch('currentUser/toggleFilterShowDateUpdated', value)
    },
    toggleFilterUnchecked () {
      const value = !this.filterUnchecked
      this.$store.dispatch('currentUser/toggleFilterUnchecked', value)
    },
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
    },
    frameBadge (frame) {
      return {
        path: require(`@/assets/frames/${frame.badge}`)
      }
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        this.updateResultsSectionHeight()
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
  .connection-types
    padding-bottom 0
  .results-section
    overflow scroll
  input[type="checkbox"]
    margin-top 1px
  .show-users
    width 50px
  .user
    position absolute
    top 4px
    .user-avatar
      width 17px
      height 16px
</style>
