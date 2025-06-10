<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import Loader from '@/components/Loader.vue'
import UserList from '@/components/UserList.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

let unsubscribes

onMounted(() => {
  loadFavoriteUsers()
  const globalStoreUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs') {
        closeDialogs()
      }
    }
  )
  unsubscribes = () => {
    globalStoreUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    loadFavoriteUsers()
  }
})

const state = reactive({
  isLoadingFavorites: false,
  favoriteUsers: []
})

const currentSpace = computed(() => spaceStore.getSpaceAllState)
const isLoadingSpace = computed(() => globalStore.isLoadingSpace)

// visits

const visits = computed(() => spaceStore.visits + 1)

// dates

const showAbsoluteDate = computed(() => userStore.filterShowAbsoluteDates)
const date = (date) => {
  if (showAbsoluteDate.value) {
    return dayjs(date).format('YYYY-MM-DD')
  } else {
    date = utils.shortRelativeTime(date)
    if (date === 'now') {
      return date
    } else {
      return date + ' ago'
    }
  }
}
const toggleFilterShowAbsoluteDates = () => {
  const value = !userStore.filterShowAbsoluteDates
  userStore.updateUser({ filterShowAbsoluteDates: value })
}

// items

const tags = computed(() => spaceStore.getSpaceTags)
const cards = computed(() => cardStore.getAllCards)
const connections = computed(() => connectionStore.getAllConnections)
const boxes = computed(() => boxStore.getAllBoxes)

// word count

const wordCount = computed(() => {
  let words = ''
  cards.value.forEach(card => {
    words = words + ' ' + card.name
  })
  const wordCount = words.split(' ').length
  return wordCount
})

// favorite users

const loadFavoriteUsers = async () => {
  if (state.isLoadingFavorites) { return }
  try {
    state.isLoadingFavorites = true
    state.favoriteUsers = await apiStore.getSpaceFavorites()
  } catch (error) {
    console.error('🚒 loadFavoriteUsers', error)
  }
  state.isLoadingFavorites = false
}
const userDetailsIsVisible = computed(() => globalStore.userDetailsIsVisible)
const userDetailsSelectedUser = computed(() => {
  if (!userDetailsIsVisible.value) { return }
  return globalStore.userDetailsUser
})
const toggleUserDetails = (event, user) => {
  const shouldShow = !globalStore.userDetailsIsVisible
  closeDialogs()
  if (shouldShow) {
    showUserDetails(event, user)
  }
}
const closeDialogs = () => {
  globalStore.userDetailsIsVisible = false
}
const showUserDetails = async (event, user) => {
  const element = event.target
  const options = { element, shouldIgnoreZoom: true, offsetY: -300 }
  const position = utils.childDialogPositionFromParent(options)
  globalStore.userDetailsUser = user
  globalStore.userDetailsPosition = position
  globalStore.userDetailsIsVisible = true
}
</script>

<template lang="pug">
section.stats(v-if="visible")
  p Space Stats
  p(v-if="isLoadingSpace")
    Loader(:visible="true")
  template(v-if="!isLoadingSpace")
    table
      tbody
        tr.table-header
          td Visits
        tr
          td {{visits}}
    table
      tbody
        tr.table-header
          td Cards
          td Lines
          td Boxes
          td Tags
        tr
          td {{cards.length}}
          td {{connections.length}}
          td {{boxes.length}}
          td {{tags.length}}
    table
      tbody
        tr.table-header
          td Created
          td(v-if="currentSpace.editedAt")
            span Last Edited
        tr
          td
            .badge.button-badge.secondary(@click.stop="toggleFilterShowAbsoluteDates")
              span {{date(currentSpace.createdAt)}}
          td(v-if="currentSpace.editedAt")
            .badge.button-badge.secondary(@click.stop="toggleFilterShowAbsoluteDates")
              span {{date(currentSpace.editedAt)}}
    table
      tbody
        tr.table-header
          td Word Count
        tr
          td {{wordCount}}

section(v-if="visible")
  p
    img.icon(src="@/assets/heart.svg")
    span Favorited by
    Loader(:visible="state.isLoadingFavorites" :isSmall="true")

section.results-section(v-if="!state.isLoadingFavorites && visible")
  template(v-if="state.favoriteUsers.length")
    UserList(:users="state.favoriteUsers" :selectedUser="userDetailsSelectedUser" @selectUser="toggleUserDetails")
  template(v-else)
    .badge.secondary
      span Try sharing the public url, or adding this space to explore.
</template>

<style lang="stylus">
// .stats
//   overflow auto
//   table
//     margin-top 10px
//     border-collapse collapse
//     td
//       border 1px solid var(--secondary-active-background)
//       padding 5px
//       user-select text
</style>
