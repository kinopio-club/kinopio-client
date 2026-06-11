<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import dayjs from 'dayjs'

import Explore from '@/components/dialogs/Explore.vue'
import Live from '@/components/dialogs/Live.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

let unsubscribes
const maxUnreadCountCharacter = '+'

onMounted(() => {
  const hasCommunitySpaces = exploreSpaces.value.length || followingSpaces.value.length || everyoneSpaces.value.length
  if (hasCommunitySpaces) {
    state.isLoadingSpaces = false
    updateUnreadSpacesCounts()
  }
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerExploreIsVisible') {
        toggleExploreIsVisible()
      } else if (name === 'closeAllDialogs') {
        closeDialogs()
      } else if (name === 'triggerUserIsLoaded') {
        updateCommunitySpaces()
      } else if (name === 'triggerUpdateCommunitySpaces') {
        updateCommunitySpaces()
      } else if (name === 'triggerUpdateLiveSpaces') {
        updateLiveSpaces()
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
  exploreIsVisible: false,
  isLoadingLiveSpaces: true,
  isLoadingSpaces: true,
  favoritesIsVisible: false,
  liveIsVisible: false,
  liveSpaces: [],
  unreadExploreSpacesCount: 0,
  unreadFollowingSpacesCount: 0,
  unreadEveryoneSpacesCount: 0,
  unreadSpacesCount: 0,
  error: {
    isLoading: false
  }
})

watch(() => state.exploreIsVisible, (value, prevValue) => {
  if (!value) {
    clearUnreadSpacesCounts()
  }
})

watch(() => globalStore.isSpacePage, async (value, prevValue) => {
  if (value) {
    globalStore.followingSpaces = await apiStore.getFollowingUsersSpaces()
  }
})

const exploreSpaces = computed(() => globalStore.exploreSpaces)
const followingSpaces = computed(() => globalStore.followingSpaces)
const everyoneSpaces = computed(() => globalStore.everyoneSpaces)

const closeDialogs = () => {
  state.exploreIsVisible = false
  state.liveIsVisible = false
  state.favoritesIsVisible = false
}
const shouldIncreaseUIContrast = computed(() => userStore.shouldIncreaseUIContrast)
const isOnline = computed(() => globalStore.isOnline)

const normalizeCount = (count) => {
  if (count > 9) {
    return maxUnreadCountCharacter
  } else {
    return count
  }
}

// Unread Counts

const spaceIsCurrentSpace = (space) => {
  const currentSpace = spaceStore.getSpaceAllState
  return space.id === currentSpace.id
}
const unreadSpaces = (spaces, type) => {
  let readDate = userStore.showInExploreUpdatedAt
  readDate = dayjs(readDate)
  const unreadSpaces = spaces?.filter(space => {
    if (spaceIsCurrentSpace(space)) { return }
    const spaceDate = utils.spaceReadDate(space, type)
    const delta = readDate.diff(spaceDate, 'second')
    return delta < -10 * 1000 // older than 10 seconds
  })
  return unreadSpaces || []
}
const updateUnreadSpacesCounts = () => {
  const readDate = userStore.showInExploreUpdatedAt
  if (!readDate) { return maxUnreadCountCharacter }
  state.unreadExploreSpacesCount = unreadSpaces(exploreSpaces.value, 'explore').length
  state.unreadFollowingSpacesCount = unreadSpaces(followingSpaces.value, 'following').length
  state.unreadEveryoneSpacesCount = unreadSpaces(everyoneSpaces.value, 'everyone').length
  const count = state.unreadExploreSpacesCount + state.unreadFollowingSpacesCount
  state.unreadSpacesCount = normalizeCount(count)
}
const clearUnreadSpacesCounts = () => {
  state.unreadExploreSpacesCount = 0
  state.unreadFollowingSpacesCount = 0
  state.unreadEveryoneSpacesCount = 0
  state.unreadSpacesCount = 0
}

// Explore, Community spaces

const toggleExploreIsVisible = () => {
  const isVisible = state.exploreIsVisible
  globalStore.closeAllDialogs()
  state.exploreIsVisible = !isVisible
}
const updateCommunitySpaces = async () => {
  try {
    state.isLoadingSpaces = true
    const [explore, following, everyone] = await Promise.all([
      apiStore.getExploreSpaces(),
      apiStore.getFollowingUsersSpaces(),
      apiStore.getEveryoneSpaces()
    ])
    globalStore.exploreSpaces = explore
    globalStore.followingSpaces = following
    globalStore.everyoneSpaces = everyone
    updateUnreadSpacesCounts()
  } catch (error) {
    console.error('🚑 updateCommunitySpaces', error)
    state.error.isLoading = true
  }
  state.isLoadingSpaces = false
}

// Live

const toggleLiveIsVisible = () => {
  const isVisible = state.liveIsVisible
  globalStore.closeAllDialogs()
  state.liveIsVisible = !isVisible
  if (state.liveIsVisible) {
    updateLiveSpaces()
  }
}
const updateLiveSpaces = async () => {
  state.isLoadingLiveSpaces = true
  let spaces = await apiStore.getLiveSpaces()
  if (!spaces || !spaces.length) {
    state.isLoadingLiveSpaces = false
    return
  }
  spaces = spaces.filter(space => space.user.id !== userStore.id)
  spaces = normalizeLiveSpaces(spaces)
  state.liveSpaces = spaces
  state.isLoadingLiveSpaces = false
}
const normalizeLiveSpaces = (spaces) => {
  let normalizedSpaces = []
  spaces = spaces.map(space => {
    space.otherUsers = []
    return space
  })
  spaces.forEach(space => {
    const spaceExists = normalizedSpaces.find(normalizedSpace => normalizedSpace.id === space.id)
    if (spaceExists) {
      // update otherUsers
      normalizedSpaces = normalizedSpaces.map(normalizedSpace => {
        if (normalizedSpace.id === space.id) {
          normalizedSpace.otherUsers.push(space.user)
        }
        return normalizedSpace
      })
    } else {
      normalizedSpaces.push(space)
    }
  })
  return normalizedSpaces
}
const liveSpacesCount = computed(() => {
  const count = state.liveSpaces.length
  return normalizeCount(count)
})

</script>

<template lang="pug">
.button-wrap.discovery-buttons(v-if="isOnline")
  .segmented-buttons.space-functions-row
    //- Explore
    .button-wrap
      button.small-button(:class="{active: state.exploreIsVisible, 'translucent-button': !shouldIncreaseUIContrast}" @click="toggleExploreIsVisible" title="Explore Spaces")
        img.icon.sunglasses(src="@/assets/sunglasses.svg" alt="explore icon")
        span(v-if="state.unreadSpacesCount") {{state.unreadSpacesCount}}
      Explore(
        :visible="state.exploreIsVisible"
        :loading="state.isLoadingSpaces"
        :unreadExploreSpacesCount="state.unreadExploreSpacesCount"
        :unreadFollowingSpacesCount="state.unreadFollowingSpacesCount"
        :unreadEveryoneSpacesCount="state.unreadEveryoneSpacesCount"
        :errorIsLoading="state.error.isLoading"
      )
    //- Live
    .button-wrap
      button.small-button(@click.left="toggleLiveIsVisible" :class="{ active: state.liveIsVisible, 'translucent-button': !shouldIncreaseUIContrast }" title="Live Spaces")
        img.icon.camera(src="@/assets/camera.svg" alt="live icon")
        span(v-if="liveSpacesCount") {{ liveSpacesCount }}
      Live(:visible="state.liveIsVisible" :spaces="state.liveSpaces" :loading="state.isLoadingLiveSpaces")
</template>

<style lang="stylus">
.discovery-buttons
  .space-functions-row
    > .segmented-buttons,
    &.segmented-buttons
      display inline-block
      > .button-wrap
        > button
          border-radius 0
          border-right 0
          .loader
            margin 0
        &:first-child
          > button
            border-top-left-radius var(--entity-radius)
            border-bottom-left-radius var(--entity-radius)
            border-right 0
        &:last-child
          > button
            border-top-right-radius var(--entity-radius)
            border-bottom-right-radius var(--entity-radius)
            border-right 1px solid var(--primary-border)

</style>
