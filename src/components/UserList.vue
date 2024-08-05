<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ResultsFilter from '@/components/ResultsFilter.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
const store = useStore()

const emit = defineEmits(['selectUser', 'removeCollaborator'])

const props = defineProps({
  isClickable: Boolean,
  users: Array,
  selectedUser: Object,
  showRemoveCollaborator: Boolean,
  showTeamUserOptions: Boolean
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

// team

const spaceTeam = (user) => {
  return store.getters['currentSpace/teamByUser'](user)
}
const isTeamAdmin = (user) => {
  if (!props.showTeamUserOptions) { return }
  const team = spaceTeam(user)
  if (!team) { return }
  return team.users.find(teamUser => {
    const isUser = teamUser.id === user.id
    const isAdmin = teamUser.role === 'admin'
    return isUser && isAdmin
  })
}

// users

const users = computed(() => {
  const onlineUsers = store.state.currentSpace.clients
  let items = props.users
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
  return props.selectedUser.id === user.id
}
const removeCollaborator = (user) => {
  if (!props.isClickable) { return }
  emit('removeCollaborator', user)
}
</script>

<template lang="pug">
.user-list
  ResultsFilter(:items="props.users" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredUsers")
  ul.results-list
    template(v-for="user in usersFiltered" :key="user.id")
      li(@click.left.stop="selectUser($event, user)" :tabindex="tabIndex" v-on:keyup.stop.enter="selectUser($event, user)" :class="{ active: userIsSelected(user), 'is-not-clickable': !props.isClickable }")
        .badge.success.is-admin(v-if="isTeamAdmin(user)")
          span Admin
        UserLabelInline(:user="user")
        template(v-if="props.showRemoveCollaborator")
          button.small-button(@click.left.stop="removeCollaborator(user)" title="Remove Collaborator")
            img.icon.cancel(src="@/assets/add.svg")
        template(v-if="props.showTeamUserOptions")
          button.small-button(@click.left.stop="showTeamUserOptions(user)" title="Team User Options")
            img.icon.down-arrow(src="@/assets/down-arrow.svg")
</template>

<style lang="stylus">
.user-list
  li
    align-items flex-start !important
    button
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
    vertical-align 2px
</style>
