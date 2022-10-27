<template lang="pug">
section.filters
  .row
    //- Users
    .button-wrap
      label.show-users(:class="{active: filterShowUsers}" @click.left.prevent="toggleFilterShowUsers" @keydown.stop.enter="toggleFilterShowUsers")
        input(type="checkbox" v-model="filterShowUsers")
        User(:user="currentUser" :key="currentUser.id" :hideYouLabel="true" :isSmall="true")
    //- Time
    .button-wrap
      label(:class="{active: filterShowDateUpdated}" @click.left.prevent="toggleFilterShowDateUpdated" @keydown.stop.enter="toggleFilterShowDateUpdated")
        input(type="checkbox" v-model="filterShowDateUpdated")
        img.icon.time(src="@/assets/time.svg")
    //- Todo
    .button-wrap
      label(:class="{active: filterUnchecked}" @click.left.prevent="toggleFilterUnchecked" @keydown.stop.enter="toggleFilterUnchecked")
        input(type="checkbox" v-model="filterUnchecked")
        span Todo
    //- More Filters
    .button-wrap
      button(:class="{active: moreSearchFiltersVisible, 'has-badge': totalFiltersActive}" @click.left.prevent.stop="toggleMoreSearchFiltersVisible")
        img.icon(src="@/assets/filter.svg")
        span.badge.info(v-if="totalFiltersActive") {{totalFiltersActive}}
      MoreSearchFilters(:visible="moreSearchFiltersVisible")
  .row
    //- Comments Hide
    .button-wrap
      label(:class="{active: filterComments}" @click.left.prevent="toggleFilterComments" @keydown.stop.enter="toggleFilterComments")
        input(type="checkbox" v-model="filterComments")
        img.icon.comment-icon(src="@/assets/comment.svg")
        span Hide

</template>

<script>
import MoreSearchFilters from '@/components/dialogs/MoreSearchFilters.vue'
import frames from '@/data/frames.js'
import utils from '@/utils.js'
import { defineAsyncComponent } from 'vue'

import uniq from 'lodash-es/uniq'
const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})

export default {
  name: 'Filters',
  components: {
    User,
    MoreSearchFilters
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerMoreFiltersIsNotVisible') {
        this.moreSearchFiltersVisible = false
      }
    })
  },
  data () {
    return {
      moreSearchFiltersVisible: false
    }
  },
  computed: {
    frames () {
      const cards = utils.clone(this.$store.getters['currentCards/all'])
      let framesInUse = cards.map(card => card.frameId)
      framesInUse = uniq(framesInUse.filter(frame => frame))
      return framesInUse.map(frame => frames[frame])
    },
    totalFiltersActive () { return this.$store.getters['currentUser/totalFiltersActive'] },
    currentUser () { return this.$store.state.currentUser },
    filterShowUsers () { return this.currentUser.filterShowUsers },
    filterShowDateUpdated () { return this.currentUser.filterShowDateUpdated },
    filterUnchecked () { return this.currentUser.filterUnchecked },
    filterComments () { return this.currentUser.filterComments }
  },
  methods: {
    toggleMoreSearchFiltersVisible () {
      this.moreSearchFiltersVisible = !this.moreSearchFiltersVisible
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
    toggleFilterComments () {
      const value = !this.filterComments
      this.$store.dispatch('currentUser/toggleFilterComments', value)
    }
  }
}
</script>

<style lang="stylus" scoped>
.filters
  .badge
    display inline-block
    vertical-align middle
    margin-right 0
  .show-users
    width 50px
  .user
    position absolute
    top 4px
  .has-badge
    padding-top 2px
    padding-bottom 1px
  @media(max-width 500px)
    dialog.more-filters
      left initial
      right 8px
  .comment-icon
    vertical-align -2px
</style>
