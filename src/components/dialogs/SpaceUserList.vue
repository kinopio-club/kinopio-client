<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import utils from '@/utils.js'
import GroupDetails from '@/components/dialogs/GroupDetails.vue'
import UserList from '@/components/UserList.vue'
import GroupLabel from '@/components/GroupLabel.vue'

import uniqBy from 'lodash-es/uniqBy'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
const state = reactive({
  dialogHeight: null,
  groupIsVisible: false
})

const visible = computed(() => globalStore.spaceUserListIsVisible)
watch(() => visible.value, (value, prevValue) => {
  state.groupIsVisible = false
  if (value) {
    updateDialogHeight()
  }
})
const updateDialogHeight = async () => {
  if (!visible.value) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const currentUser = computed(() => userStore.getUserAllState)
const currentUserCanEditSpace = computed(() => userStore.getUserCanEditSpace)
const currentSpace = computed(() => spaceStore.getSpaceAllState)

// list type

const isSpectatorsList = computed(() => globalStore.spaceUserListIsSpectators)
const isCollaboratorsList = computed(() => !isSpectatorsList.value)
const label = computed(() => {
  let string = 'Collaborators'
  if (isSpectatorsList.value) {
    string = 'Spectators'
  }
  return string
})

// group

const spaceGroup = computed(() => groupStore.getCurrentSpaceGroup)
const toggleGroupIsVisible = () => {
  const value = !state.groupIsVisible
  closeDialogs()
  state.groupIsVisible = value
}

// users

// based on SpaceUsersButton.spaceUsers
const users = computed(() => {
  let items
  if (isSpectatorsList.value) {
    items = currentSpace.value.spectators
  } else {
    const groupUsers = groupStore.getGroupUsersWhoAddedCards
    items = utils.clone(currentSpace.value.users)
    items = items.concat(currentSpace.value.collaborators)
    items = items.concat(groupUsers)
  }
  items = items.filter(item => Boolean(item))
  items = uniqBy(items, 'id')
  return items
})

// commenters

const commenters = computed(() => cardStore.getCardCommenters)

// handle userlist events

const selectedUser = computed(() => {
  const userDetailsIsVisible = globalStore.userDetailsIsVisible
  if (!userDetailsIsVisible) { return }
  return globalStore.userDetailsUser
})
const toggleUserDetails = (event, user) => {
  closeDialogs()
  showUserDetails(event, user)
}
const showUserDetails = (event, user) => {
  const shouldHideUserDetails = user.id === globalStore.userDetailsUser.id
  if (shouldHideUserDetails) {
    closeDialogs()
    globalStore.userDetailsUser = {}
    return
  }
  const element = event.target
  const options = { element, offsetX: 0, shouldIgnoreZoom: true }
  const position = utils.childDialogPositionFromParent(options)
  globalStore.userDetailsUser = user
  globalStore.userDetailsPosition = position
  globalStore.userDetailsIsVisible = true
}
const closeDialogs = () => {
  globalStore.userDetailsIsVisible = false
  state.groupIsVisible = false
}
</script>

<template lang="pug">
dialog.narrow.space-user-list(
  v-if="visible"
  :open="visible"
  @click.left.stop="closeDialogs"
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
  :class="{'child-is-visible': state.groupIsVisible }"
)
  section
    p {{ label }}
    .button-wrap(v-if="spaceGroup")
      button(@click.stop="toggleGroupIsVisible" :class="{ active: state.groupIsVisible }")
        GroupLabel(:group="spaceGroup" :showName="true")
      GroupDetails(:visible="state.groupIsVisible" :group="spaceGroup")
  //- users
  template(v-if="users.length")
    UserList(
      :users="users"
      :selectedUser="selectedUser"
      @selectUser="toggleUserDetails"
      :showCollaboratorActions="currentUserCanEditSpace"
    )
  //- commenters
  section(v-if="isCollaboratorsList && commenters.length")
    p Commenters
    UserList(
      :users="commenters"
      :selectedUser="selectedUser"
      @selectUser="toggleUserDetails"
    )
</template>

<style lang="stylus">
dialog.space-user-list
  overflow auto
  left initial
  right 16px
  top 20px
  &.child-is-visible
    overflow initial
  dialog.group-details
    left -45px
</style>
