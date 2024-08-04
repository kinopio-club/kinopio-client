<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import ResultsFilter from '@/components/ResultsFilter.vue'
import UserLabelInline from '@/components/UserLabelInline.vue'
const store = useStore()

const emit = defineEmits(['selectUser', 'removeUser'])

const props = defineProps({
  isClickable: Boolean,
  users: Array,
  selectedUser: Object,
  showRemoveUser: Boolean,
  showIsOnline: Boolean,
  showTeamAdmin: Boolean
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
  if (!props.showTeamAdmin) { return }
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
  if (!props.showIsOnline) {
    return props.users
  }
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
const removeUser = (user) => {
  if (!props.isClickable) { return }
  emit('removeUser', user)
}
</script>

<template lang="pug">
span
  ResultsFilter(:items="props.users" @updateFilter="updateFilter" @updateFilteredItems="updateFilteredUsers")
  ul.results-list.user-list
    template(v-for="user in usersFiltered" :key="user.id")
      li(@click.left.stop="selectUser($event, user)" :tabindex="tabIndex" v-on:keyup.stop.enter="selectUser($event, user)" :class="{ active: userIsSelected(user), 'is-not-clickable': !props.isClickable }")
        .badge.secondary.is-admin(v-if="isTeamAdmin(user)")
          span Admin
        UserLabelInline(:user="user")
        button.remove-user.small-button(v-if="props.showRemoveUser" @click.left.stop="removeUser(user)" title="Remove collaborator")
          img.icon.cancel(src="@/assets/add.svg")
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
    .remove-user
      flex-shrink 0
  .badge.is-admin
    flex-shrink 0
  .icon.cancel
    vertical-align 0.5px
</style>
