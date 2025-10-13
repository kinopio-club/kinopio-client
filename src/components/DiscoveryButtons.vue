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
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

let unsubscribes
let updateLiveSpacesIntervalTimer, updateSpacesIntervalTimer
const maxUnreadCountCharacter = '+'

onMounted(() => {
  // update spaces
  if (!consts.isStaticPrerenderingPage) {
    window.addEventListener('online', updateLiveSpaces)
    window.addEventListener('online', updateSpaces)
  }
  updateLiveSpaces()
  updateSpaces()
  updateLiveSpacesIntervalTimer = setInterval(() => {
    updateLiveSpaces()
  }, 1000 * 60 * 5) // 5 minutes
  updateSpacesIntervalTimer = setInterval(() => {
    updateSpaces()
  }, 1000 * 60 * 10) // 10 minutes

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerExploreIsVisible') {
        toggleExploreIsVisible()
      } else if (name === 'closeAllDialogs') {
        closeDialogs()
      } else if (name === 'triggerUserIsLoaded') {
        updateSpaces()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  if (!consts.isStaticPrerenderingPage) {
    window.removeEventListener('online', updateLiveSpaces)
    window.removeEventListener('online', updateSpaces)
  }
  clearInterval(updateLiveSpacesIntervalTimer)
  clearInterval(updateSpacesIntervalTimer)
  unsubscribes()
})

const state = reactive({
  exploreIsVisible: false,
  isLoadingLiveSpaces: true,
  isLoadingSpaces: true,
  favoritesIsVisible: false,
  liveIsVisible: false,
  liveSpaces: [],
  exploreSpaces: [],
  followingSpaces: [],
  everyoneSpaces: [],
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
  state.unreadExploreSpacesCount = unreadSpaces(state.exploreSpaces, 'explore').length
  state.unreadFollowingSpacesCount = unreadSpaces(state.followingSpaces, 'following').length
  state.unreadEveryoneSpacesCount = unreadSpaces(state.everyoneSpaces, 'everyone').length
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
const updateSpaces = async () => {
  try {
    state.isLoadingSpaces = true
    const [exploreSpaces, followingSpaces, everyoneSpaces] = await Promise.all([
      apiStore.getExploreSpaces(),
      apiStore.getFollowingUsersSpaces(),
      apiStore.getEveryoneSpaces()
    ])
    state.exploreSpaces = exploreSpaces
    state.followingSpaces = followingSpaces
    state.everyoneSpaces = everyoneSpaces
    updateUnreadSpacesCounts()
  } catch (error) {
    console.error('🚑 updateSpaces', error)
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
        img.icon.sunglasses(src="@/assets/sunglasses.svg")
        span(v-if="state.unreadSpacesCount") {{state.unreadSpacesCount}}
      Explore(
        :visible="state.exploreIsVisible"
        :exploreSpaces="state.exploreSpaces"
        :followingSpaces="state.followingSpaces"
        :everyoneSpaces="state.everyoneSpaces"
        :loading="state.isLoadingSpaces"
        :unreadExploreSpacesCount="state.unreadExploreSpacesCount"
        :unreadFollowingSpacesCount="state.unreadFollowingSpacesCount"
        :unreadEveryoneSpacesCount="state.unreadEveryoneSpacesCount"
        :errorIsLoading="state.error.isLoading"
      )
    //- Live
    .button-wrap
      button.small-button(@click.left="toggleLiveIsVisible" :class="{ active: state.liveIsVisible, 'translucent-button': !shouldIncreaseUIContrast }" title="Live Spaces")
        img.icon.camera(src="@/assets/camera.svg")
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
