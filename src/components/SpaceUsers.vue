<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import User from '@/components/User.vue'
import SpaceUsersButton from '@/components/SpaceUsersButton.vue'
import utils from '@/utils.js'

import uniqBy from 'lodash-es/uniqBy'
import last from 'lodash-es/last'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

const spaceUsersElement = ref(null)

const avatarWidth = 30
const maxMembersCount = 3
const maxSpecatorsCount = 2

onMounted(() => {
  // updateShouldShowUsersButton()
  // window.addEventListener('resize', updateShouldShowUsersButton)
})
onBeforeUnmount(() => {
  // window.removeEventListener('resize', updateShouldShowUsersButton)
})

const props = defineProps({
  userDetailsIsInline: Boolean
})
const state = reactive({
  shouldShowUsersButtonMembers: false,
  shouldShowUsersButtonSpectators: false
})

const isEmbedMode = computed(() => globalStore.isEmbedMode)
const isAddPage = computed(() => globalStore.isAddPage)
// const currentUser = computed(() => userStore.getUserAllState)
// const currentSpace = computed(() => spaceStore.getSpaceAllState)
// const currentUserIsSpaceMember = computed(() => userStore.getUserIsSpaceMember)

// const appendCurrentUser = (items) => {
//   const isCurrentUser = Boolean(items.find(user => user.id === currentUser.value.id))
//   if (isCurrentUser) {
//     items = items.filter(user => user.id !== currentUser.value.id)
//     items.push(currentUser.value)
//   }
//   items = uniqBy(items, 'id')
//   return items
// }
// const normalizeDisplayItems = (items, shouldShowUsersButton) => {
//   const isCurrentUser = Boolean(items.find(user => user.id === currentUser.value.id))
//   if (shouldShowUsersButton && !isCurrentUser) {
//     return [items[0]]
//   } else if (shouldShowUsersButton) {
//     return [last(items)]
//   } else {
//     return items
//   }
// }

// users

const shouldAppendCurrentUser = computed(() => {
  const isSpectator = spectators.value.find(spectator => spectator.id === userStore.id)
  const isMember = userStore.getUserIsSpaceMember
  return !isSpectator && !isMember
})
const members = computed(() => {
  const groupUsers = groupStore.getGroupUsersWhoAddedCards || []
  let users = spaceStore.users
  users = users.concat(spaceStore.collaborators)
  users = users.concat(groupUsers)
  users = uniqBy(users, 'id')
  if (shouldAppendCurrentUser.value) {
    users.push(userStore.getUserAllState)
  }
  return users
})
// const spectators = computed(() => spaceStore.spectators)
// watch(() => members.value, (value, prevValue) => {
//   updateShouldShowUsersButton()
// })
// const membersDisplay = computed(() => {
//   return normalizeDisplayItems(members.value, state.shouldShowUsersButtonMembers)
// })

// const users = computed(() => {
//   // const spectators = utils.clone(spaceStore.spectators)
//   let items = members.value.concat(spectators)
//   items = uniqBy(items, 'id')
//   items = items.filter(user => user.id !== currentUser.value.id)
//   items.push(currentUser.value)
//   return items
//   // members + spectators
//   // uniq
//   // sort currentuser is last
// })

// spectators

// const spectators = computed(() => {
//   const groupUsers = groupStore.getGroupUsersWhoAddedCards
//   let spectators = utils.clone(currentSpace.value.spectators)
//   // if not a space member, currentUser is specatator
//   if (!currentUserIsSpaceMember.value) {
//     const user = utils.clone(globalStore.currentUser)
//     spectators.push(user)
//     spectators = appendCurrentUser(spectators)
//   }
//   // group users who's added cards show as members, not spectators
//   if (groupUsers) {
//     spectators = spectators.filter(item => {
//       const isContributor = groupUsers.find(contributor => contributor.id === item.id)
//       return !isContributor
//     })
//   }
//   return spectators
// })
// watch(() => spectators.value, (value, prevValue) => {
//   updateShouldShowUsersButton()
// })
const spectators = computed(() => {
  let users = spaceStore.spectators
  if (!userStore.getUserIsSpaceMember) {
    users.push(userStore.getUserAllState)
  }
  users = uniqBy(users, 'id')
  return users
//   return normalizeDisplayItems(spectators.value, state.shouldShowUsersButtonSpectators)
})

// space users button

// const isMax = computed(() => users.value.concat(spectators.value).length > maxMembersCount)

// const isMaxSpectatorsCount = computed(() => spectators.value.length > maxSpecatorsCount)
// const allUsersLength = computed(() => {
//   const items = members.value.concat(spectators.value)
//   return items.length
// })
// const updateShouldShowUsersButton = () => {
//   // users count
//   let value
//   if (isMaxMembersCount.value) {
//     state.shouldShowUsersButtonMembers = true
//     value = true
//   }
//   if (isMaxSpectatorsCount.value) {
//     state.shouldShowUsersButtonSpectators = true
//     value = true
//   }
//   if (value) { return }
//   // available width
//   const viewportWidth = utils.visualViewport().width
//   const element = spaceUsersElement.value
//   if (!element) { return }
//   const usersWidth = element.getBoundingClientRect().width
//   const rightElementWrap = document.querySelector('header nav .right')
//   let rightSideWidth = rightElementWrap.getBoundingClientRect().width
//   rightSideWidth = rightSideWidth - usersWidth + (allUsersLength.value * avatarWidth)
//   const leftElementWrap = document.querySelector('header nav .left')
//   const leftSideWidth = leftElementWrap.getBoundingClientRect().width
//   const availableWidth = viewportWidth - leftSideWidth - rightSideWidth
//   const minAvailableWidth = viewportWidth / 6
//   if (availableWidth < minAvailableWidth) {
//     state.shouldShowUsersButtonMembers = true
//     state.shouldShowUsersButtonSpectators = true
//   } else {
//     state.shouldShowUsersButtonMembers = false
//     state.shouldShowUsersButtonSpectators = false
//   }
// }
</script>

<template lang="pug">

//- space uers button in share
//- TODO how to handle too many users

//- Embed
.space-users.embed-users(v-if="isEmbedMode")
  .users
    User(v-for="user in users" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline" :shouldBounceIn="true")
    //- SpaceUsersButton(v-if="state.shouldShowUsersButtonMembers" :isParentSpaceUsers="currentUserIsSpaceMember" :users="members")
//- Space
.space-users(v-else)
  //- spectators
  .users.spectators(v-if="spectators.length")
    User(v-for="user in spectators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline" :shouldBounceIn="true")
    //- SpaceUsersButton(v-if="state.shouldShowUsersButtonSpectators" :isParentSpaceUsers="true" :isSpectators="true" :users="spectators")
  //- users
  .users
    User(v-for="user in members" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline" :shouldBounceIn="true")
    //- SpaceUsersButton(v-if="state.shouldShowUsersButtonMembers" :isParentSpaceUsers="true" :users="members")
</template>

<style lang="stylus">
.space-users
  display flex
  width 100%
  flex-shrink 1
  margin-left 6px
  max-width 30vw
  > .users
    padding-right 6px
    display flex
    flex-wrap wrap
    justify-content flex-end
    align-content flex-start
</style>
