<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserList from '@/components/UserList.vue'
import User from '@/components/User.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import GroupLabel from '@/components/GroupLabel.vue'
import utils from '@/utils.js'

import randomColor from 'randomcolor'
import uniqBy from 'lodash-es/uniqBy'

const store = useStore()

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
  colorPickerIsVisible: false,
  childDialogIsVisible: false
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
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const closeDialogs = () => {
  state.colorPickerIsVisible = false
  store.commit('userDetailsIsVisible', false)
  store.commit('triggerCloseChildDialogs')
}
const childDialogIsVisible = computed(() => {
  return state.colorPickerIsVisible || state.childDialogIsVisible
})
const updateChildDialogIsVisible = (value) => {
  state.childDialogIsVisible = value
}

// group

const currentUserIsGroupAdmin = computed(() => {
  return store.getters['groups/groupUserIsAdmin']({
    userId: store.state.currentUser.id,
    groupId: props.group.id
  })
})
const updateGroup = (update) => {
  update.id = props.group.id
  store.dispatch('groups/update', update)
}

// group color

const groupColor = computed(() => props.group.color)
const updateGroupColor = (newValue) => {
  updateGroup({ color: newValue })
}
const toggleColorPicker = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}

// group name

const groupName = computed({
  get () {
    return props.group.name
  },
  set (newValue) {
    updateGroup({ name: newValue })
  }
})

// invite

const currentUser = computed(() => store.state.currentUser)
const randomUser = computed(() => {
  const luminosity = store.state.currentUser.theme
  const color = randomColor({ luminosity })
  return { color }
})
const inviteUrl = computed(() => {
  if (!props.group.collaboratorKey) { return }
  const url = utils.groupInviteUrl({
    groupId: props.group.id,
    groupName: props.group.name,
    collaboratorKey: props.group.collaboratorKey
  })
  return url
})
const copyInviteUrl = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  console.log('🍇 group invite url', inviteUrl.value)
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyInviteUrl', error, inviteUrl.value)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
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
  let element = event.target
  let options = { element, offsetX: 0, shouldIgnoreZoom: true }
  let position = utils.childDialogPositionFromParent(options)
  const userListBadgeOffsetY = 60
  position.y = position.y - userListBadgeOffsetY
  store.commit('userDetailsUser', user)
  store.commit('userDetailsPosition', position)
  store.commit('userDetailsIsVisible', true)
}
</script>

<template lang="pug">
dialog.narrow.group-details(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" :class="{ 'child-dialog-is-visible': childDialogIsVisible }")
  section
    .row
      template(v-if="currentUserIsGroupAdmin")
        .button-wrap
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}" title="Change Group Color")
            .current-color.current-group-color(:style="{ background: groupColor }")
          ColorPicker(:currentColor="groupColor" :visible="state.colorPickerIsVisible" @selectedColor="updateGroupColor")
        input.name(placeholder="Group Name" v-model="groupName" name="groupName" maxlength=100 @mouseup.stop)

      template(v-else)
        GroupLabel(:group="props.group" :showName="true")

  section(v-if="inviteUrl")
    .row.invite-row
      p
        .users
          User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
          User(:user="randomUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
        span Invite Members

    section.subsection
      .row
        button(@click.left="copyInviteUrl")
          img.icon.copy(src="@/assets/copy.svg")
          span Copy Group Invite URL
      //- .row
      //-   button
      //-     img.icon.mail(src="@/assets/mail.svg")
      //-     span Email Invites

  UserList(
    :users="groupUsers"
    :selectedUser="selectedUser"
    @selectUser="toggleUserDetails"
    :isClickable="true"
    :showGroupUserActions="true"
    :group="props.group"
    @childDialogIsVisible="updateChildDialogIsVisible"
  )
</template>

<style lang="stylus">
dialog.group-details
  overflow auto
  &.child-dialog-is-visible
    overflow initial
  input.name
    margin-bottom 0
  button.change-color
    margin-right 6px
  .search-wrap
    padding-top 6px
  .user-list
    border-top 1px solid var(--primary-border)
  .invite-row
    justify-content space-between
    button
      margin 0
    .users
      margin-right 5px
      .user
        vertical-align -3px
        .anon-avatar
          top 6px
  .change-color
    .current-group-color
      border-radius 10px
</style>
