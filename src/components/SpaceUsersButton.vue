<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import User from '@/components/User.vue'
import utils from '@/utils.js'
import GroupLabel from '@/components/GroupLabel.vue'

import uniqBy from 'lodash-es/uniqBy'
import last from 'lodash-es/last'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

const buttonElement = ref(null)

const props = defineProps({
  showLabel: Boolean,
  isParentSpaceUsers: Boolean,
  isSpectators: Boolean,
  users: Array
})

const currentUser = computed(() => userStore.getUserAllState)
const currentSpace = computed(() => spaceStore.getSpaceAllState)
const currentUserIsSpaceMember = computed(() => userStore.getUserIsSpaceMember)

const spaceUserListIsVisible = computed(() => globalStore.spaceUserListIsVisible)
const dialogIsVisible = computed(() => {
  const isVisible = spaceUserListIsVisible.value
  if (props.isSpectators) {
    return isVisible && globalStore.spaceUserListIsSpectators
  } else {
    return isVisible && !globalStore.spaceUserListIsSpectators
  }
})
const toggleSpaceUserListIsVisible = () => {
  const value = dialogIsVisible.value
  globalStore.closeAllDialogs()
  globalStore.spaceUserListIsVisible = !value
  globalStore.spaceUserListIsSpectators = props.isSpectators
}
const isActive = computed(() => {
  const isVisible = spaceUserListIsVisible.value
  if (props.isSpectators) {
    return isVisible && globalStore.spaceUserListIsSpectators
  } else {
    return isVisible && !globalStore.spaceUserListIsSpectators
  }
})

// group

const group = computed(() => groupStore.getCurrentSpaceGroup)

// users

const spaceUsers = computed(() => {
  let items
  if (props.users) {
    items = props.users
  } else {
    const groupUsers = groupStore.getGroupUsersWhoAddedCards
    items = utils.clone(currentSpace.value.users)
    items = items.concat(currentSpace.value.collaborators)
    items = items.concat(groupUsers)
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
const commenters = computed(() => cardStore.getCardCommenters) // TODO move to userStore
const spaceUsersLabel = computed(() => {
  const condition = spaceUsers.value.length !== 1
  let collaboratorsString = utils.pluralize('Collaborator', condition)
  if (spaceUsers.value.length === 0) {
    collaboratorsString = 'Other Collaborators'
  }
  let string = `${spaceUsers.value.length} ${collaboratorsString}`
  if (isCommenters.value) {
    string = string + ` + ${commenters.value.length}`
  }
  return string
})
const isTranslucentButton = computed(() => {
  const shouldIncreaseUIContrast = userStore.shouldIncreaseUIContrast
  return props.isParentSpaceUsers && !shouldIncreaseUIContrast
})

</script>

<template lang="pug">
button.space-users-button(@click.stop="toggleSpaceUserListIsVisible" :class="{ 'header-button': props.isParentSpaceUsers, active: isActive, 'translucent-button': isTranslucentButton }" ref="buttonElement")
  span.label(v-if="props.showLabel")
    template(v-if="group")
      GroupLabel(:group="group")
    template(v-if="spaceUsers.length")
      User(:user="recentUser" :isClickable="false" :hideYouLabel="true" :isSmall="true" :shouldBounceIn="props.isParentSpaceUsers")
    span {{ spaceUsersLabel }}

  span(v-else) {{ spaceUsers.length }}

</template>

<style lang="stylus">
.space-users-button
  max-width 100%
  .label
    > .user
        margin-top -1px
    > span + .user
        // margin-left 6px
      .anon-avatar
        top 3px
  &.header-button
    border-top-left-radius 0
    border-bottom-left-radius 0
</style>
