<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ResultsFilter from '@/components/ResultsFilter.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import utils from '@/utils.js'
const store = useStore()

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeDialogs()
    }
  })
})

const emit = defineEmits(['selectUser'])

const props = defineProps({
  users: Array,
  selectedUser: Object,
  showCollaboratorActions: Boolean,
  showTeamUserActions: Boolean
  // showRemoveCollaborator: Boolean,
})
const state = reactive({
  filter: '',
  filteredUsers: []
})

const closeDialogs = () => {
  store.commit('teamUserDetailsIsVisible', false)
  store.commit('userDetailsIsVisible', false)
}
const actionsSectionIsVisible = computed(() => {
  return props.showCollaboratorActions || props.showTeamUserActions
})

// users

const users = computed(() => {
  const onlineUsers = store.state.currentSpace.clients
  let items = utils.clone(props.users)
  items = items.map(user => {
    const isOnline = onlineUsers.find(onlineUser => onlineUser.id === user.id)
    if (isOnline) {
      user.isOnline = true
    }
    return user
  })
  return items
})
const updateFilteredUsers = (users) => {
  state.filteredUsers = users
}
const updateFilter = (filter) => {
  state.filter = filter
}
const usersFiltered = computed(() => {
  let items
  if (state.filter) {
    items = state.filteredUsers
  } else {
    items = users.value
  }
  return items
})
const isCurrentUser = (user) => {
  return store.state.currentUser.id === user.id
}

// handle events

const selectUser = (event, user) => {
  emit('selectUser', event, user)
}
const userIsSelected = (user) => {
  if (!props.selectedUser) { return }
  const userId = props.selectedUser.id || store.state.userDetailsUser.id
  return userId === user.id
}

// space

const removeCollaborator = async (user) => {
  store.dispatch('currentSpace/removeCollaboratorFromSpace', user)
  if (isCurrentUser(user)) {
    store.dispatch('closeAllDialogs')
  }
  closeDialogs()
}
const userIsSpaceCreator = (user) => {
  const space = store.state.currentSpace
  return user.id === space.userId
}

// team

const currentSpaceTeam = computed(() => store.getters['teams/bySpace']())
const teamUser = (user) => {
  if (!currentSpaceTeam.value) { return }
  const teamId = currentSpaceTeam.value.id
  return store.getters['teams/teamUser']({ userId: user.id, teamId })
}
const currentUserIsTeamAdmin = computed(() => {
  // if (!currentSpaceTeam.value) { return }
  return store.getters['teams/teamUserIsAdmin']({
    userId: store.state.currentUser.id,
    teamId: currentSpaceTeam.value.id
  })
})

// const isTeamAdmin = (user) => {
//   // if (!currentUserIsTeamAdmin.value) { return }
//   return store.getters('teams/teamUserIsAdmin', { userId: user.id })
// }

const toggleTeamUserDetails = (event, user) => {
  const shouldHideUserDetails = user.id === store.state.userDetailsUser.id
  if (shouldHideUserDetails && store.state.teamUserDetailsIsVisible) {
    closeDialogs()
    store.commit('userDetailsUser', {})
    return
  }
  closeDialogs()
  const team = currentSpaceTeam.value
  store.commit('teamUserDetailsIsVisible', true)
  store.commit('teamUserDetailsTeamId', team.id)
  store.commit('teamUserDetailsUserId', user.id)
  let element = event.target
  let options = { element, offsetX: 0, shouldIgnoreZoom: true }
  let position = utils.childDialogPositionFromParent(options)
  store.commit('userDetailsPosition', position)
}
const teamUserDetailsIsVisibleForUser = (user) => {
  const isUser = user.id === store.state.userDetailsUser.id
  return store.state.teamUserDetailsIsVisible && isUser
}

</script>

<template lang="pug">
.user-list
  ResultsFilter(:items="props.users" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredUsers")
  ul.results-list
    template(v-for="user in usersFiltered" :key="user.id")
      li(@click.left.stop="selectUser($event, user)" tabindex="0" v-on:keyup.stop.enter="selectUser($event, user)" :class="{ active: userIsSelected(user) }")
        .user-info(:class="{'actions-section-is-visible': actionsSectionIsVisible }")
          //- admin badge
          //- .badge.danger.is-admin(v-if="isTeamAdmin(user)")
          //-   //- img.icon.key(src="@/assets/key.svg")
          //-   span Admin
          //- todo member?

          UserLabelInline(:user="user")

        //- collaborator actions
        section.subsection(v-if="props.showCollaboratorActions")
          //- team user
          template(v-if="teamUser(user)")
            .team-color(:style="{ background: currentSpaceTeam.color }")
            img.icon.team(src="@/assets/team.svg")
            span {{ currentSpaceTeam.name }}
          //- space creator
          template(v-else-if="userIsSpaceCreator(user)")
            span Space Creator
          //- space collaborator
          template(v-else)
            button.small-button(@click.stop="removeCollaborator(user)")
              img.icon.cancel(src="@/assets/add.svg")

              span(v-if="isCurrentUser(user)") Leave Space
              span(v-else) Remove Collaborator

              //- Leave Space

        //- template(v-if="currentUserIsTeamAdmin")
        //-   .button-wrap
        //-     button.small-button(@click.left.stop="toggleTeamUserDetails($event, user)" title="Team User Options" :class="{active: teamUserDetailsIsVisibleForUser(user)}")
        //-       img.icon.down-arrow(src="@/assets/down-arrow.svg")
</template>

<style lang="stylus">
.user-list
  li
    align-items flex-start !important
    flex-direction column
    > .button-wrap,
    > button
      margin-left auto
    .name
      margin-right 0
      display inline-block
    .user-label-inline
      pointer-events none
  .badge.is-admin,
  .small-button
    flex-shrink 0
  .icon.cancel
    vertical-align 0.5px

  .icon.down-arrow
    padding 0 2px
    vertical-align 3px

  .subsection
    width 100%
    border-top-left-radius 0
  .actions-section-is-visible
    .user-label-inline
      border-bottom-left-radius 0
      border-bottom-right-radius 0
</style>
