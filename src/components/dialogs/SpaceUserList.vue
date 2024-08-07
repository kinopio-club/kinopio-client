<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import UserList from '@/components/UserList.vue'

import uniqBy from 'lodash-es/uniqBy'

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
const currentUserCanEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const currentSpace = computed(() => store.state.currentSpace)

// list type

const isSpectators = computed(() => store.state.spaceUserListIsSpectators)
const isCollaborators = computed(() => !isSpectators.value)
const label = computed(() => {
  let string = 'Collaborators'
  if (isSpectators.value) {
    string = 'Spectators'
  }
  return string
})

// team

const team = computed(() => store.state.currentSpace.team)

// users

// based on SpaceUsersButton.spaceUsers
const users = computed(() => {
  let items
  if (isSpectators.value) {
    items = currentSpace.value.spectators
  } else {
    const teamUsers = store.getters['currentCards/teamUsersWhoAddedCards']
    items = utils.clone(currentSpace.value.users)
    items = items.concat(currentSpace.value.collaborators)
    items = items.concat(teamUsers)
  }
  items = items.filter(item => Boolean(item))
  items = items.filter(item => item.id !== currentUser.value.id)
  items = uniqBy(items, 'id')
  return items
})

// commenters

const commenters = computed(() => utils.clone(store.getters['currentCards/commenters']))
const isCommenters = computed(() => Boolean(commenters.value.length))

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
const removeCollaborator = async (user) => {
  store.dispatch('currentSpace/removeCollaboratorFromSpace', user)
  const isCurrentUserRemove = store.state.currentUser.id === user.id
  if (isCurrentUserRemove) {
    store.dispatch('closeAllDialogs')
  }
  closeDialogs()
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
</script>

<template lang="pug">
dialog.narrow.space-user-list(
  v-if="visible"
  :open="visible"
  @click.left.stop="closeDialogs"
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
)
  //- users
  template(v-if="users.length")
    section
      p {{ label }}
      .row(v-if="team && isCollaborators")
        button
          img.icon.team(src="@/assets/team.svg")
          span {{ team.name }}
          //- TODO add team dialog for user management, teamuserlist

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
    template(v-if="isCollaborators && isCommenters")
      section
        p Commenters
      section.results-section
        UserList(
          :users="commenters"
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
