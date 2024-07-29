<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import UserList from '@/components/UserList.vue'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})
const state = reactive({
  dialogHeight: null
})
const visible = computed(() => store.state.spaceUserListIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})
const updateDialogHeight = async () => {
  if (!visible.value) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const currentUser = computed(() => store.state.currentUser)

// team

const team = computed(() => currentUser.value.team)
const teamUsers = computed(() => utils.clone(team.value.users) || [])

// users

const isSpectators = computed(() => store.state.spaceUserListIsSpectators)
const isCollaborators = computed(() => !isSpectators.value)
const currentUserCanEditSpace = computed(() => store.getters['currentUser/canEditSpace']())

const users = computed(() => {
  let items = store.state.spaceUserListUsers
  items = utils.clone(items)
  return items
})

// userlist events

const showRemoveUser = computed(() => {
  return currentUserCanEditSpace.value && isCollaborators.value
})
const selectedUser = computed(() => {
  const userDetailsIsVisible = store.state.userDetailsIsVisible
  if (!userDetailsIsVisible) { return }
  return store.state.userDetailsUser
})
const toggleUserDetails = (event, user) => {
  closeDialogs()
  showUserDetails(event, user)
}
const removeUserFromSpaceUserListUsers = (prevUser) => {
  const newUsers = users.value.filter(user => user.id !== prevUser.id)
  console.log(users.value, newUsers)
  store.commit('spaceUserListUsers', newUsers)
}
const removeCollaborator = async (user) => {
  store.dispatch('currentSpace/removeCollaboratorFromSpace', user)
  const isCurrentUserRemove = store.state.currentUser.id === user.id
  if (isCurrentUserRemove) {
    store.dispatch('closeAllDialogs')
  }
  closeDialogs()
  removeUserFromSpaceUserListUsers(user)
}
const showUserDetails = (event, user) => {
  const shouldHideUserDetails = user.id === store.state.userDetailsUser.id
  if (shouldHideUserDetails) {
    closeDialogs()
    store.commit('userDetailsUser', {})
    return
  }
  let element = event.target
  let options = { element, offsetX: 0, shouldIgnoreZoom: true }
  let position = utils.childDialogPositionFromParent(options)
  store.commit('userDetailsUser', user)
  store.commit('userDetailsPosition', position)
  store.commit('userDetailsIsVisible', true)
}
const closeDialogs = () => {
  store.commit('userDetailsIsVisible', false)
}

// other card users

const otherCardUsers = computed(() => store.getters['currentCards/otherContributors'])
const isOtherCardUsers = computed(() => Boolean(otherCardUsers.value.length))

</script>

<template lang="pug">
dialog.narrow.space-user-list(
  v-if="visible"
  :open="visible"
  @click.left.stop="closeDialogs"
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
)
  section
    p Space Users
  //- teams
  template(v-if="team")
    section
      img.icon.team(src="@/assets/team.svg")
      span {{ team.name }}
    section.results-section
      UserList(
        :users="teamUsers"
        :selectedUser="selectedUser"
        @selectUser="toggleUserDetails"
        :showRemoveUser="false"
        @removeUser="removeCollaborator"
        :isClickable="true"
        :showIsOnline="true"
      )

  //- users
  template(v-if="users.length")
    section
      p(v-if="isSpectators") Spectators
      p(v-if="isCollaborators") Collaborators
    section.results-section
      UserList(
        :users="users"
        :selectedUser="selectedUser"
        @selectUser="toggleUserDetails"
        :showRemoveUser="showRemoveUser"
        @removeUser="removeCollaborator"
        :isClickable="true"
        :showIsOnline="true"
      )
    //- commenters
    template(v-if="isCollaborators && isOtherCardUsers")
      section
        p Commenters
      section.results-section
        UserList(
          :users="otherCardUsers"
          :selectedUser="selectedUser"
          @selectUser="toggleUserDetails"
          :isClickable="true"
          :showIsOnline="true"
        )
</template>

<style lang="stylus">
.space-user-list
  left initial
  right 16px
  top 20px
</style>
