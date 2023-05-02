<template lang="pug">
section.filters
  .row.title-row-flex
    .button-wrap.segmented-buttons-wrap
      //- first row
      .segmented-buttons
        //- Users
        label.show-users(:class="{active: filterShowUsers}" @click.left.prevent="toggleFilterShowUsers" @keydown.stop.enter="toggleFilterShowUsers")
          input(type="checkbox" v-model="filterShowUsers")
          UserLabelInline(:user="currentUser" :shouldHideName="true")
        //- Time
        label(:class="{active: filterShowDateUpdated}" @click.left.prevent="toggleFilterShowDateUpdated" @keydown.stop.enter="toggleFilterShowDateUpdated")
          input(type="checkbox" v-model="filterShowDateUpdated")
          img.icon.time(src="@/assets/time.svg")
        //- Todo
        label(:class="{active: filterUnchecked}" @click.left.prevent="toggleFilterUnchecked" @keydown.stop.enter="toggleFilterUnchecked")
          input(type="checkbox" v-model="filterUnchecked")
          span Todo
      .segmented-buttons
        //- Comments Hide
        label(:class="{active: filterComments}" @click.left.prevent="toggleFilterComments" @keydown.stop.enter="toggleFilterComments")
          input(type="checkbox" v-model="filterComments")
          img.icon.comment-icon(src="@/assets/comment.svg")
          span Hide

    //- Pin
    .title-row.title-row-vertical
      //- Pin
      .button-wrap(@click.left="toggleDialogIsPinned" title="Pin dialog")
        button.small-button(:class="{active: dialogIsPinned}")
          img.icon.pin.right-pin(src="@/assets/pin.svg")
      //- More Filters
      .button-wrap.more-filters-button-wrap
        template(v-if="totalFiltersActive")
          .segmented-buttons
            button.small-button(:class="{active: moreSearchFiltersVisible || totalFiltersActive}" @click.left.prevent.stop="toggleMoreSearchFiltersVisible")
              img.icon(src="@/assets/filter.svg")
              span.badge.info.filter-is-active
            button.small-button(@click.left.stop="clearSearchAndFilters")
              img.icon.cancel(src="@/assets/add.svg")
        template(v-if="!totalFiltersActive")
          button.small-button(:class="{active: moreSearchFiltersVisible || totalFiltersActive}" @click.left.prevent.stop="toggleMoreSearchFiltersVisible")
            img.icon(src="@/assets/filter.svg")
        MoreSearchFilters(:visible="moreSearchFiltersVisible")

</template>

<script>
import MoreSearchFilters from '@/components/dialogs/MoreSearchFilters.vue'
import frames from '@/data/frames.js'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'
import UserLabelInline from '@/components/UserLabelInline.vue'

export default {
  name: 'Filters',
  components: {
    UserLabelInline,
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
    filterComments () { return this.currentUser.filterComments },
    dialogIsPinned () { return this.$store.state.searchIsPinned }
  },
  methods: {
    toggleDialogIsPinned () {
      const isPinned = !this.dialogIsPinned
      this.$store.dispatch('searchIsPinned', isPinned)
    },
    toggleMoreSearchFiltersVisible () {
      this.moreSearchFiltersVisible = !this.moreSearchFiltersVisible
    },
    clearSearchAndFilters () {
      this.$store.commit('clearSearch')
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
  .user-label-inline
    margin-top -4px
    height 10px
  @media(max-width 500px)
    dialog.more-filters
      left initial
      right 8px
  .comment-icon
    vertical-align -2px
  .filter-is-active
    width 10px
    height 10px
    min-width initial
    min-height initial
    padding 0
    border-radius 100px
    vertical-align 0
  .title-row-flex
    align-items flex-start
  .title-row-vertical
    flex-direction column
    align-items end
    .button-wrap:first-child
      margin-bottom 9px
    .button-wrap:last-child
      margin 0
  .more-filters-button-wrap
    margin-top 5px !important
</style>
