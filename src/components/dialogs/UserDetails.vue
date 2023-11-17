<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'

import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import SpacePicker from '@/components/dialogs/SpacePicker.vue'
import Loader from '@/components/Loader.vue'
import UserBadges from '@/components/UserBadges.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'
import postMessage from '@/postMessage.js'
const User = defineAsyncComponent({
  loader: () => import('@/components/User.vue')
})
const store = useStore()

const dialogElement = ref(null)
const descriptionElement = ref(null)

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerScrollUserDetailsIntoView' && visible.value) {
      scrollUserDetailsIntoView()
    }
  })
})

const state = reactive({
  colorPickerIsVisible: false,
  loadingUserspaces: false,
  spacePickerIsVisible: false,
  userSpaces: [],
  error: {
    unknownServerError: false
  }
})

const visible = computed(() => store.state.userDetailsIsVisible)
watch(() => visible.value, (value, prevValue) => {
  closeDialogs()
  clearUserSpaces()
  if (value) {
    updateTextareaSize()
  }
})
const userDetailsPosition = computed(() => store.state.userDetailsPosition)
watch(() => userDetailsPosition.value, (value, prevValue) => {
  closeDialogs()
})
const styles = computed(() => {
  let { x, y, shouldIgnoreZoom, transformOriginIsTopRight } = userDetailsPosition.value
  let zoom = spaceCounterZoomDecimal.value
  if (shouldIgnoreZoom) {
    zoom = 1
  }
  if (store.state.isTouchDevice) {
    zoom = utils.pinchCounterZoomDecimal()
    if (zoom > 1) {
      x = x * zoom
      y = y * zoom
    }
  }
  const styles = {
    transform: `scale(${zoom})`,
    left: x + 'px',
    top: y + 'px'
  }
  if (transformOriginIsTopRight) {
    styles.transformOrigin = 'top right'
  }
  return styles
})
const updateTextareaSize = async () => {
  await nextTick()
  let textarea = descriptionElement.value
  if (!textarea) { return }
  textarea.style.height = textarea.scrollHeight + 1 + 'px'
}
const spaceCounterZoomDecimal = computed(() => store.getters.spaceCounterZoomDecimal)
const isLoadingFavorites = computed(() => store.state.isLoadingFavorites)
const userSettingsIsVisible = computed(() => store.state.userSettingsIsVisible)
const closeDialogs = () => {
  state.colorPickerIsVisible = false
  state.spacePickerIsVisible = false
}

// update state

const toggleUserSettingsIsVisible = () => {
  const value = !store.state.userSettingsIsVisible
  store.dispatch('closeAllDialogs')
  store.commit('userSettingsIsVisible', value)
}
const toggleColorPicker = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const changeSpace = (space) => {
  store.dispatch('currentSpace/changeSpace', space)
}
const scrollUserDetailsIntoView = async () => {
  await nextTick()
  const element = dialogElement.value
  utils.scrollIntoView({ element })
}

// current user

const currentUserIsSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const signOut = () => {
  postMessage.send({ name: 'onLogout' })
  cache.removeAll()
  // clear history wipe state from vue-router
  window.history.replaceState({}, 'Kinopio', '/')
  location.reload()
}

// user info

const user = computed(() => store.state.userDetailsUser)
const userColor = computed(() => user.value.color)
const userIsMember = computed(() => Boolean(store.getters['currentSpace/memberById'](user.value.id)))
const userIsUpgraded = computed(() => user.value.isUpgraded)
const isCurrentUser = computed(() => store.getters['currentUser/isCurrentUser'](user.value))
const userIsSignedIn = computed(() => {
  if (user.value.isSignedIn === false) {
    return false
  }
  return true
})
const userName = computed({
  get () {
    return user.value.name
  },
  set (newValue) {
    updateUser({ name: newValue })
  }
})
const userDescription = computed({
  get () {
    return user.value.description
  },
  set (newValue) {
    updateUser({ description: newValue })
    updateTextareaSize()
  }
})
const userWebsite = computed({
  get () {
    return user.value.website
  },
  set (newValue) {
    updateUser({ website: newValue })
  }
})
const websiteUrl = computed(() => {
  if (!userWebsite.value) { return }
  const urls = utils.urlsFromString(userWebsite.value)
  if (!urls) { return }
  return urls[0]
})
const isFavoriteUser = computed(() => {
  const favoriteUsers = store.state.currentUser.favoriteUsers
  const isFavoriteUser = Boolean(favoriteUsers.find(favoriteUser => {
    return favoriteUser.id === user.value.id
  }))
  return isFavoriteUser
})
const isCollaborator = computed(() => {
  const currentSpace = store.state.currentSpace
  const collaborators = currentSpace.collaborators || []
  return Boolean(collaborators.find(collaborator => {
    return collaborator.id === user.value.id
  }))
})
const getUserSpaces = async () => {
  state.error.unknownServerError = false
  if (state.loadingUserspaces) { return }
  if (state.spacePickerIsVisible) {
    closeDialogs()
    return
  }
  state.loadingUserspaces = true
  state.spacePickerIsVisible = true
  try {
    const publicUser = await store.dispatch('api/getPublicUser', user.value)
    state.userSpaces = publicUser.spaces
  } catch (error) {
    state.error.unknownServerError = true
    clearUserSpaces()
  }
  state.loadingUserspaces = false
}
const clearUserSpaces = () => {
  state.loadingUserspaces = false
  state.userSpaces = []
}

// update user

const updateUser = (update) => {
  store.dispatch('currentUser/update', update)
}
const toggleIsFavoriteUser = () => {
  if (isFavoriteUser.value) {
    store.dispatch('currentUser/removeFavorite', { type: 'user', item: user.value })
  } else {
    store.dispatch('currentUser/addFavorite', { type: 'user', item: user.value })
  }
}
const updateUserColor = (newValue) => {
  updateUser({ color: newValue })
}
const removeCollaborator = () => {
  store.dispatch('currentSpace/removeCollaboratorFromSpace', user.value)
  store.dispatch('closeAllDialogs')
}
</script>

<template lang="pug">
dialog.narrow.user-details(v-if="visible" @keyup.stop :open="visible" @click.left.stop="closeDialogs" @keydown.stop :style="styles" ref="dialogElement")

  //- Other User
  section(v-if="!isCurrentUser")
    .user-info
      .row
        User(:user="user" :isClickable="false" :detailsOnRight="false" :key="user.id")
        p.name.user-details-name {{user.name}}
      .row(v-if="user.description")
        textarea(ref="descriptionElement" :value="user.description" disabled)
      .row.website(v-if="user.website")
        p(v-if="!websiteUrl") {{user.website}}
        a(:href="websiteUrl" v-if="websiteUrl")
          span {{user.website}}
    UserBadges(:user="user")

  //- Current User
  template(v-if="isCurrentUser")
    section.current-user
      .row
        .button-wrap
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}")
            .current-color(:style="{ background: userColor }")
          ColorPicker(:currentColor="userColor" :visible="state.colorPickerIsVisible" @selectedColor="updateUserColor")
        input.name.user-details-name(placeholder="What's your name?" v-model="userName" name="Name" maxlength=100)
      .row
        textarea(ref="description" placeholder="Tell us about yourself" v-model="userDescription" name="Description" maxlength=220 rows="1")
      .row
        input(ref="website" placeholder="Website" v-model="userWebsite" name="Website" maxlength=200 rows="1")
        a(:href="websiteUrl" v-if="websiteUrl")
          button.inline-button
            img.icon.visit.arrow-icon(src="@/assets/visit.svg")
      UserBadges(:user="user")
    section
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

  //- Other User
  section(v-if="!isCurrentUser && userIsSignedIn && user.id")
    .button-wrap
      button(@click.left.stop="getUserSpaces" :class="{active: state.loadingUserspaces || state.spacePickerIsVisible}")
        User(:user="user" :isClickable="false" :detailsOnRight="false" :key="user.id")
        span Spaces
        Loader(:visible="state.loadingUserspaces")
      SpacePicker(:visible="state.spacePickerIsVisible" :loading="state.loadingUserspaces" :user="user" :userSpaces="state.userSpaces" @selectSpace="changeSpace")
    .button-wrap
      button(:class="{active: isFavoriteUser}" @click.left.prevent="toggleIsFavoriteUser" @keydown.stop.enter="toggleIsFavoriteUser")
        img.icon(v-if="isFavoriteUser" src="@/assets/heart.svg")
        img.icon(v-else src="@/assets/heart-empty.svg")
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
</template>

<style lang="stylus">
.user-details
  cursor initial
  top calc(100% - 8px)
  position absolute
  .current-user
    .user-badges
      margin-top -10px
  .user-details-name
    margin-left 6px
  .error-message
    margin-top 10px
  .upgrade
    .badge
      display inline-block

  .upgrade-user
    max-height calc(100vh - 175px)

  textarea
    margin-bottom 0

  .inline-button
    margin-left 6px
    background-color var(--primary-background)
    cursor pointer
    &:hover
      background var(--secondary-hover-background)
    &:active
      background var(--secondary-active-background)

  .arrow-icon
    position absolute
    left 5px
    top 3.5px

.user-info
  .row
    align-items center
  p
    margin 0
  .website
    word-break break-all
    align-items flex-start
    .inline-button
      margin-top -1px
  textarea:disabled
    color var(--primary)
    -webkit-text-fill-color var(--primary)
    -webkit-opacity 1
</style>
