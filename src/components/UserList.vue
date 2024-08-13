<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ResultsFilter from '@/components/ResultsFilter.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import TeamUserRolePicker from '@/components/dialogs/TeamUserRolePicker.vue'
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
})
const state = reactive({
  filter: '',
  filteredUsers: [],
  teamUserRolePickerUserId: ''
})

const closeDialogs = () => {
  store.commit('userDetailsIsVisible', false)
  state.teamUserRolePickerUserId = ''
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
const teamUserRole = (user) => {
  const role = teamUser(user).role
  return utils.capitalizeFirstLetter(role)
}
const currentUserIsTeamAdmin = computed(() => {
  return store.getters['teams/teamUserIsAdmin']({
    userId: store.state.currentUser.id,
    teamId: currentSpaceTeam.value.id
  })
})

// team user role picker

const teamUserRolePickerIsVisibleUser = (user) => {
  return user.id === state.teamUserRolePickerUserId
}
const toggleTeamRolePickerUserId = (user) => {
  const isPrevUser = teamUserRolePickerIsVisibleUser(user)
  closeDialogs()
  if (isPrevUser) { return }
  state.teamUserRolePickerUserId = user.id
}

</script>

<template lang="pug">
.user-list(@click.stop="closeDialogs")
  ResultsFilter(:items="props.users" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredUsers")
  ul.results-list
    template(v-for="user in usersFiltered" :key="user.id")
      li(@click.left.stop="selectUser($event, user)" tabindex="0" v-on:keyup.stop.enter="selectUser($event, user)" :class="{ active: userIsSelected(user) }")
        .user-info(:class="{'actions-section-is-visible': actionsSectionIsVisible }")
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
        //- team user actions
        section.subsection(v-if="props.showTeamUserActions")
          //- admin actions
          template(v-if="currentUserIsTeamAdmin")
            .row
              img.icon.mail(src="@/assets/mail.svg")
              span {{ teamUser(user).email }}
            .row
              .button-wrap
                button.small-button(@click.stop="toggleTeamRolePickerUserId(user)" :class="{ active: teamUserRolePickerIsVisibleUser(user) }")
                  span {{ teamUserRole(user) }}
                TeamUserRolePicker(:visible="teamUserRolePickerIsVisibleUser(user)" :user="user")
              .button-wrap
                button.small-button(@click.stop="removeTeamUser(user)")
                  img.icon.cancel(src="@/assets/add.svg")
                  span Remove from Team
          //- member only
          template(v-else)
            span {{ teamUserRole(user) }}
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
  .small-button
    flex-shrink 0
  .icon.cancel
    vertical-align 0.5px
  .subsection
    width 100%
    border-top-left-radius 0
  .actions-section-is-visible
    .user-label-inline
      border-bottom-left-radius 0
      border-bottom-right-radius 0
</style>
