<template lang="pug">
dialog.filters.narrow(v-if="visible" :open="visible")
  section
    p
      span.badge.info(v-if="totalFilters") {{totalFilters}}
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

  section.results-section.connection-types
    //- TODO resultsfilter
    ul.results-list
      template(v-for="tag in tags")
        li(:class="{ active: tagIsActive(tag) }" @click.left="toggleFilteredTag(tag)" tabindex="0" v-on:keyup.enter="toggleFilteredTag(tag)")
          input(type="checkbox" :checked="isSelected(tag)")
          .badge(:style="{backgroundColor: tag.color}") {{tag.name}}
      template(v-for="type in connectionTypes")
        li(:class="{ active: connectionTypeIsActive(type) }" @click.left="toggleFilteredConnectionType(type)" :key="type.id" tabindex="0" v-on:keyup.enter="toggleFilteredConnectionType(type)")
          input(type="checkbox" :checked="isSelected(type)")
          .badge(:style="{backgroundColor: type.color}")
          .name {{type.name}}
      template(v-for="(frame in frames")
        li.frames-list(:class="{active: frameIsActive(frame)}" @click.left="toggleFilteredCardFrame(frame)" :key="frame.id" tabindex="0" v-on:keyup.enter="toggleFilteredCardFrame(frame)")
          input(type="checkbox" :checked="isSelected(frame)")
          .badge
            template
              img(:src="frameBadge(frame).path")
          .name {{frame.name}}

</template>

<script>
import frames from '@/frames.js'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'

export default {
  name: 'Filters',
  components: {
    User: () => import('@/components/User.vue')
  },
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
      const state = this.$store.state
      const currentUser = state.currentUser
      let userFilters = 0
      if (currentUser.filterShowUsers) {
        userFilters += 1
      }
      if (currentUser.filterShowDateUpdated) {
        userFilters += 1
      }
      const filteredTagNames = state.filteredTagNames.length
      const connections = state.filteredConnectionTypeIds.length
      const frames = state.filteredFrameIds.length

      return userFilters + filteredTagNames + connections + frames
    },
    currentUser () {
      return this.$store.state.currentUser
    },
    filterShowUsers () {
      return this.$store.state.currentUser.filterShowUsers
    },
    filterShowDateUpdated () {
      return this.$store.state.currentUser.filterShowDateUpdated
    },
    tags () { return this.$store.getters['currentSpace/spaceTags']() }
  },
  methods: {
    isSelected (item) {
      const types = this.$store.state.filteredConnectionTypeIds
      const frames = this.$store.state.filteredFrameIds
      const tags = this.$store.state.filteredTagNames
      return types.includes(item.id) || frames.includes(item.id) || tags.includes(item.name)
    },
    clearAllFilters () {
      this.$store.dispatch('clearAllFilters')
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
