<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref } from 'vue'
import { useStore } from 'vuex'

import dayjs from 'dayjs'

import Explore from '@/components/dialogs/Explore.vue'
import Live from '@/components/dialogs/Live.vue'
import Favorites from '@/components/dialogs/Favorites.vue'
import utils from '@/utils.js'
const store = useStore()

let updateLiveSpacesIntervalTimer

onMounted(() => {
  window.addEventListener('online', updateLiveSpaces)
  updateLiveSpaces()
  updateExploreSpaces()
  updateFavorites()
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerExploreIsVisible') {
      toggleExploreIsVisible()
    } else if (mutation.type === 'closeAllDialogs') {
      closeDialogs()
    }
  })
})
onUnmounted(() => {
  window.removeEventListener('online', updateLiveSpaces)
  clearInterval(updateLiveSpacesIntervalTimer)
})

const state = reactive({
  exploreIsVisible: false,
  isLoadingLiveSpaces: true,
  favoritesIsVisible: false,
  liveIsVisible: false,
  liveSpaces: [],
  exploreSpaces: []
})

const closeDialogs = () => {
  state.exploreIsVisible = false
  state.liveIsVisible = false
  state.favoritesIsVisible = false
}
const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)

// Explore

const toggleExploreIsVisible = () => {
  const isVisible = state.exploreIsVisible
  store.dispatch('closeAllDialogs')
  state.exploreIsVisible = !isVisible
}
const unreadExploreSpacesLength = computed(() => {
  let readDate = store.state.currentUser.showInExploreUpdatedAt
  if (!readDate) { return }
  readDate = dayjs(readDate)
  const unreadSpaces = state.exploreSpaces.filter(space => {
    const spaceDate = dayjs(space.showInExploreUpdatedAt)
    const delta = readDate.diff(spaceDate, 'second')
    return delta < 0
  })
  return unreadSpaces.length
})
const updateExploreSpaces = async () => {
  try {
    state.exploreSpaces = await store.dispatch('api/getExploreSpaces')
  } catch (error) {
    console.warn('🚑 updateExploreSpaces', error)
  }
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

// Favorites

const toggleFavoritesIsVisible = () => {
  const isVisible = state.favoritesIsVisible
  store.dispatch('closeAllDialogs')
  state.favoritesIsVisible = !isVisible
}
const favoriteSpacesEditedCount = computed(() => {
  const currentUser = store.state.currentUser
  let favoriteSpaces = utils.clone(currentUser.favoriteSpaces)
  favoriteSpaces = favoriteSpaces.filter(space => {
    const isEditedByOtherUser = space.editedByUserId !== currentUser.id
    const isEditedAndNotVisited = space.isEdited && space.userId !== currentUser.id
    return isEditedByOtherUser && isEditedAndNotVisited
  })
  return favoriteSpaces.length
})
const updateFavorites = async () => {
  await store.dispatch('currentUser/restoreUserFavorites')
}
</script>

<template lang="pug">
.explore-row.button-wrap
  .segmented-buttons.space-functions-row
    //- Explore
    .button-wrap
      button.explore-button(@click.left="toggleExploreIsVisible" :class="{ active: state.exploreIsVisible, 'translucent-button': !shouldIncreaseUIContrast }")
        img.icon.sunglasses(src="@/assets/sunglasses.svg")
        span.explore-button-label(v-if="unreadExploreSpacesLength") &nbsp;{{ unreadExploreSpacesLength }}
    //- Live
    .button-wrap
      button(@click.left="toggleLiveIsVisible" :class="{ active: state.liveIsVisible, 'translucent-button': !shouldIncreaseUIContrast }")
        img.icon.camera(src="@/assets/camera.svg")
        span(v-if="state.liveSpaces.length") {{ state.liveSpaces.length }}
    //- Favorites
    .button-wrap
      button(@click.left="toggleFavoritesIsVisible" :class="{ active: state.favoritesIsVisible, 'translucent-button': !shouldIncreaseUIContrast }")
        img.icon(src="@/assets/heart.svg")
        span(v-if="favoriteSpacesEditedCount") {{ favoriteSpacesEditedCount }}

  Explore(:visible="state.exploreIsVisible" @preloadedSpaces="state.exploreSpaces")
  Live(:visible="state.liveIsVisible" :spaces="state.liveSpaces" :loading="state.isLoadingLiveSpaces")
  Favorites(:visible="state.favoritesIsVisible")
</template>

<style lang="stylus">
.explore-row
  position relative
  .explore-button
    .explore-button-label
      margin-left 0
  .button-wrap
    margin-left 0 !important
  .space-functions-row
    margin-bottom 0
</style>
