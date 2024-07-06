<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick, defineAsyncComponent } from 'vue'
import { useStore } from 'vuex'

import User from '@/components/User.vue'
import SpaceUsersButton from '@/components/SpaceUsersButton.vue'
import utils from '@/utils.js'

import uniqBy from 'lodash-es/uniqBy'
import last from 'lodash-es/last'

const store = useStore()

const spaceUsersElement = ref(null)

const avatarWidth = 28

onMounted(() => {
  window.addEventListener('resize', updateShouldShowUsersButton)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateShouldShowUsersButton)
})

const props = defineProps({
  userDetailsIsInline: Boolean
})
const state = reactive({
  shouldShowUsersButton: false
})

const isEmbedMode = computed(() => store.state.isEmbedMode)
const isAddPage = computed(() => store.state.isAddPage)
const currentUser = computed(() => store.state.currentUser)
const currentSpace = computed(() => store.state.currentSpace)
const currentUserIsSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())

const appendCurrentUser = (items) => {
  const isCurrentUser = items.find(user => user.id !== currentUser.value.id)
  if (isCurrentUser) {
    items = items.filter(user => user.id !== currentUser.value.id)
    items.push(currentUser.value)
  }
  items = uniqBy(items, 'id')
  return items
}
const normalizeDisplayItems = (items) => {
  if (state.shouldShowUsersButton) {
    return [last(items)]
  } else {
    return items
  }
}

// users

const users = computed(() => {
  let items = utils.clone(currentSpace.value.users)
  items = items.concat(currentSpace.value.collaborators)
  items = appendCurrentUser(items)
  return items
})
watch(() => users.value, (value, prevValue) => {
  updateShouldShowUsersButton()
})
const usersDisplay = computed(() => {
  return normalizeDisplayItems(users.value)
})

// spectators

const spectators = computed(() => {
  let items = currentSpace.value.spectators
  if (currentUserIsSpaceMember.value) { // currentUser cannot be both member and specatator
    items = items.filter(user => user.id !== currentUser.value.id)
  }
  items = appendCurrentUser(items)
  return items
})
watch(() => spectators.value, (value, prevValue) => {
  updateShouldShowUsersButton()
})
const spectatorsDisplay = computed(() => {
  return normalizeDisplayItems(spectators.value)
})

// space users button

const allUsersLength = computed(() => {
  const items = users.value.concat(spectators.value)
  return items.length
})
const updateShouldShowUsersButton = () => {
  // too many users
  let value
  if (users.value.length > 3) {
    value = true
  } else if (spectators.value > 1) {
    value = true
  }
  if (value) {
    state.shouldShowUsersButton = true
    return
  }
  // not enough available width
  const viewportWidth = utils.visualViewport().width
  const element = spaceUsersElement.value
  const usersWidth = element.getBoundingClientRect().width
  const rightElementWrap = document.querySelector('header nav .right')
  let rightSideWidth = rightElementWrap.getBoundingClientRect().width
  rightSideWidth = rightSideWidth - usersWidth + (allUsersLength.value * avatarWidth)
  const leftElementWrap = document.querySelector('header nav .left')
  const leftSideWidth = leftElementWrap.getBoundingClientRect().width
  const availableWidth = viewportWidth - leftSideWidth - rightSideWidth
  const minAvailableWidth = viewportWidth / 6
  if (availableWidth < minAvailableWidth) {
    state.shouldShowUsersButton = true
  } else {
    state.shouldShowUsersButton = false
  }
}
</script>

<template lang="pug">
//- Add Page
.space-users.add-page-user(v-if="isAddPage")
  .users
    User(:user="currentUser" :isClickable="true" :detailsOnRight="true" :key="currentUser.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline")
//- Embed
.space-users.embed-users(v-else-if="isEmbedMode")
  .users
    User(v-for="user in usersDisplay" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline")
    SpaceUsersButton(v-if="state.shouldShowUsersButton" :isSiblingButton="currentUserIsSpaceMember")

//- Space
.space-users(v-else ref="spaceUsersElement")
  //- spectators
  .users.spectators(v-if="spectators.length || !currentUserIsSpaceMember")
    User(v-for="user in spectatorsDisplay" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline")
    SpaceUsersButton(v-if="state.shouldShowUsersButton" :isSiblingButton="currentUserIsSpaceMember" :isSpectators="true")
  //- users
  .users
    User(v-for="user in usersDisplay" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline")
    SpaceUsersButton(v-if="state.shouldShowUsersButton" :isSiblingButton="currentUserIsSpaceMember")
</template>

<style lang="stylus">
.space-users
  display flex
  width 100%
  flex-shrink 1
  margin-left 6px
  > .users
    padding-right 6px
    display flex
    flex-wrap wrap
    justify-content flex-end
    align-content flex-start
</style>
