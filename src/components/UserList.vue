<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import ResultsFilter from '@/components/ResultsFilter.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
import GroupUserRolePicker from '@/components/dialogs/GroupUserRolePicker.vue'
import Loader from '@/components/Loader.vue'
import GroupLabel from '@/components/GroupLabel.vue'
import utils from '@/utils.js'

const store = useStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

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
  group: Object,
  filterPlaceholder: String
})
const state = reactive({
  filter: '',
  filteredUsers: [],
  groupUserRolePickerUserId: '',
  loading: {
    removeGroupUserId: ''
  },
  error: {
    removeGroupUserId: ''
  }
})

const closeDialogs = () => {
  store.commit('userDetailsIsVisible', false)
  state.groupUserRolePickerUserId = ''
}

// users

const users = computed(() => {
  const onlineUsers = spaceStore.clients
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
  return userStore.id === user.id
}
const currentUserIsMember = computed(() => userStore.getUserIsSpaceMember)
const placeholder = computed(() => {
  return props.filterPlaceholder || 'Search'
})
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
  spaceStore.removeCollaboratorFromSpace(user)
  if (isCurrentUser(user)) {
    store.dispatch('closeAllDialogs')
  }
  closeDialogs()
}
const userIsSpaceCreator = (user) => {
  const space = store.state.currentSpace
  return user.id === space.userId
}

// group

const group = computed(() => {
  return props.group || store.getters['groups/spaceGroup']()
})
const groupUser = (user) => {
  if (!group.value) { return }
  const groupId = group.value.id
  return store.getters['groups/groupUser']({ userId: user.id, groupId })
}
const groupUserRole = (user) => {
  const role = groupUser(user).role
  return utils.capitalizeFirstLetter(role)
}
const currentUserIsGroupAdmin = computed(() => {
  return store.getters['groups/groupUserIsAdmin']({
    userId: userStore.id,
    groupId: group.value.id
  })
})

// group user role picker

watch(() => state.groupUserRolePickerUserId, (value, prevValue) => {
  if (value) {
    emit('childDialogIsVisible', true)
  } else {
    emit('childDialogIsVisible', false)
  }
})
const groupUserRolePickerIsVisibleUser = (user) => {
  return user.id === state.groupUserRolePickerUserId
}
const toggleGroupRolePickerUserId = (user) => {
  const isPrevUser = groupUserRolePickerIsVisibleUser(user)
  closeDialogs()
  if (isPrevUser) { return }
  state.groupUserRolePickerUserId = user.id
}

// remove group user

const isLoadingRemoveGroupUser = (user) => {
  return state.loading.removeGroupUserId === user.id
}
const isErrorRemoveGroupUser = (user) => {
  return state.error.removeGroupUserId === user.id
}
const shouldPreventRemoveGroupUser = (user) => {
  let shouldPrevent
  const groupUsers = props.group.users
  const groupAdmins = groupUsers.filter(user => user.role === 'admin')
  if (user.role === 'admin') {
    shouldPrevent = groupAdmins.length <= 1
  } else {
    shouldPrevent = groupUsers.length <= 1
  }
  return shouldPrevent
}
const removeGroupUser = async (event, user) => {
  state.error.removeGroupUserId = ''
  if (isLoadingRemoveGroupUser(user)) { return }
  // check if should prevent
  if (shouldPreventRemoveGroupUser(user)) {
    const position = utils.cursorPositionInViewport(event)
    store.commit('addNotificationWithPosition', { message: 'Cannot Remove', position, type: 'danger', layer: 'app', icon: 'cancel' })
    return
  }
  // remove user
  try {
    state.loading.removeGroupUserId = user.id
    const options = {
      groupId: group.value.id,
      userId: user.id
    }
    const response = await store.dispatch('api/removeGroupUser', options, { root: true })
    store.dispatch('groups/removeGroupUser', options)
  } catch (error) {
    console.error('🚒 removeGroupUser', user, error)
    state.error.removeGroupUserId = user.id
  }
  state.loading.removeGroupUserId = ''
}
</script>

<template lang="pug">
.user-list(@click.stop="closeDialogs")
  ResultsFilter(
    :items="props.users"
    @updateFilter="updateFilter"
    @updateFilteredItems="updateFilteredUsers"
    :placeholder="placeholder"
  )
  ul.results-list
    template(v-for="user in usersFiltered" :key="user.id")
      li(@click.left.stop="selectUser($event, user)" tabindex="0" v-on:keyup.stop.enter="selectUser($event, user)" :class="{ active: userIsSelected(user) }")
        .user-info
          UserLabelInline(:user="user")
        //- collaborator actions
        .row.actions-row(v-if="props.showCollaboratorActions")
          //- group user
          template(v-if="groupUser(user)")
            GroupLabel(:group="group")
          //- space creator
          template(v-else-if="userIsSpaceCreator(user)")
            span Space Creator
          //- space collaborator
          template(v-else-if="currentUserIsMember")
            button.small-button(@click.stop="removeCollaborator(user)")
              img.icon.cancel(src="@/assets/add.svg")
              span Remove

        //- group user actions
        .row.actions-row(v-if="props.showGroupUserActions")
          //- role
          .button-wrap
            button.small-button(@click.stop="toggleGroupRolePickerUserId(user)" :class="{ active: groupUserRolePickerIsVisibleUser(user) }" :disabled="!currentUserIsGroupAdmin")
              span {{ groupUserRole(user) }}
            GroupUserRolePicker(:visible="groupUserRolePickerIsVisibleUser(user)" :user="user")
          //- remove user
          .button-wrap(v-if="currentUserIsGroupAdmin || isCurrentUser(user)")
            button.small-button(@click.stop="removeGroupUser($event, user)" :class="{ active: isLoadingRemoveGroupUser(user) }")
              img.icon.cancel(src="@/assets/add.svg")
              span Remove
              Loader(:visible="isLoadingRemoveGroupUser(user)" :isSmall="true")

        //- error
        .row(v-if="isErrorRemoveGroupUser(user)")
          p.badge.danger
            span (シ_ _)シ Could not remove group user, Please try again or contact support
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
  .row.actions-row
    margin-top 5px
</style>
