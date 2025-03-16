<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import User from '@/components/User.vue'
import GroupLabel from '@/components/GroupLabel.vue'
import utils from '@/utils.js'
import cache from '@/cache.js'
import postMessage from '@/postMessage.js'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  store.subscribe(mutation => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeDialogs()
    }
  })
  updateExploreSpaces()
})

const props = defineProps({
  user: Object,
  showExploreSpaces: Boolean
})
const state = reactive({
  dialogHeight: null,
  spacePickerIsVisible: false,
  exploreSpaces: [],
  userSpaces: [],
  groupsIsVisible: false,
  loading: {
    exploreSpaces: false,
    userSpaces: false
  },
  error: {
    unknownServerError: false
  }
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    clearUserSpaces()
  }
})
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const closeDialogs = () => {
  state.spacePickerIsVisible = false
}
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}

// user

const userIsSignedIn = computed(() => {
  if (props.user.isSignedIn === false) {
    return false
  }
  return true
})

// current user

const isCurrentUser = computed(() => store.getters['currentUser/isCurrentUser'](props.user))
// const currentUserIsSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const userSettingsIsVisible = computed(() => store.state.userSettingsIsVisible)
const toggleUserSettingsIsVisible = () => {
  const value = !store.state.userSettingsIsVisible
  store.dispatch('closeAllDialogs')
  store.commit('userSettingsIsVisible', value)
}
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const signOut = async () => {
  postMessage.send({ name: 'onLogout' })
  await store.dispatch('currentUser/resetLastSpaceId')
  await cache.removeAll()
  // clear history wipe state from vue-router
  window.history.replaceState({}, 'Kinopio', '/')
  location.reload()
}

// spaces

const changeSpace = (space) => {
  store.dispatch('currentSpace/changeSpace', space)
}
const getUserSpaces = async () => {
  state.error.unknownServerError = false
  if (state.loading.userSpaces) { return }
  if (state.spacePickerIsVisible) {
    closeDialogs()
    return
  }
  state.loading.userSpaces = true
  state.spacePickerIsVisible = true
  try {
    const publicUser = await store.dispatch('api/getPublicUser', props.user)
    state.userSpaces = publicUser.spaces
  } catch (error) {
    state.error.unknownServerError = true
    clearUserSpaces()
  }
  state.loading.userSpaces = false
}
const clearUserSpaces = () => {
  state.loading.userSpaces = false
  state.userSpaces = []
}

// follow favorite

const isLoadingFavorites = computed(() => store.state.isLoadingFavorites)
const updateFavoriteUser = () => {
  const user = props.user
  const value = !isFavoriteUser.value
  store.dispatch('currentUser/updateFavoriteUser', { user, value })
}
const isFavoriteUser = computed(() => {
  const favoriteUsers = store.state.currentUser.favoriteUsers
  const isFavoriteUser = Boolean(favoriteUsers.find(favoriteUser => {
    return favoriteUser.id === props.user.id
  }))
  return isFavoriteUser
})

// explore spaces

const exploreSpacesIsVisible = computed(() => state.exploreSpaces?.length && !state.loading.exploreSpaces && !isCurrentUser.value)
const updateExploreSpaces = async () => {
  if (!props.showExploreSpaces) { return }
  state.loading.exploreSpaces = true
  const spaces = await store.dispatch('api/getPublicUserExploreSpaces', props.user)
  state.exploreSpaces = spaces
  state.loading.exploreSpaces = false
}

// groups

const toggleGroupsIsVisible = () => {
  store.commit('closeAllDialogs')
  store.commit('groupsIsVisible', true)
}
</script>

<template lang="pug">
.user-details-actions(@click.stop="closeDialogs")
  //- Current User
  section(v-if="isCurrentUser")
    //- group
    .row
      .button-wrap
        button(@click.stop="toggleGroupsIsVisible")
          img.icon.group(src="@/assets/group.svg")
          span Groups
  section(v-if="isCurrentUser")
    //- settings, sign out
    .row
      .button-wrap
        button(@click.left.stop="toggleUserSettingsIsVisible" :class="{active: userSettingsIsVisible}")
          img.icon.settings(src="@/assets/settings.svg")
          span Settings
      button.danger(v-if="currentUserIsSignedIn" @click.left="signOut")
        img.icon.sign-out(src="@/assets/sign-out.svg")
        span Sign Out
      button(v-else @click.left="triggerSignUpOrInIsVisible")
        span Sign Up or In
  //- spaces, follow
  section(v-if="!isCurrentUser && userIsSignedIn")
    .button-wrap
      button(@click.left.stop="getUserSpaces" :class="{active: state.loading.userSpaces || state.spacePickerIsVisible}")
        User(:user="props.user" :isClickable="false" :detailsOnRight="false" :key="props.user.id")
        span Spaces
        Loader(:visible="state.loading.userSpaces")
      SpacePicker(:visible="state.spacePickerIsVisible" :loading="state.loading.userSpaces" :user="props.user" :userSpaces="state.userSpaces" @selectSpace="changeSpace")
    .button-wrap
      button(:class="{active: isFavoriteUser}" @click.left.prevent="updateFavoriteUser" @keydown.stop.enter="updateFavoriteUser")
        span(v-if="!isFavoriteUser") Follow
        span(v-if="isFavoriteUser") Unfollow
        Loader(:visible="isLoadingFavorites")
    .badge.danger.error-message(v-if="state.error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
  //- Explore Spaces
  section.results-section.explore-spaces-section(v-if="exploreSpacesIsVisible" ref="results")
    SpaceList(
      :spaces="state.exploreSpaces"
      @selectSpace="changeSpace"
      :hideFilter="true"
      :isLoading="state.loading.exploreSpaces"
      :disableListOptimizaitons="true"
    )
</template>

<style lang="stylus">
.user-details-actions
  border-top 1px solid var(--primary-border)
</style>
