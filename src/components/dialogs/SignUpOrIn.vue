<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'

import inboxSpace from '@/data/inbox.json'
import helloSpace from '@/data/hello.json'

import { nanoid } from 'nanoid'

const store = useStore()

let shouldLoadLastSpace
let sessionToken

const emailElement = ref(null)

const emit = defineEmits(['loading'])

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    clearErrors()
    createSessionToken()
    store.commit('shouldExplicitlyHideFooter', true)
    focusEmail()
  } else {
    store.commit('shouldExplicitlyHideFooter', false)
  }
})

const state = reactive({
  email: '',
  password: '',
  signUpVisible: true,
  resetVisible: false,
  error: {
    passwordMatch: false,
    unknownServerError: false,
    accountAlreadyExists: false,
    signInCredentials: false,
    tooManyAttempts: false,
    passwordTooShort: false,
    passwordMatchesEmail: false,
    resetUserEmailNotFound: false
  },
  loading: {
    signUpOrIn: false,
    resetPassword: false
  },
  resetSuccess: false
})
watch(() => state.loading.signUpOrIn, (value, prevValue) => {
  emit('loading', value)
})

// dialog state

const showSignUpVisible = () => {
  state.signUpVisible = true
  clearErrors()
  focusEmail()
}
const hideSignUpVisible = () => {
  state.signUpVisible = false
  state.resetVisible = false
  clearErrors()
  focusEmail()
}
const createSessionToken = () => {
  sessionToken = nanoid()
  store.dispatch('api/createSessionToken', sessionToken)
}
const focusEmail = async () => {
  await nextTick()
  const element = emailElement.value
  if (!element) { return }
  element.focus()
}
const groupToJoinOnLoad = computed(() => store.state.groupToJoinOnLoad)

// errors

const clearErrors = () => {
  for (const errorType in state.error) {
    state.error[errorType] = false
  }
  state.resetSuccess = false
}
const hasErrors = () => {
  let hasErrors
  for (const errorType in state.error) {
    if (state.error[errorType] === true) {
      hasErrors = true
    }
  }
  return hasErrors
}
const handleErrors = async (response) => {
  state.loading.signUpOrIn = false
  state.loading.resetPassword = false
  state.error.signInCredentials = false
  state.error.accountAlreadyExists = false
  state.error.tooManyAttempts = false
  state.error.unknownServerError = false
  if (!response) {
    state.error.unknownServerError = true
    return
  }
  if (response.type === 'unique violation') {
    state.error.accountAlreadyExists = true
  } else if (response.status === 401) {
    state.error.signInCredentials = true
  } else if (response.status === 429) {
    state.error.tooManyAttempts = true
  } else {
    state.error.unknownServerError = true
  }
}

// reset password

const toggleResetVisible = () => {
  state.resetVisible = !state.resetVisible
}
const isPasswordMatchesEmail = (email, password) => {
  const emailNameIndex = email.indexOf('@')
  const name = email.slice(0, emailNameIndex)
  if (email === password || name === password) {
    state.error.passwordMatchesEmail = true
  } else {
    return true
  }
}
const resetPassword = async (event) => {
  if (state.loading.resetPassword || state.resetSuccess) { return }
  const email = event.target[0].value.toLowerCase()
  state.loading.resetPassword = true
  const response = await store.dispatch('api/resetPassword', email)
  state.loading.resetPassword = false
  if (response.status === 404) {
    state.error.resetUserEmailNotFound = true
  } else if (response.status === 429) {
    state.error.tooManyAttempts = true
  } else {
    state.resetSuccess = true
  }
}

// sign up

const isSignUpPasswordsMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    state.error.passwordMatch = true
  } else {
    return true
  }
}
const isSignUpPasswordTooShort = (password) => {
  if (password.length < 4) {
    state.error.passwordTooShort = true
  } else {
    return true
  }
}
const migrationAppleAppAccountToken = () => {
  const appleToken = store.state.currentUser.appleAppAccountToken
  if (!appleToken) {
    store.commit('currentUser/updateAppleAppAccountToken')
  }
}
const signUp = async (event) => {
  if (state.loading.signUpOrIn) { return }
  const email = event.target[0].value.toLowerCase()
  const password = event.target[1].value
  const confirmPassword = event.target[2].value
  migrationAppleAppAccountToken()
  let currentUser = utils.clone(store.state.currentUser)
  if (!isPasswordMatchesEmail(email, password)) { return }
  if (!isSignUpPasswordTooShort(password)) { return }
  if (!isSignUpPasswordsMatch(password, confirmPassword)) { return }
  state.loading.signUpOrIn = true
  const response = await store.dispatch('api/signUp', { email, password, currentUser, sessionToken })
  const newUser = await response.json()
  if (isSuccess(response)) {
    store.commit('clearAllNotifications', false)
    store.commit('currentUser/replaceState', newUser)
    createSpacesBackup()
    migrationSpacesConnections()
    updateSpacesUserId()
    updateCurrentSpaceWithNewUserId(currentUser, newUser)
    await store.dispatch('api/createSpaces')
    notifySignedIn()
    store.dispatch('currentUser/checkIfShouldJoinGroup')
    addCollaboratorToInvitedSpaces()
    store.commit('triggerUpdateWindowHistory')
    store.dispatch('themes/restore')
  } else {
    await handleErrors(newUser)
  }
}

// sign in

const signIn = async (event) => {
  if (state.loading.signUpOrIn) { return }
  const previousUser = utils.clone(store.state.currentUser)
  const email = event.target[0].value.toLowerCase()
  const password = event.target[1].value
  state.loading.signUpOrIn = true
  const response = await store.dispatch('api/signIn', { email, password })
  const result = await response.json()
  state.loading.signUpOrIn = false
  if (isSuccess(response)) {
    store.commit('isLoadingSpace', true)
    store.commit('addNotification', { message: 'Signing In…' })
    // update user to remote user
    store.commit('currentUser/updateUser', result)
    // update local spaces to remote user
    removeUneditedSpace('Hello Kinopio')
    removeUneditedSpace('Inbox')
    migrationSpacesConnections()
    updateSpacesUserId()
    await store.dispatch('api/createSpaces')
    notifySignedIn()
    store.dispatch('currentUser/checkIfShouldJoinGroup')
    // add new spaces from remote
    const spaces = await store.dispatch('api/getUserSpaces')
    cache.addSpaces(spaces)
    store.commit('clearAllNotifications', false)
    addCollaboratorToInvitedSpaces()
    store.commit('triggerSpaceDetailsVisible')
    store.commit('isLoadingFavorites', true)
    store.dispatch('currentUser/restoreUserFavorites')
    store.commit('triggerUpdateNotifications')
    store.dispatch('themes/restore')
    if (shouldLoadLastSpace) {
      store.dispatch('currentSpace/loadLastSpace')
      store.commit('triggerUpdateWindowHistory')
    }
    store.commit('isLoadingSpace', false)
  } else {
    await handleErrors(result)
  }
}

// success

const isSuccess = (response) => {
  const success = [200, 201, 202, 204]
  return Boolean(success.includes(response.status))
}
const notifySignedIn = () => {
  state.loading.signUpOrIn = false
  store.dispatch('closeAllDialogs')
  store.commit('removeNotificationByMessage', 'Signing In…')
  store.commit('addNotification', { message: 'Signed In', type: 'success' })
}

// update spaces on success

const createSpacesBackup = () => {
  const spaces = cache.getAllSpaces()
  cache.storeLocal('spacesBackup', spaces)
}
const migrationSpacesConnections = () => {
  const spaces = cache.getAllSpaces()
  const newSpaces = spaces.map(space => {
    space.connections = utils.migrationConnections(space.connections)
    return space
  })
  newSpaces.forEach(space => {
    cache.saveSpace(space)
  })
}
const updateSpacesUserId = () => {
  const userId = store.state.currentUser.id
  const spaces = cache.getAllSpaces()
  const newSpaces = utils.updateSpacesUserId(userId, spaces)
  newSpaces.forEach(space => {
    cache.saveSpace(space)
  })
}
const updateCurrentSpaceWithNewUserId = (previousUser, newUser) => {
  const currentSpace = store.state.currentSpace
  const userIsSpaceUser = store.getters['currentUser/spaceUserPermission'](currentSpace) === 'user'
  if (!userIsSpaceUser) { return }
  store.commit('currentSpace/removeUserFromSpace', previousUser)
  store.commit('currentSpace/addUserToSpace', newUser)
}
const removeUneditedSpace = (spaceName) => {
  let currentSpace = cache.getSpaceByName(spaceName)
  let space
  if (spaceName === 'Hello Kinopio') {
    space = helloSpace
  } else if (spaceName === 'Inbox') {
    space = inboxSpace
  }
  const cardNames = space.cards.map(card => card.name)
  let spaceIsEdited
  currentSpace?.cards.forEach(card => {
    const cardIsNew = !cardNames.includes(card.name)
    if (cardIsNew) {
      spaceIsEdited = true
    }
  })
  if (!spaceIsEdited) {
    console.log('signIn removeUneditedSpace', spaceName)
    cache.deleteSpace(currentSpace)
    shouldLoadLastSpace = true
  }
}

// update user on success

const addCollaboratorToCurrentSpace = () => {
  const invitedSpaceIds = cache.invitedSpaces().map(space => space?.id)
  const currentSpace = store.state.currentSpace
  const currentUser = store.state.currentUser
  if (invitedSpaceIds.includes(currentSpace?.id)) {
    store.commit('currentSpace/addCollaboratorToSpace', currentUser)
    store.commit('broadcast/close')
    store.commit('broadcast/joinSpaceRoom')
  }
}
const addCollaboratorToInvitedSpaces = () => {
  let invitedSpaces = cache.invitedSpaces()
  invitedSpaces = invitedSpaces.map(space => {
    space.userId = store.state.currentUser.id
    return space
  })
  store.dispatch('api/addToQueue', { name: 'addCollaboratorToSpaces', body: invitedSpaces })
  addCollaboratorToCurrentSpace()
}
</script>

<template lang="pug">
dialog.narrow.sign-up-or-in(v-if="props.visible" :open="props.visible")
  section
    .segmented-buttons
      button(@click.left="showSignUpVisible" :class="{active : state.signUpVisible}") Sign Up
      button(@click.left="hideSignUpVisible" :class="{active : !state.signUpVisible}") Sign In

  //- Sign Up
  section(v-if="state.signUpVisible")
    p Create an account to share your spaces and access them anywhere
    p(v-if="groupToJoinOnLoad")
      span.badge.info Sign up to join group
    form(@submit.prevent="signUp")
      input(ref="emailElement" name="email" type="email" autocomplete="email" placeholder="Email" required v-model="state.email" @input="clearErrors")
      .badge.info(v-if="state.error.accountAlreadyExists") An account with this email already exists, Sign In instead
      input(type="password" name="password" placeholder="Password" required @input="clearErrors" v-model="state.password")
      input(type="password" name="password" placeholder="Confirm Password" required @input="clearErrors")
      .badge.danger(v-if="state.error.passwordMatch") Passwords must match
      .badge.danger(v-if="state.error.passwordMatchesEmail") Password can't be from your email
      .badge.danger(v-if="state.error.passwordTooShort") Password must be longer than 4 characters
      .badge.danger(v-if="state.error.tooManyAttempts") Too many attempts, try again in 10 minutes
      .badge.danger(v-if="state.error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      button(name="signUp" type="submit" :class="{active : state.loading.signUpOrIn}" tabindex="0")
        span Sign Up
        Loader(:visible="state.loading.signUpOrIn")

  //- Sign In
  section(v-else)
    p Welcome back
    p(v-if="groupToJoinOnLoad")
      span.badge.info Sign in to join group
    form(@submit.prevent="signIn")
      input.email(ref="emailElement" name="email" type="email" autocomplete="email" placeholder="Email" required v-model="state.email" @input="clearErrors")
      input(type="password" name="password" placeholder="Password" required v-model="state.password" @input="clearErrors")
      .badge.danger(v-if="state.error.unknownServerError") (シ_ _)シ Something went wrong, Please try again or contact support
      .badge.danger(v-if="state.error.signInCredentials") Incorrect email or password
      .badge.danger(v-if="state.error.tooManyAttempts") Too many attempts, try again in 10 minutes
      button(name="signIn" type="submit" :class="{active : state.loading.signUpOrIn}" tabindex="0")
        span Sign In
        Loader(:visible="state.loading.signUpOrIn")

  //- Privacy Policy
  section(v-if="state.signUpVisible")
    .button-wrap
      a(href="https://help.kinopio.club/posts/privacy-policy")
        button
          span Privacy Policy and TOS{{' '}}
          img.icon.visit(src="@/assets/visit.svg")

  //- Forgot Password
  section.forgot-password(v-else)
    button(@click.left="toggleResetVisible" :class="{active : state.resetVisible}")
      span Forgot Password?
    div(v-show="state.resetVisible")
      form.reset-form(@submit.prevent="resetPassword")
        input(type="email" placeholder="Email" required @input="clearErrors")
        button(type="submit" :class="{active : state.loading.resetPassword || state.resetSuccess}")
          span Reset Password
          Loader(:visible="state.loading.resetPassword")
      .badge.success(v-if="state.resetSuccess") Password Reset Email Sent
      .badge.danger(v-if="state.error.resetUserEmailNotFound") A user with that that email address wasn't found. Try another?
      .badge.danger(v-if="state.error.tooManyAttempts") Too many attempts, try again in 10 minutes
      p.success-message(v-if="state.resetSuccess") If you don't see the email, please check your spam folder, or contact support
</template>

<style lang="stylus">
dialog.sign-up-or-in
  left initial
  right 8px
  overflow auto
  @media(max-height 750px)
    // for ios keyboard input
    top -50px !important
  .reset-form
    margin-top 10px
  p,
  .badge
    margin-bottom 10px
  .success-message
    margin-bottom 0
  .forgot-password
    .badge
      margin 0
      margin-top 10px
  button
    span
      font-weight normal
</style>
