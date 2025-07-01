<script setup>
import { reactive, computed, onMounted, onUnmounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import User from '@/components/User.vue'
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

const props = defineProps({
  userDetailsIsInline: Boolean
})
const state = reactive({
  shouldShowUsersButtonMembers: false,
  shouldShowUsersButtonSpectators: false
})

const isEmbedMode = computed(() => globalStore.isEmbedMode)
const isAddPage = computed(() => globalStore.isAddPage)

// users

const shouldAppendCurrentUser = computed(() => {
  const isSpectator = spectators.value.find(spectator => spectator.id === userStore.id)
  const isMember = members.value.find(member => member?.id === userStore.id)
  return !isSpectator && !isMember
})
const members = computed(() => {
  const groupUsers = groupStore.getGroupUsersWhoAddedCards
  let users = spaceStore.users
  users = users.concat(spaceStore.collaborators)
  users = users.concat(groupUsers)
  users = uniqBy(users, 'id')
  users = users.filter(user => Boolean(user))
  return users || []
})
const membersDisplay = computed(() => {
  const users = members.value
  if (shouldAppendCurrentUser.value) {
    users.push(userStore.getUserAllState)
  }
  return users || []
})

// spectators

const spectators = computed(() => {
  let users = spaceStore.spectators
  const memberIds = members.value.map(user => user.id)
  users = users.filter(user => !memberIds.includes(user.id))
  if (!userStore.getUserIsSpaceMember) {
    users.push(userStore.getUserAllState)
  }
  users = uniqBy(users, 'id')
  return users || []
})
</script>

<template lang="pug">

//- Embed
.space-users-header.embed-users(v-if="isEmbedMode")
  .users
    User(v-for="user in members" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline" :shouldBounceIn="true")
//- Space
.space-users-header(v-else)
  //- spectators
  .users.spectators(v-if="spectators.length")
    User(v-for="user in spectators" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline" :shouldBounceIn="true")
  //- users
  .users
    User(v-for="user in membersDisplay" :user="user" :isClickable="true" :detailsOnRight="true" :key="user.id" :shouldCloseAllDialogs="true" tabindex="0" :userDetailsIsInline="props.userDetailsIsInline" :shouldBounceIn="true")
</template>

<style lang="stylus">
.space-users-header
  display flex
  width 100%
  flex-shrink 1
  margin-left 6px
  max-width 30vw
  > .users
    padding-right 6px
    display flex
    flex-wrap nowrap
    justify-content flex-end
    align-content flex-start
</style>
