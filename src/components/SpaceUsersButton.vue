<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import User from '@/components/User.vue'
import utils from '@/utils.js'

import last from 'lodash-es/last'

const store = useStore()

const props = defineProps({
  showLabel: Boolean,
  isSiblingButton: Boolean,
  isSpectators: Boolean,
  users: Array
})

const spaceUserListIsVisible = computed(() => store.state.spaceUserListIsVisible)
const toggleSpaceUserListIsVisible = () => {
  const value = spaceUserListIsVisible.value
  store.commit('closeAllDialogs')
  store.commit('spaceUserListIsVisible', !value)
}

// users

const currentSpace = computed(() => store.state.currentSpace)
const currentUserIsSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())

const users = computed(() => {
  let items
  const currentUser = store.state.currentUser
  if (props.users) {
    items = props.users
  } else {
    items = utils.clone(currentSpace.value.users)
    items = items.concat(currentSpace.value.collaborators)
  }
  items = items.filter(user => user.id !== currentUser.id)
  store.commit('spaceUserListUsers', items)
  store.commit('spaceUserListIsSpectators', props.isSpectators)
  return items
})
// watch(() => users.value, (value, prevValue) => {
//   const currentUser = store.state.currentUser
//   state.users = props.users.filter(user => user.id !== currentUser.id)

// })

// const users = computed(() => {
//   let items
//   // specatators
//   if (props.isSpectators) {
//     items = currentSpace.value.spectators
//     if (currentUserIsSpaceMember.value) {
//       items = items.filter(user => user.id !== currentUser.value.id)
//     }
//   // users
//   } else {
//     items = utils.clone(currentSpace.value.users)
//     items = items.concat(currentSpace.value.collaborators)
//   }
//   return items
// })

// const selectedUser = computed(() => {
//   const userDetailsIsVisible = store.state.userDetailsIsVisible
//   if (!userDetailsIsVisible) { return }
//   return store.state.userDetailsUser
// })
// const spaceCollaborators = computed(() => store.state.currentSpace.collaborators)
// const spaceHasCollaborators = computed(() => {
//   const collaborators = store.state.currentSpace.collaborators
//   return Boolean(collaborators.length)
// })
// const spaceOtherCardUsers = computed(() => {
//   const currentUserId = store.state.currentUser.id
//   const collaborators = store.state.currentSpace.collaborators
//   let users = store.getters['currentCards/users']
//   users = users.filter(user => Boolean(user))
//   // remove currentUser
//   users = users.filter(user => user.id !== currentUserId)
//   // remove collaborators
//   users = users.filter(user => {
//     const isCollaborator = spaceCollaborators.value.find(collaborator => {
//       return collaborator.id === user.id
//     })
//     return !isCollaborator
//   })
//   return users
// })
// const spaceHasOtherCardUsers = computed(() => Boolean(spaceOtherCardUsers.value.length))
// const toggleUserDetails = (event, user) => {
//   closeDialogs()
//   showUserDetails(event, user)
// }
// const showUserDetails = (event, user) => {
//   let element = event.target
//   let options = { element, offsetX: 25, shouldIgnoreZoom: true }
//   let position = utils.childDialogPositionFromParent(options)
//   store.commit('userDetailsUser', user)
//   store.commit('userDetailsPosition', position)
//   store.commit('userDetailsIsVisible', true)
// }
// const removeCollaborator = async (user) => {
//   store.dispatch('currentSpace/removeCollaboratorFromSpace', user)
//   const isCurrentUser = store.state.currentUser.id === user.id
//   if (isCurrentUser) {
//     store.dispatch('closeAllDialogs')
//   }
//   closeDialogs()
// }

// closedialogs()
//   // TODO move to
//   store.commit('userDetailsIsVisible', false)

// button

const recentUser = computed(() => {
  return last(users.value)
})
const label = computed(() => utils.pluralize('Collaborator', users.value.length))

</script>

<template lang="pug">
button.space-users-button(v-if="users.length" @click.stop="toggleSpaceUserListIsVisible" :class="{ 'sibling-button': props.isSiblingButton, active: spaceUserListIsVisible }")
  User(:user="recentUser" :isClickable="false" :hideYouLabel="true" :isSmall="true")
  span {{ users.length }}
  span(v-if="props.showLabel") {{' '}}{{ label }}

  //- //- Collaborators
  //- section.results-section(v-if="spaceHasCollaborators || spaceHasOtherCardUsers")
  //-   //- collaborators / members
  //-   template(v-if="spaceHasCollaborators")
  //-     UserList(:users="spaceCollaborators" :selectedUser="selectedUser" @selectUser="toggleUserDetails" :showRemoveUser="isSpaceMember" @removeUser="removeCollaborator" :isClickable="true")
  //-   //- other/card users. has created a card but isnt a collaborator
  //-   template(v-if="spaceHasOtherCardUsers")
  //-     UserList(:users="spaceOtherCardUsers" :selectedUser="selectedUser" @selectUser="toggleUserDetails" :isClickable="true")

</template>

<style lang="stylus">
.space-users
  .space-users-button
    &.sibling-button
      border-top-left-radius 0
      border-bottom-left-radius 0
.space-users-button
  > .user.is-small
    .anon-avatar
      top 4px
</style>
