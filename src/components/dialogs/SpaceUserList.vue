<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import TeamDetails from '@/components/dialogs/TeamDetails.vue'
import UserList from '@/components/UserList.vue'
import TeamLabel from '@/components/TeamLabel.vue'

import uniqBy from 'lodash-es/uniqBy'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
const state = reactive({
  dialogHeight: null,
  teamIsVisible: false
})

const visible = computed(() => store.state.spaceUserListIsVisible)
watch(() => visible.value, (value, prevValue) => {
  state.teamIsVisible = false
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

const isSpectatorsList = computed(() => store.state.spaceUserListIsSpectators)
const isCollaboratorsList = computed(() => !isSpectatorsList.value)
const label = computed(() => {
  let string = 'Collaborators'
  if (isSpectatorsList.value) {
    string = 'Spectators'
  }
  return string
})

// team

const spaceTeam = computed(() => store.getters['teams/spaceTeam']())
const toggleTeamIsVisible = () => {
  const value = !state.teamIsVisible
  closeDialogs()
  state.teamIsVisible = value
}

// users

// based on SpaceUsersButton.spaceUsers
const users = computed(() => {
  let items
  if (isSpectatorsList.value) {
    items = currentSpace.value.spectators
  } else {
    const teamUsers = store.getters['currentCards/teamUsersWhoAddedCards']
    items = utils.clone(currentSpace.value.users)
    items = items.concat(currentSpace.value.collaborators)
    items = items.concat(teamUsers)
  }
  items = items.filter(item => Boolean(item))
  items = uniqBy(items, 'id')
  return items
})

// commenters

const commenters = computed(() => utils.clone(store.getters['currentCards/commenters']))

// handle userlist events

const selectedUser = computed(() => {
  const userDetailsIsVisible = store.state.userDetailsIsVisible
  if (!userDetailsIsVisible) { return }
  return store.state.userDetailsUser
})
const toggleUserDetails = (event, user) => {
  closeDialogs()
  showUserDetails(event, user)
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
  state.teamIsVisible = false
}
</script>

<template lang="pug">
dialog.space-user-list(
  v-if="visible"
  :open="visible"
  @click.left.stop="closeDialogs"
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
  :class="{'child-is-visible': state.teamIsVisible }"
)
  section
    p {{ label }}
    .button-wrap(v-if="spaceTeam")
      button(@click.stop="toggleTeamIsVisible" :class="{ active: state.teamIsVisible }")
        TeamLabel(:team="spaceTeam" :showName="true")
      TeamDetails(:visible="state.teamIsVisible" :team="spaceTeam")

  template(v-if="users.length")
    //- users
    section.results-section
      UserList(
        :users="users"
        :selectedUser="selectedUser"
        @selectUser="toggleUserDetails"
        :showCollaboratorActions="currentUserCanEditSpace"
      )

    //- commenters
    template(v-if="isCollaboratorsList && commenters.length")
      section
        p Commenters
      section.results-section
        UserList(
          :users="commenters"
          :selectedUser="selectedUser"
          @selectUser="toggleUserDetails"
        )
</template>

<style lang="stylus">
dialog.space-user-list
  overflow auto
  left initial
  right 16px
  top 20px
  &.child-is-visible
    overflow initial
  dialog.team-details
    left -45px
</style>
