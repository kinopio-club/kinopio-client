<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import User from '@/components/User.vue'
import utils from '@/utils.js'

import last from 'lodash-es/last'

const store = useStore()

const buttonElement = ref(null)

const props = defineProps({
  showLabel: Boolean,
  isParentSpaceUsers: Boolean,
  isSpectators: Boolean,
  users: Array
})

const spaceUserListIsVisible = computed(() => store.state.spaceUserListIsVisible)
const dialogIsVisible = computed(() => {
  const isVisible = spaceUserListIsVisible.value
  if (props.isSpectators) {
    return isVisible && store.state.spaceUserListIsSpectators
  } else {
    return isVisible && !store.state.spaceUserListIsSpectators
  }
})
const toggleSpaceUserListIsVisible = () => {
  const value = dialogIsVisible.value
  store.commit('closeAllDialogs')
  store.commit('spaceUserListIsVisible', !value)
  store.commit('spaceUserListUsers', users.value)
  store.commit('spaceUserListIsSpectators', props.isSpectators)
}
const isActive = computed(() => {
  const isVisible = spaceUserListIsVisible.value
  if (props.isSpectators) {
    return isVisible && store.state.spaceUserListIsSpectators
  } else {
    return isVisible && !store.state.spaceUserListIsSpectators
  }
})

// users

const currentSpace = computed(() => store.state.currentSpace)
const currentUserIsSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())

const users = computed(() => {
  let items
  const currentUser = store.state.currentUser
  if (props.users) {
    items = props.users
  } else {
    items = utils.clone(currentSpace.value.users)
    items = items.concat(currentSpace.value.collaborators)
  }
  items = items.filter(user => user.id !== currentUser.id)
  return items
})

// button

const recentUser = computed(() => {
  return last(users.value)
})
const isOtherCardUsers = computed(() => Boolean(otherCardUsers.value.length))
const otherCardUsers = computed(() => store.getters['currentCards/otherContributors'])
const label = computed(() => {
  let condition = users.value.length !== 1
  const CollaboratorsString = utils.pluralize('Collaborator', condition)
  let string = `${users.value.length} ${CollaboratorsString}`
  if (isOtherCardUsers.value) {
    condition = otherCardUsers.value.length !== 1
    const othersString = utils.pluralize('Other', condition)
    string = string + `, ${otherCardUsers.value.length} ${othersString}`
  }
  return string
})

</script>

<template lang="pug">
button.space-users-button(v-if="users.length" @click.stop="toggleSpaceUserListIsVisible" :class="{ 'header-button': props.isParentSpaceUsers, active: isActive, 'translucent-button': props.isParentSpaceUsers }" ref="buttonElement")
  User(:user="recentUser" :isClickable="false" :hideYouLabel="true" :isSmall="true" :shouldBounceIn="props.isParentSpaceUsers")
  span(v-if="props.showLabel") {{ label }}
  span(v-else) {{ users.length }}

</template>

<style lang="stylus">
.space-users-button
  > .user.is-small
    .user-avatar
      margin-top -3px
    .anon-avatar
      top 3px
  &.header-button
    border-top-left-radius 0
    border-bottom-left-radius 0

</style>
