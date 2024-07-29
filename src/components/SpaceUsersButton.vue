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

const currentUser = computed(() => store.state.currentUser)
const currentSpace = computed(() => store.state.currentSpace)
const currentUserIsSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())

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
  store.commit('spaceUserListUsers', spaceUsers.value)
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

// team

const team = computed(() => currentUser.value.team)
const teamUsers = computed(() => team.value.users || [])

// users

const spaceUsers = computed(() => {
  let items
  if (props.users) {
    items = props.users
  } else {
    items = utils.clone(currentSpace.value.users)
    items = items.concat(currentSpace.value.collaborators)
  }
  items = items.filter(user => {
    const isNotCurrentUser = user.id !== currentUser.value.id
    const isNotTeamMember = !teamUsers.value.find(teamUser => teamUser.id === user.id)
    return isNotCurrentUser && isNotTeamMember
  })
  return items
})

// team label

const teamLabel = computed(() => {
  return team.value.name
})

// users label

const recentUser = computed(() => {
  return last(spaceUsers.value)
})
const isOtherCardUsers = computed(() => Boolean(otherCardUsers.value.length))
const otherCardUsers = computed(() => store.getters['currentCards/otherContributors'])
const spaceUsersLabel = computed(() => {
  let condition = spaceUsers.value.length !== 1
  const CollaboratorsString = utils.pluralize('Collaborator', condition)
  let string = `${spaceUsers.value.length} ${CollaboratorsString}`
  if (isOtherCardUsers.value) {
    condition = otherCardUsers.value.length !== 1
    const commentersString = utils.pluralize('Commenter', condition)
    string = string + `, ${otherCardUsers.value.length} ${commentersString}`
  }
  return string
})

// button count

const spaceUsersAndTeamUsers = computed(() => {
  let items = spaceUsers.value.concat(teamUsers.value)
  items = items.filter(user => {
    const isNotCurrentUser = user.id !== currentUser.value.id
    return isNotCurrentUser
  })
  return items
})

</script>

<template lang="pug">
button.space-users-button(@click.stop="toggleSpaceUserListIsVisible" :class="{ 'header-button': props.isParentSpaceUsers, active: isActive, 'translucent-button': props.isParentSpaceUsers }" ref="buttonElement")
  span.label(v-if="props.showLabel")
    template(v-if="team")
      img.icon.team(src="@/assets/team.svg")
      span {{ teamLabel }}
    template(v-if="spaceUsers.length")
      User(:user="recentUser" :isClickable="false" :hideYouLabel="true" :isSmall="true" :shouldBounceIn="props.isParentSpaceUsers")
      span {{ spaceUsersLabel }}

  span(v-else) {{ spaceUsersAndTeamUsers.length }}

</template>

<style lang="stylus">
.space-users-button
  .label
    > .user
        margin-top -1px
        margin-left 6px
      .anon-avatar
        top 3px
  &.header-button
    border-top-left-radius 0
    border-bottom-left-radius 0
</style>
