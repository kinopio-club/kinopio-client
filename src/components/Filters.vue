<template lang="pug">
  section.filters
    .row
      .button-wrap
        .badge.keyboard-shortcut-badge(title="keyboard shortcut" v-if="isNotMobile") 1
        label.show-users(:class="{active: filterShowUsers}" @click.left.prevent="toggleFilterShowUsers" @keydown.stop.enter="toggleFilterShowUsers")
          input(type="checkbox" v-model="filterShowUsers")
          User(:user="currentUser" :key="currentUser.id" :hideYouLabel="true" :isSmall="true")
      .button-wrap
        .badge.keyboard-shortcut-badge(title="keyboard shortcut" v-if="isNotMobile") 2
        label(:class="{active: filterShowDateUpdated}" @click.left.prevent="toggleFilterShowDateUpdated" @keydown.stop.enter="toggleFilterShowDateUpdated")
          input(type="checkbox" v-model="filterShowDateUpdated")
          img.icon.time(src="@/assets/time.svg")
      .button-wrap
        .badge.keyboard-shortcut-badge(title="keyboard shortcut" v-if="isNotMobile") 3
        label(:class="{active: filterUnchecked}" @click.left.prevent="toggleFilterUnchecked" @keydown.stop.enter="toggleFilterUnchecked")
          input(type="checkbox" v-model="filterUnchecked")
          span Todo
      .button-wrap
        button(:class="{active: moreFiltersVisible, 'has-badge': totalFiltersActive}" @click.left.prevent.stop="toggleMoreFiltersVisible")
          span.badge.info(v-if="totalFiltersActive") {{totalFiltersActive}}
          span …
        MoreFilters(:visible="moreFiltersVisible")
</template>

<script>
import MoreFilters from '@/components/dialogs/MoreFilters.vue'
import frames from '@/data/frames.js'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'

export default {
  name: 'Filters',
  components: {
    User: () => import('@/components/User.vue'),
    MoreFilters
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerMoreFiltersIsNotVisible') {
        this.moreFiltersVisible = false
      }
    })
  },
  data () {
    return {
      moreFiltersVisible: false
    }
  },
  computed: {
    frames () {
      const cards = utils.clone(this.$store.state.currentSpace.cards)
      let framesInUse = cards.map(card => card.frameId)
      framesInUse = uniq(framesInUse.filter(frame => frame))
      return framesInUse.map(frame => frames[frame])
    },
    totalFiltersActive () {
      const currentUser = this.currentUser
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
    filterShowUsers () { return this.currentUser.filterShowUsers },
    filterShowDateUpdated () { return this.currentUser.filterShowDateUpdated },
    filterUnchecked () { return this.currentUser.filterUnchecked },
    isNotMobile () { return !utils.isMobile() }
  },
  methods: {
    toggleMoreFiltersVisible () {
      this.moreFiltersVisible = !this.moreFiltersVisible
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
    }
  }
}
</script>

<style lang="stylus" scoped>
.filters
  .badge
    display inline-block
    vertical-align middle
  .show-users
    width 50px
  .user
    position absolute
    top 4px
  .has-badge
    padding-top 2px
    padding-bottom 1px
  .keyboard-shortcut-badge
    position absolute
    padding 0px 4px
    padding-top 1px
    bottom -10px
    right -6px
    z-index 1
</style>
