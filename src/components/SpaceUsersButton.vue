<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import User from '@/components/User.vue'
import utils from '@/utils.js'

const store = useStore()

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'triggerUpdateTheme') {
      updateSecondaryBackgroundColor()
    }
  })
  updateSecondaryBackgroundColor()
})

const props = defineProps({
  showLabel: Boolean
})

const state = reactive({
  secondaryBackgroundColor: ''
  // spaceUsersListDialogIsVisible: false
})

const updateSecondaryBackgroundColor = () => {
  state.secondaryBackgroundColor = utils.cssVariable('secondary-background')
}
const anonUser = computed(() => {
  return {
    id: '',
    color: state.secondaryBackgroundColor
  }
})

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

// TODO on triggerCloseChildDialogs , close dialogs, spaceUsersListDialogIsVisible= false

// closedialogs()
//   // TODO move to
//   store.commit('userDetailsIsVisible', false)

</script>

<template lang="pug">
button.space-users-button
  User(:user="anonUser" :isClickable="false")
  span 6
  span(v-if="props.showLabel") {{' '}}Collaborators

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
    border-top-left-radius 0
    border-bottom-left-radius 0
    padding 4px 8px
</style>
