<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import MoreSearchFilters from '@/components/dialogs/MoreSearchFilters.vue'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'
import UserLabelInline from '@/components/UserLabelInline.vue'

const store = useStore()

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'triggerMoreFiltersIsNotVisible') {
      state.moreSearchFiltersVisible = false
    }
  })
})

const state = reactive({
  moreSearchFiltersVisible: false
})

const currentUser = computed(() => store.state.currentUser)
const toggleMoreSearchFiltersVisible = () => {
  state.moreSearchFiltersVisible = !state.moreSearchFiltersVisible
}

// dialog pinned

const dialogIsPinned = computed(() => store.state.searchIsPinned)
const toggleDialogIsPinned = () => {
  const isPinned = !dialogIsPinned.value
  store.dispatch('searchIsPinned', isPinned)
}

// filters

const totalFiltersActive = computed(() => store.getters['currentUser/totalFiltersActive'])
const filterShowUsers = computed(() => currentUser.value.filterShowUsers)
const filterShowDateUpdated = computed(() => currentUser.value.filterShowDateUpdated)
const filterUnchecked = computed(() => currentUser.value.filterUnchecked)
const filterComments = computed(() => currentUser.value.filterComments)
const toggleFilterShowUsers = () => {
  const value = !filterShowUsers.value
  store.dispatch('currentUser/toggleFilterShowUsers', value)
}
const toggleFilterShowDateUpdated = () => {
  const value = !filterShowDateUpdated.value
  store.dispatch('currentUser/toggleFilterShowDateUpdated', value)
}
const toggleFilterUnchecked = () => {
  const value = !filterUnchecked.value
  store.dispatch('currentUser/toggleFilterUnchecked', value)
}
const toggleFilterComments = () => {
  const value = !filterComments.value
  store.dispatch('currentUser/toggleFilterComments', value)
}
const clearSearchAndFilters = () => {
  store.commit('clearSearch')
  store.dispatch('clearAllFilters')
}
</script>

<template lang="pug">
section.filters
  .row.title-row-flex
    .button-wrap.segmented-buttons-wrap
      //- first row
      .segmented-buttons
        //- Users
        label.show-users(title="Toggle Card User Filter (1)" :class="{active: filterShowUsers}" @click.left.prevent.stop="toggleFilterShowUsers" @keydown.stop.enter="toggleFilterShowUsers")
          input(type="checkbox" v-model="filterShowUsers")
          UserLabelInline(:user="currentUser" :shouldHideName="true")
        //- Time
        label(title="Toggle Card Date Filter (2)" :class="{active: filterShowDateUpdated}" @click.left.prevent.stop="toggleFilterShowDateUpdated" @keydown.stop.enter="toggleFilterShowDateUpdated")
          input(type="checkbox" v-model="filterShowDateUpdated")
          img.icon.time(src="@/assets/time.svg")
        //- Todo
        label(title="Toggle Checkbox Card Filter (3)" :class="{active: filterUnchecked}" @click.left.prevent.stop="toggleFilterUnchecked" @keydown.stop.enter="toggleFilterUnchecked")
          input(type="checkbox" v-model="filterUnchecked")
          span Todo
      .segmented-buttons
        //- Comments Hide
        label(title="Toggle Hide Comment Cards (4)" :class="{active: filterComments}" @click.left.prevent.stop="toggleFilterComments" @keydown.stop.enter="toggleFilterComments")
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
            button.small-button(:class="{active: state.moreSearchFiltersVisible || totalFiltersActive}" @click.left.prevent.stop="toggleMoreSearchFiltersVisible")
              img.icon(src="@/assets/filter.svg")
              span.badge.info.filter-is-active
            button.small-button(@click.left.stop="clearSearchAndFilters")
              img.icon.cancel(src="@/assets/add.svg")
        template(v-if="!totalFiltersActive")
          button.small-button(:class="{active: state.moreSearchFiltersVisible || totalFiltersActive}" @click.left.prevent.stop="toggleMoreSearchFiltersVisible")
            img.icon(src="@/assets/filter.svg")
        MoreSearchFilters(:visible="state.moreSearchFiltersVisible")
</template>

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
  .segmented-buttons + .segmented-buttons
    margin-left 0
  .user-label-inline
    pointer-events none
</style>
