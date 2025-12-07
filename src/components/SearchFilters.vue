<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import MoreSearchFilters from '@/components/dialogs/MoreSearchFilters.vue'
import utils from '@/utils.js'

import uniq from 'lodash-es/uniq'
import UserLabelInline from '@/components/UserLabelInline.vue'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerMoreFiltersIsNotVisible') {
        state.moreSearchFiltersVisible = false
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})
const state = reactive({
  moreSearchFiltersVisible: false
})

const currentUser = computed(() => userStore.getUserAllState)
const toggleMoreSearchFiltersVisible = () => {
  state.moreSearchFiltersVisible = !state.moreSearchFiltersVisible
}

// dialog pinned

const dialogIsPinned = computed(() => globalStore.searchIsPinned)
const toggleDialogIsPinned = () => {
  const isPinned = !dialogIsPinned.value
  globalStore.searchIsPinned = isPinned
}

// filters

const totalFiltersActive = computed(() => userStore.getUserTotalFiltersActive())
const filterShowUsers = computed(() => userStore.filterShowUsers)
const filterShowDateUpdated = computed(() => userStore.filterShowDateUpdated)
const filterUnchecked = computed(() => userStore.filterUnchecked)
const filterComments = computed(() => userStore.filterComments)
const toggleFilterShowUsers = () => {
  const value = !filterShowUsers.value
  userStore.updateUser({ filterShowUsers: value })
}
const toggleFilterShowDateUpdated = () => {
  const value = !filterShowDateUpdated.value
  userStore.updateUser({ filterShowDateUpdated: value })
}
const toggleFilterUnchecked = () => {
  const value = !filterUnchecked.value
  userStore.updateUser({ filterUnchecked: value })
}
const toggleFilterComments = () => {
  const value = !filterComments.value
  userStore.updateUser({ filterComments: value })
}
const clearSearchAndFilters = () => {
  globalStore.clearSearch()
  globalStore.clearAllFilters()
}
</script>

<template lang="pug">
section.filters.title-section
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

<style lang="stylus">
section.filters
  .badge
    display inline-block
    vertical-align middle
  .user-label-inline
    height 16px
    pointer-events none
    margin-right 0
    vertical-align -1px
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
</style>
