<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import UserList from '@/components/UserList.vue'
import User from '@/components/User.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import GroupLabel from '@/components/GroupLabel.vue'
import utils from '@/utils.js'
import Loader from '@/components/Loader.vue'
import InviteToGroup from '@/components/InviteToGroup.vue'
import GroupDetailsInfo from '@/components/GroupDetailsInfo.vue'

import uniqBy from 'lodash-es/uniqBy'

const store = useStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean,
  group: Object
})
const state = reactive({
  dialogHeight: null,
  childDialogIsVisible: false,
  removeGroupConfirmationIsVisible: false,
  loading: {
    deleteGroupPermanent: false
  },
  unknownServerError: false
})

watch(() => props.visible, (value, prevValue) => {
  closeDialogs()
  if (value) {
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const closeDialogs = () => {
  store.commit('userDetailsIsVisible', false)
  store.commit('triggerCloseChildDialogs')
}
const childDialogIsVisible = computed(() => {
  return state.childDialogIsVisible
})
const updateChildDialogIsVisible = (value) => {
  state.childDialogIsVisible = value
}
const currentUser = computed(() => userStore.getUserAllState)

// group

const groupUser = computed(() => {
  return groupStore.getGroupUser({
    userId: userStore.id,
    groupId: props.group.id
  })
})
const isGroupUser = computed(() => Boolean(groupUser.value))
const currentUserIsGroupAdmin = computed(() => {
  return groupStore.getGroupUserIsAdmin({
    userId: userStore.id,
    groupId: props.group.id
  })
})
const updateGroup = (update) => {
  update.id = props.group.id
  store.dispatch('groups/update', update)
}

// select user

const groupUsers = computed(() => {
  let users = utils.clone(props.group.users)
  users = users.map(user => {
    if (user.id === currentUser.value.id) {
      user.name = currentUser.value.name
      user.color = currentUser.value.color
      user.email = currentUser.value.email
    }
    return user
  })
  users = uniqBy(users, 'id')
  return users
})
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
  const userListBadgeOffsetY = 60
  position.y = position.y - userListBadgeOffsetY
  store.commit('userDetailsUser', user)
  store.commit('userDetailsPosition', position)
  store.commit('userDetailsIsVisible', true)
}

// remove group

const toggleRemoveGroupConfirmationIsVisible = () => {
  state.removeGroupConfirmationIsVisible = !state.removeGroupConfirmationIsVisible
  state.unknownServerError = false
}
const deleteGroupPermanent = async () => {
  state.loading.deleteGroupPermanent = true
  try {
    await store.dispatch('groups/remove', props.group)
    store.commit('triggerCloseGroupDetailsDialog')
  } catch (error) {
    state.removeGroupConfirmationIsVisible = false
    state.unknownServerError = true
  }
  state.loading.deleteGroupPermanent = false
}
</script>

<template lang="pug">
dialog.group-details(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" :class="{ 'child-dialog-is-visible': childDialogIsVisible }")
  //- group info
  section
    .row
      template(v-if="currentUserIsGroupAdmin")
        GroupDetailsInfo(:group="props.group" @updateGroup="updateGroup" @childDialogIsVisible="updateChildDialogIsVisible")
      template(v-else)
        GroupLabel(:group="props.group" :showName="true")
  InviteToGroup(:visible="isGroupUser" :group="props.group" @closeDialogs="closeDialogs")

  UserList(
    :users="groupUsers"
    :selectedUser="selectedUser"
    @selectUser="toggleUserDetails"
    :isClickable="true"
    :showGroupUserActions="true"
    :group="props.group"
    @childDialogIsVisible="updateChildDialogIsVisible"
  )
  section(v-if="currentUserIsGroupAdmin")
    .row(v-if="!state.removeGroupConfirmationIsVisible")
      button.danger(@click="toggleRemoveGroupConfirmationIsVisible")
        img.icon(src="@/assets/remove.svg")
        span Remove Group
    template(v-if="state.removeGroupConfirmationIsVisible")
      p
        span.badge.danger Permanently delete group?
      p
        span All spaces in this group will revert back to their original owners.
      .segmented-buttons
        button(@click.left="toggleRemoveGroupConfirmationIsVisible")
          img.icon.cancel(src="@/assets/add.svg")
          span Cancel
        button.danger(@click.left="deleteGroupPermanent")
          img.icon(src="@/assets/remove.svg")
          span Delete Group
          Loader(:visible="state.loading.deleteGroupPermanent")
    .row(v-if="state.unknownServerError")
      .badge.danger (シ_ _)シ Something went wrong, Please try again or contact support
</template>

<style lang="stylus">
dialog.group-details
  overflow auto
  &.child-dialog-is-visible
    overflow initial
  input.name
    margin-bottom 0
  .search-wrap
    padding-top 6px
  .user-list,
  .user-list + section
    border-top 1px solid var(--primary-border)
</style>
