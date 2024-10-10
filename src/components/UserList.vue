<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ResultsFilter from '@/components/ResultsFilter.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import GroupUserRolePicker from '@/components/dialogs/GroupUserRolePicker.vue'
import Loader from '@/components/Loader.vue'
import GroupLabel from '@/components/GroupLabel.vue'
import utils from '@/utils.js'
const store = useStore()

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeDialogs()
    }
  })
})

const emit = defineEmits(['selectUser', 'childDialogIsVisible'])

const props = defineProps({
  users: Array,
  selectedUser: Object,
  showCollaboratorActions: Boolean,
  showGroupUserActions: Boolean,
  team: Object
})
const state = reactive({
  filter: '',
  filteredUsers: [],
  teamUserRolePickerUserId: '',
  loading: {
    removeGroupUserId: ''
  },
  error: {
    removeGroupUserId: ''
  }
})

const closeDialogs = () => {
  store.commit('userDetailsIsVisible', false)
  state.teamUserRolePickerUserId = ''
}
const actionsSectionIsVisible = computed(() => {
  return props.showCollaboratorActions || props.showGroupUserActions
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
const currentUserIsMember = computed(() => store.getters['currentUser/isSpaceMember']())

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

const team = computed(() => {
  return props.team || store.getters['teams/spaceGroup']()
})
const teamUser = (user) => {
  if (!team.value) { return }
  const teamId = team.value.id
  return store.getters['teams/teamUser']({ userId: user.id, teamId })
}
const teamUserRole = (user) => {
  const role = teamUser(user).role
  return utils.capitalizeFirstLetter(role)
}
const currentUserIsGroupAdmin = computed(() => {
  return store.getters['teams/teamUserIsAdmin']({
    userId: store.state.currentUser.id,
    teamId: team.value.id
  })
})

// team user role picker

watch(() => state.teamUserRolePickerUserId, (value, prevValue) => {
  if (value) {
    emit('childDialogIsVisible', true)
  } else {
    emit('childDialogIsVisible', false)
  }
})
const teamUserRolePickerIsVisibleUser = (user) => {
  return user.id === state.teamUserRolePickerUserId
}
const toggleGroupRolePickerUserId = (user) => {
  const isPrevUser = teamUserRolePickerIsVisibleUser(user)
  closeDialogs()
  if (isPrevUser) { return }
  state.teamUserRolePickerUserId = user.id
}

// remove team user

const isLoadingRemoveGroupUser = (user) => {
  return state.loading.removeGroupUserId === user.id
}
const isErrorRemoveGroupUser = (user) => {
  return state.error.removeGroupUserId === user.id
}
const removeGroupUser = async (user) => {
  state.error.removeGroupUserId = ''
  console.log('user', user.id, state.loading.removeGroupUserId)
  if (isLoadingRemoveGroupUser(user)) { return }
  try {
    state.loading.removeGroupUserId = user.id
    const options = {
      teamId: team.value.id,
      userId: user.id
    }
    const response = await store.dispatch('api/removeGroupUser', options, { root: true })
    store.dispatch('teams/removeGroupUser', options)
  } catch (error) {
    console.error('🚒 removeGroupUser', user, error)
    state.error.removeGroupUserId = user.id
  }
  state.loading.removeGroupUserId = ''
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
            GroupLabel(:team="team")
          //- space creator
          template(v-else-if="userIsSpaceCreator(user)")
            span Space Creator
          //- space collaborator
          template(v-else-if="currentUserIsMember")
            button.small-button(@click.stop="removeCollaborator(user)")
              img.icon.cancel(src="@/assets/add.svg")
              span(v-if="isCurrentUser(user)") Leave Space
              span(v-else) Remove Collaborator

        //- team user actions
        section.subsection(v-if="props.showGroupUserActions")
          //- admin actions
          template(v-if="currentUserIsGroupAdmin")
            .row
              img.icon.mail(src="@/assets/mail.svg")
              span {{ teamUser(user).email }}
            .row
              .button-wrap
                button.small-button(@click.stop="toggleGroupRolePickerUserId(user)" :class="{ active: teamUserRolePickerIsVisibleUser(user) }")
                  span {{ teamUserRole(user) }}
                GroupUserRolePicker(:visible="teamUserRolePickerIsVisibleUser(user)" :user="user")
              .button-wrap
                button.small-button(@click.stop="removeGroupUser(user)" :class="{ active: isLoadingRemoveGroupUser(user) }")
                  img.icon.cancel(src="@/assets/add.svg")
                  span Remove from Group
                  Loader(:visible="isLoadingRemoveGroupUser(user)" :isSmall="true")
            .row(v-if="isErrorRemoveGroupUser(user)")
              p.badge.danger
                span (シ_ _)シ Could not remove team user, Please try again or contact support
          //- non-admin actions
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
