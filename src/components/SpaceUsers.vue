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

const avatarWidth = 30
const maxMembersCount = 3
const maxSpecatorsCount = 1

onMounted(() => {
  updateShouldShowUsersButton()
  window.addEventListener('resize', updateShouldShowUsersButton)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateShouldShowUsersButton)
})

const props = defineProps({
  userDetailsIsInline: Boolean
})
const state = reactive({
  shouldShowUsersButtonMembers: false,
  shouldShowUsersButtonSpectators: false
})

const isEmbedMode = computed(() => store.state.isEmbedMode)
const isAddPage = computed(() => store.state.isAddPage)
const currentUser = computed(() => store.state.currentUser)
const currentSpace = computed(() => store.state.currentSpace)
const currentUserIsSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())

const appendCurrentUser = (items) => {
  const isCurrentUser = Boolean(items.find(user => user.id === currentUser.value.id))
  if (isCurrentUser) {
    items = items.filter(user => user.id !== currentUser.value.id)
    items.push(currentUser.value)
  }
  items = uniqBy(items, 'id')
  return items
}
const normalizeDisplayItems = (items, shouldShowUsersButton) => {
  const isCurrentUser = Boolean(items.find(user => user.id === currentUser.value.id))
  if (shouldShowUsersButton && !isCurrentUser) {
    return [items[0]]
  } else if (shouldShowUsersButton) {
    return [last(items)]
  } else {
    return items
  }
}

// members

const members = computed(() => {
  let items = utils.clone(currentSpace.value.users)
  items = items.concat(currentSpace.value.collaborators)
  items = appendCurrentUser(items)
  return items
})
watch(() => members.value, (value, prevValue) => {
  updateShouldShowUsersButton()
})
const membersDisplay = computed(() => {
  return normalizeDisplayItems(members.value, state.shouldShowUsersButtonMembers)
})

// spectators

const spectators = computed(() => {
  let items = utils.clone(currentSpace.value.spectators)
  if (!currentUserIsSpaceMember.value) {
    // if not a space member, currentUser is specatator
    const user = utils.clone(store.state.currentUser)
    items.push(user)
    items = appendCurrentUser(items)
  }
  return items
})
watch(() => spectators.value, (value, prevValue) => {
  updateShouldShowUsersButton()
})
const spectatorsDisplay = computed(() => {
  return normalizeDisplayItems(spectators.value, state.shouldShowUsersButtonSpectators)
})

// space users button

const isMaxMembersCount = computed(() => members.value.length > maxMembersCount)
const isMaxSpectatorsCount = computed(() => spectators.value.length > maxSpecatorsCount)
const allUsersLength = computed(() => {
  const items = members.value.concat(spectators.value)
  return items.length
})
const updateShouldShowUsersButton = () => {
  // users count
  let value
  if (isMaxMembersCount.value) {
    state.shouldShowUsersButtonMembers = true
    value = true
  }
  if (isMaxSpectatorsCount.value) {
    state.shouldShowUsersButtonSpectators = true
    value = true
  }
  if (value) { return }
  // available width
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
    state.shouldShowUsersButtonMembers = true
    state.shouldShowUsersButtonSpectators = true
  } else {
    state.shouldShowUsersButtonMembers = false
    state.shouldShowUsersButtonSpectators = false
  }
}
</script>

<template lang="pug">
//- Embed
.space-users.embed-users(v-if="isEmbedMode")
  .users
    User(v-for="user in membersDisplay" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline" :shouldBounceIn="true")
    SpaceUsersButton(v-if="state.shouldShowUsersButtonMembers" :isParentSpaceUsers="currentUserIsSpaceMember" :users="members")

//- Space
.space-users(v-else ref="spaceUsersElement")
  //- spectators
  .users.spectators(v-if="spectators.length || !currentUserIsSpaceMember")
    User(v-for="user in spectatorsDisplay" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline" :shouldBounceIn="true")
    SpaceUsersButton(v-if="state.shouldShowUsersButtonSpectators" :isParentSpaceUsers="true" :isSpectators="true" :users="spectators")
  //- users
  .users
    User(v-for="user in membersDisplay" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline" :shouldBounceIn="true")
    SpaceUsersButton(v-if="state.shouldShowUsersButtonMembers" :isParentSpaceUsers="true" :users="members")
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
