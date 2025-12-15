<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import InviteLabel from '@/components/InviteLabel.vue'
import EmailInvites from '@/components/dialogs/EmailInvites.vue'
import InvitePicker from '@/components/dialogs/InvitePicker.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import randomColor from 'randomcolor'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

let unsubscribes

onMounted(() => {
  updateDefaultInviteType()
  globalStore.clearNotificationsWithPosition()
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs') {
        closeChildDialogs()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const emit = defineEmits(['closeDialogs', 'childDialogIsVisible'])

const props = defineProps({
  visible: Boolean,
  group: Object
})

const state = reactive({
  emailInvitesIsVisible: false,
  isShareInCommentMode: false,
  invitePickerIsVisible: false,
  inviteType: 'edit' // 'group', 'edit', 'read'
})

const spaceName = computed(() => spaceStore.name)
const collaboratorKey = computed(() => spaceStore.collaboratorKey)
const closeDialogs = () => {
  emit('closeDialogs')
}
const emitChildDialogIsVisible = (value) => {
  emit('childDialogIsVisible', value)
}
const closeChildDialogs = () => {
  state.emailInvitesIsVisible = false
  state.invitePickerIsVisible = false
}
const toggleEmailInvitesIsVisible = () => {
  const value = !state.emailInvitesIsVisible
  closeChildDialogs()
  state.emailInvitesIsVisible = value
  emitChildDialogIsVisible(state.emailInvitesIsVisible)
}
const toggleInvitePickerIsVisible = () => {
  const isVisible = state.invitePickerIsVisible
  closeChildDialogs()
  state.invitePickerIsVisible = !isVisible
  emitChildDialogIsVisible(state.invitePickerIsVisible)
}
const randomUser = computed(() => {
  const luminosity = userStore.theme
  const color = randomColor({ luminosity })
  return { color }
})

// invite types

const inviteTypeIsGroup = computed(() => state.inviteType === 'group')
const inviteTypeIsEdit = computed(() => state.inviteType === 'edit')
const inviteTypeIsRead = computed(() => state.inviteType === 'read')
const updateDefaultInviteType = () => {
  if (props.group) {
    state.inviteType = 'group'
  }
}
const updateInviteType = (type) => {
  state.inviteType = type
}

// urls

const editUrl = computed(() => {
  const currentSpace = spaceStore.getSpaceAllState
  const spaceId = currentSpace.id
  const url = utils.inviteUrl({ spaceId, spaceName: spaceName.value, collaboratorKey: collaboratorKey.value })
  console.info('🍇 invite edit url', url)
  return url
})
const readUrl = computed(() => {
  const currentSpace = spaceStore.getSpaceAllState
  const spaceId = currentSpace.id
  const readOnlyKey = currentSpace.readOnlyKey
  const url = utils.inviteUrl({ spaceId, spaceName: spaceName.value, readOnlyKey })
  console.info('🍇 invite read only url', url, 'readOnlyKey:', readOnlyKey)
  return url
})
const inviteUrl = computed(() => {
  let url
  // group
  if (inviteTypeIsGroup.value) {
    url = groupStore.getGroupInviteUrl(props.group)
    console.info('🍇 group invite url', url)
  // edit
  } else if (inviteTypeIsEdit.value) {
    url = editUrl.value
  // read
  } else if (inviteTypeIsRead.value) {
    url = readUrl.value
  }
  return url
})

//  copy invite urls

const copyInviteLink = async (event) => {
  globalStore.clearNotificationsWithPosition()
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyInviteLink', error, inviteUrl.value)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
</script>

<template lang="pug">
section.invite-to-space(v-if="props.visible" @click.stop="closeDialogs")
  .button-wrap.invite-button
    button(@click.stop="toggleInvitePickerIsVisible" :class="{ active: state.invitePickerIsVisible }")
      InviteLabel(:inviteType="state.inviteType" :group="props.group" :randomUser="randomUser")
      InvitePicker(:visible="state.invitePickerIsVisible" :inviteType="state.inviteType" :group="props.group" :randomUser="randomUser" @select="updateInviteType" @closeDialogs="closeDialogs")

  section.subsection
    .row
      .button-wrap(v-if="inviteTypeIsEdit")
        button(@click.stop="toggleEmailInvitesIsVisible" :class="{ active: state.emailInvitesIsVisible }")
          img.icon.mail(src="@/assets/mail.svg")
          span Email
        EmailInvites(:visible="state.emailInvitesIsVisible")
      .button-wrap
        button(@click.left="copyInviteLink")
          img.icon.copy(src="@/assets/copy.svg")
          span
            span Copy Invite Link
</template>

<style lang="stylus">
section.invite-to-space
  .button-wrap.invite-button
    width 100%
    > button
      width 100%
      border-bottom-left-radius 0
      border-bottom-right-radius 0
  section.subsection
    margin-top 0
    border-top-left-radius 0
    border-top-right-radius 0
</style>
