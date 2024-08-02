<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    } else if (mutation.type === 'triggerCloseChildDialogs') {
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

// user

const isCurrentUser = computed(() => store.getters['currentUser/isCurrentUser'](props.user))
const userIsSignedIn = computed(() => {
  if (props.user.isSignedIn === false) {
    return false
  }
  return true
})
const isCollaborator = computed(() => {
  const currentSpace = store.state.currentSpace
  const collaborators = currentSpace.collaborators || []
  return Boolean(collaborators.find(collaborator => {
    return collaborator.id === props.user.id
  }))
})

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

const exploreSpacesIsVisible = computed(() => state.exploreSpaces.length && !state.loading.exploreSpaces && !isCurrentUser.value)
const updateExploreSpaces = async () => {
  if (!props.showExploreSpaces) { return }
  state.loading.exploreSpaces = true
  const spaces = await store.dispatch('api/getPublicUserExploreSpaces', props.user)
  state.exploreSpaces = spaces
  state.loading.exploreSpaces = false
}
</script>

<template lang="pug">
//- Other User
section(v-if="!isCurrentUser && userIsSignedIn && props.user.id")
  .button-wrap
    button(@click.left.stop="getUserSpaces" :class="{active: state.loading.userSpaces || state.spacePickerIsVisible}")
      User(:user="props.user" :isClickable="false" :detailsOnRight="false" :key="props.user.id")
      span Spaces
      Loader(:visible="state.loading.userSpaces")
    SpacePicker(:visible="state.spacePickerIsVisible" :loading="state.loading.userSpaces" :user="props.user" :userSpaces="state.userSpaces" @selectSpace="changeSpace")
  .button-wrap
    button(:class="{active: isFavoriteUser}" @click.left.prevent="updateFavoriteUser" @keydown.stop.enter="updateFavoriteUser")
      span Follow
      Loader(:visible="isLoadingFavorites")
  .badge.danger.error-message(v-if="state.error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support

//- Collaborator
section(v-if="isCollaborator && currentUserIsSpaceMember")
  template(v-if="isCurrentUser && isCollaborator")
    button(@click.left.stop="removeCollaborator")
      img.icon.cancel(src="@/assets/add.svg")
      span Leave Space
  template(v-if="!isCurrentUser")
    button(@click.left.stop="removeCollaborator")
      img.icon.cancel(src="@/assets/add.svg")
      span Remove From Space

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
// .dialog-name
</style>
