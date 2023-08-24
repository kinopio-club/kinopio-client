<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

import dayjs from 'dayjs'

import Explore from '@/components/dialogs/Explore.vue'
import Live from '@/components/dialogs/Live.vue'

let updateLiveSpacesIntervalTimer

onMounted(() => {
  window.addEventListener('online', updateLiveSpaces)
  updateLiveSpaces()
  updateExploreSpaces()
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
  liveIsVisible: false,
  liveSpaces: [],
  exploreSpaces: []
})

const closeDialogs = () => {
  state.exploreIsVisible = false
  state.liveIsVisible = false
}

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

</script>

<template lang="pug">
.explore-row.button-wrap
  .segmented-buttons
    //- Explore
    button.explore-button(@click.left="toggleExploreIsVisible" :class="{ active: state.exploreIsVisible}")
      img.icon.sunglasses(src="@/assets/sunglasses.svg")
      span.explore-button-label(v-if="unreadExploreSpacesLength") &nbsp;{{ unreadExploreSpacesLength }}
    //- Live
    button(@click.left="toggleLiveIsVisible" :class="{ active: state.liveIsVisible}")
      img.icon.camera(src="@/assets/camera.svg")
      span(v-if="state.liveSpaces.length") {{ state.liveSpaces.length }}
  Explore(:visible="state.exploreIsVisible" @preloadedSpaces="state.exploreSpaces")
  Live(:visible="state.liveIsVisible" :spaces="state.liveSpaces" :loading="state.isLoadingLiveSpaces")
</template>

<style lang="stylus">
.explore-row
  position relative
  .explore-button
    .explore-button-label
      margin-left 0
</style>
