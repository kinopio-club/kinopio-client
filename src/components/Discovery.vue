<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref } from 'vue'
import { useStore } from 'vuex'

import dayjs from 'dayjs'

import Explore from '@/components/dialogs/Explore.vue'
import Live from '@/components/dialogs/Live.vue'
import Favorites from '@/components/dialogs/Favorites.vue'

import FavoriteSpaceButton from '@/components/FavoriteSpaceButton.vue'
import utils from '@/utils.js'
const store = useStore()

let updateLiveSpacesIntervalTimer

onMounted(() => {
  window.addEventListener('online', updateLiveSpaces)
  updateLiveSpaces()
  updateExploreSpaces()
  // updateFavorites()
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
  exploreSpaces: [],
  everyoneSpaces: []
})

const closeDialogs = () => {
  state.exploreIsVisible = false
  state.liveIsVisible = false
  state.favoritesIsVisible = false
}
const shouldIncreaseUIContrast = computed(() => store.state.currentUser.shouldIncreaseUIContrast)
const isOnline = computed(() => store.state.isOnline)

// Explore

const toggleExploreIsVisible = () => {
  const isVisible = state.exploreIsVisible
  store.dispatch('closeAllDialogs')
  state.exploreIsVisible = !isVisible
}
const unreadExploreSpacesCount = computed(() => {
  let readDate = store.state.currentUser.showInExploreUpdatedAt
  if (!readDate) { return }
  readDate = dayjs(readDate)
  const unreadSpaces = state.exploreSpaces?.filter(space => {
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

// Everyone

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
  return state.liveSpaces.length
})

// Favorites

// TOOD move fav-ed spaces this to sidebar

// const toggleFavoritesIsVisible = () => {
//   const isVisible = state.favoritesIsVisible
//   store.dispatch('closeAllDialogs')
//   state.favoritesIsVisible = !isVisible
// }
// const favoriteSpacesEditedCount = computed(() => {
//   const currentUser = store.state.currentUser
//   let favoriteSpaces = utils.clone(currentUser.favoriteSpaces)
//   favoriteSpaces = favoriteSpaces.filter(space => {
//     const isEditedByOtherUser = space.editedByUserId !== currentUser.id
//     const isEditedAndNotVisited = space.isEdited && space.userId !== currentUser.id
//     return isEditedByOtherUser && isEditedAndNotVisited
//   })
//   return favoriteSpaces.length
// })
// const updateFavorites = async () => {
//   await store.dispatch('currentUser/restoreUserFavorites')
// }
// const isFavoriteSpace = computed(() => store.getters['currentSpace/isFavorite'])
</script>

<template lang="pug">
.button-wrap(v-if="isOnline")
  //- button(:class="{active: state.exploreIsVisible, 'translucent-button': !shouldIncreaseUIContrast}" @click="toggleExploreIsVisible")
  //-   img.icon.sunglasses(src="@/assets/sunglasses.svg")
  //-   //- span.explore-label Explore
  //- Explore(:visible="state.exploreIsVisible" @preloadedHighlights="state.exploreSpaces" @preloadedEveryone="state.everyoneSpaces")

  .segmented-buttons.space-functions-row
    //- Explore
    .button-wrap
      button(:class="{active: state.exploreIsVisible, 'translucent-button': !shouldIncreaseUIContrast}" @click="toggleExploreIsVisible")
        img.icon.sunglasses(src="@/assets/sunglasses.svg")
        //- span.explore-label Explore
      Explore(:visible="state.exploreIsVisible" @exploreSpaces="state.exploreSpaces" @everyoneSpaces="state.everyoneSpaces")
    //- Live
    .button-wrap
      button(@click.left="toggleLiveIsVisible" :class="{ active: state.liveIsVisible, 'translucent-button': !shouldIncreaseUIContrast }")
        img.icon.camera(src="@/assets/camera.svg")

        span(v-if="liveSpacesCount") {{ liveSpacesCount }}
      Live(:visible="state.liveIsVisible" :spaces="state.liveSpaces" :loading="state.isLoadingLiveSpaces")

FavoriteSpaceButton(v-if="isOnline")

  //- Favorites(:visible="state.favoritesIsVisible")

  //- FavoriteSpaceButton

  //- Favorites
  //- .button-wrap
  //-   button(@click.left="toggleFavoritesIsVisible" :class="{ active: state.favoritesIsVisible, 'translucent-button': !shouldIncreaseUIContrast }")
  //-     //- img.icon(v-if="isFavoriteSpace" src="@/assets/heart.svg")
  //-     //- img.icon(v-else src="@/assets/heart-empty.svg")
  //-     span(v-if="favoriteSpacesEditedCount") {{ favoriteSpacesEditedCount }}

</template>

<style lang="stylus" scoped>
// @media(max-width 400px)
//   .explore-label
//     display none
  // .explore-button
  //   .explore-button-label
  //     margin-left 0
  // .space-functions-row
  //   margin-bottom 0
  //   > .button-wrap
  //     margin-left 0 !important

</style>
