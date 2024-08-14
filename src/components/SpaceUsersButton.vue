<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import User from '@/components/User.vue'
import utils from '@/utils.js'
import TeamLabel from '@/components/TeamLabel.vue'

import uniqBy from 'lodash-es/uniqBy'
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

const team = computed(() => store.getters['teams/bySpace'](currentSpace.value))

// users

const spaceUsers = computed(() => {
  let items
  if (props.users) {
    items = props.users
  } else {
    const teamUsers = store.getters['currentCards/teamUsersWhoAddedCards']
    items = utils.clone(currentSpace.value.users)
    items = items.concat(currentSpace.value.collaborators)
    items = items.concat(teamUsers)
    // TODO add notifications: notify teamUsers on changes. https://kinopio.club/En9p7INBEpSAhNwFVIwgZ/VelgpXzc5h8Cl1m4RJ41i
  }
  items = items.filter(item => Boolean(item))
  items = items.filter(user => user.id !== currentUser.value.id)
  items = uniqBy(items, 'id')
  return items
})

// users label

const recentUser = computed(() => {
  return last(spaceUsers.value)
})
const isCommenters = computed(() => Boolean(commenters.value.length))
const commenters = computed(() => store.getters['currentCards/commenters'])
const spaceUsersLabel = computed(() => {
  let condition = spaceUsers.value.length !== 1
  const CollaboratorsString = utils.pluralize('Collaborator', condition)
  let string = `${spaceUsers.value.length} ${CollaboratorsString}`
  if (isCommenters.value) {
    condition = commenters.value.length !== 1
    const commentersString = utils.pluralize('Commenter', condition)
    string = string + `, ${commenters.value.length} ${commentersString}`
  }
  return string
})

</script>

<template lang="pug">
button.space-users-button(@click.stop="toggleSpaceUserListIsVisible" :class="{ 'header-button': props.isParentSpaceUsers, active: isActive, 'translucent-button': props.isParentSpaceUsers }" ref="buttonElement")
  span.label(v-if="props.showLabel")
    template(v-if="team")
      TeamLabel(:team="team" :showIcon="true")
    template(v-if="spaceUsers.length")
      User(:user="recentUser" :isClickable="false" :hideYouLabel="true" :isSmall="true" :shouldBounceIn="props.isParentSpaceUsers")
      span {{ spaceUsersLabel }}

  span(v-else) {{ spaceUsers.length }}

</template>

<style lang="stylus">
.space-users-button
  .label
    > .user
        margin-top -1px
    > span + .user
        margin-left 6px
      .anon-avatar
        top 3px
  &.header-button
    border-top-left-radius 0
    border-bottom-left-radius 0
  .icon.team
    margin-right 6px
</style>
