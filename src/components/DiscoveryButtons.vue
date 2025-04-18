<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref } from 'vue'
import { useStore } from 'vuex'

import dayjs from 'dayjs'

import Explore from '@/components/dialogs/Explore.vue'
import Live from '@/components/dialogs/Live.vue'

import utils from '@/utils.js'
const store = useStore()

let updateLiveSpacesIntervalTimer, updateSpacesIntervalTimer
const maxUnreadCountCharacter = '+'

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerExploreIsVisible') {
      toggleExploreIsVisible()
    } else if (mutation.type === 'closeAllDialogs') {
      closeDialogs()
    } else if (mutation.type === 'triggerUserIsLoaded') {
      updateSpaces()
    }
  })
  // update spaces
  window.addEventListener('online', updateLiveSpaces)
  window.addEventListener('online', updateSpaces)
  updateLiveSpaces()
  updateLiveSpacesIntervalTimer = setInterval(() => {
    updateLiveSpaces()
  }, 1000 * 60 * 5) // 5 minutes
  updateSpacesIntervalTimer = setInterval(() => {
    updateSpaces()
  }, 1000 * 60 * 10) // 10 minutes
})
onBeforeUnmount(() => {
  window.removeEventListener('online', updateLiveSpaces)
  clearInterval(updateLiveSpacesIntervalTimer)
  clearInterval(updateSpacesIntervalTimer)
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
const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
const isOnline = computed(() => store.state.isOnline)

const normalizeCount = (count) => {
  if (count > 9) {
    return maxUnreadCountCharacter
  } else {
    return count
  }
}

// Unread Counts

const spaceIsCurrentSpace = (space) => {
  const currentSpace = store.state.currentSpace
  return space.id === currentSpace.id
}
const unreadSpaces = (spaces, type) => {
  let readDate = store.state.currentUser.showInExploreUpdatedAt
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
  const readDate = store.state.currentUser.showInExploreUpdatedAt
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
  store.dispatch('closeAllDialogs')
  state.exploreIsVisible = !isVisible
}
const updateSpaces = async () => {
  try {
    state.isLoadingSpaces = true
    const [exploreSpaces, followingSpaces, everyoneSpaces] = await Promise.all([
      store.dispatch('api/getExploreSpaces'),
      store.dispatch('api/getFollowingUsersSpaces'),
      store.dispatch('api/getEveryoneSpaces')
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
  store.dispatch('closeAllDialogs')
  state.liveIsVisible = !isVisible
  if (state.liveIsVisible) {
    updateLiveSpaces()
  }
}
const updateLiveSpaces = async () => {
  state.isLoadingLiveSpaces = true
  let spaces = await store.dispatch('api/getLiveSpaces')
  if (!spaces || !spaces.length) {
    state.isLoadingLiveSpaces = false
    return
  }
  spaces = spaces.filter(space => space.user.id !== store.state.currentUser.id)
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
.button-wrap(v-if="isOnline")
  .segmented-buttons.space-functions-row
    //- Explore
    .button-wrap
      button(:class="{active: state.exploreIsVisible, 'translucent-button': !shouldIncreaseUIContrast}" @click="toggleExploreIsVisible" title="Explore Spaces")
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
      button(@click.left="toggleLiveIsVisible" :class="{ active: state.liveIsVisible, 'translucent-button': !shouldIncreaseUIContrast }" title="Live Spaces")
        img.icon.camera(src="@/assets/camera.svg")
        span(v-if="liveSpacesCount") {{ liveSpacesCount }}
      Live(:visible="state.liveIsVisible" :spaces="state.liveSpaces" :loading="state.isLoadingLiveSpaces")
</template>

<style lang="stylus">
</style>
