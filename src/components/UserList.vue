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

const emit = defineEmits(['selectUser', 'removeCollaborator'])

const props = defineProps({
  isClickable: Boolean,
  users: Array,
  selectedUser: Object,
  showRemoveCollaborator: Boolean,
  currentUserIsTeamAdmin: Boolean
})
const state = reactive({
  filter: '',
  filteredUsers: []
})

const tabIndex = computed(() => {
  if (props.isClickable) {
    return '0'
  } else {
    return '-1'
  }
})
const closeDialogs = () => {
  store.commit('teamUserDetailsIsVisible', false)
  store.commit('userDetailsIsVisible', false)
}

// team

const spaceTeams = (user) => {
  return store.getters['teams/bySpace'](user)
}
const isTeamAdmin = (user) => {
  if (!props.currentUserIsTeamAdmin) { return }
  return store.getters('teams/teamUserIsAdmin', { userId: user.id })
}

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

// handle events

const selectUser = (event, user) => {
  if (!props.isClickable) { return }
  emit('selectUser', event, user)
}
const userIsSelected = (user) => {
  if (!props.isClickable) { return }
  if (!props.selectedUser) { return }
  const userId = props.selectedUser.id || store.state.userDetailsUser.id
  return userId === user.id
}
const removeCollaborator = (user) => {
  if (!props.isClickable) { return }
  emit('removeCollaborator', user)
}

// team user details

const toggleTeamUserDetails = (event, user) => {
  const shouldHideUserDetails = user.id === store.state.userDetailsUser.id
  if (shouldHideUserDetails && store.state.teamUserDetailsIsVisible) {
    closeDialogs()
    store.commit('userDetailsUser', {})
    return
  }
  closeDialogs()
  const team = spaceTeams(user)
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
      li(@click.left.stop="selectUser($event, user)" :tabindex="tabIndex" v-on:keyup.stop.enter="selectUser($event, user)" :class="{ active: userIsSelected(user), 'is-not-clickable': !props.isClickable }")
        .badge.danger.is-admin(v-if="isTeamAdmin(user)")
          //- img.icon.key(src="@/assets/key.svg")
          span Admin
        UserLabelInline(:user="user")
        template(v-if="props.showRemoveCollaborator")
          button.small-button.danger(@click.left.stop="removeCollaborator(user)" title="Remove Collaborator")
            img.icon.cancel(src="@/assets/add.svg")
        template(v-if="props.currentUserIsTeamAdmin")
          .button-wrap
            button.small-button(@click.left.stop="toggleTeamUserDetails($event, user)" title="Team User Options" :class="{active: teamUserDetailsIsVisibleForUser(user)}")
              img.icon.down-arrow(src="@/assets/down-arrow.svg")
</template>

<style lang="stylus">
.user-list
  li
    align-items flex-start !important
    > .button-wrap,
    > button
      margin-left auto
    .name
      margin-right 0
      display inline-block
    &.is-not-clickable
      cursor auto
      padding-left 0
      padding-right 0
      &:hover,
      &:active,
      &:focus
        box-shadow none
        background-color transparent
        outline none
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
</style>
