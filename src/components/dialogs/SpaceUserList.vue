<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'
import GroupDetails from '@/components/dialogs/GroupDetails.vue'
import UserList from '@/components/UserList.vue'
import GroupLabel from '@/components/GroupLabel.vue'

import uniqBy from 'lodash-es/uniqBy'

const store = useStore()
const cardStore = useCardStore()
const userStore = useUserStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
const state = reactive({
  dialogHeight: null,
  groupIsVisible: false
})

const visible = computed(() => store.state.spaceUserListIsVisible)
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

const currentUser = computed(() => store.state.currentUser)
const currentUserCanEditSpace = computed(() => userStore.getUserCanEditSpace())
const currentSpace = computed(() => store.state.currentSpace)

// list type

const isSpectatorsList = computed(() => store.state.spaceUserListIsSpectators)
const isCollaboratorsList = computed(() => !isSpectatorsList.value)
const label = computed(() => {
  let string = 'Collaborators'
  if (isSpectatorsList.value) {
    string = 'Spectators'
  }
  return string
})

// group

const spaceGroup = computed(() => store.getters['groups/spaceGroup']())
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
    const groupUsers = store.getters['groups/groupUsersWhoAddedCards']
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
  const userDetailsIsVisible = store.state.userDetailsIsVisible
  if (!userDetailsIsVisible) { return }
  return store.state.userDetailsUser
})
const toggleUserDetails = (event, user) => {
  closeDialogs()
  showUserDetails(event, user)
}
const showUserDetails = (event, user) => {
  const shouldHideUserDetails = user.id === store.state.userDetailsUser.id
  if (shouldHideUserDetails) {
    closeDialogs()
    store.commit('userDetailsUser', {})
    return
  }
  const element = event.target
  const options = { element, offsetX: 0, shouldIgnoreZoom: true }
  const position = utils.childDialogPositionFromParent(options)
  store.commit('userDetailsUser', user)
  store.commit('userDetailsPosition', position)
  store.commit('userDetailsIsVisible', true)
}
const closeDialogs = () => {
  store.commit('userDetailsIsVisible', false)
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
