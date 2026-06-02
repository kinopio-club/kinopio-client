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
import ShareOptionsPicker from '@/components/dialogs/ShareOptionsPicker.vue'
import QRCode from '@/components/dialogs/QRCode.vue'
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

const state = reactive({
  emailInvitesIsVisible: false,
  isShareInCommentMode: false,
  shareOptionsPickerIsVisible: false,
  QRCodeIsVisible: false,
  isShareInPresentationMode: false,
  inviteType: 'edit' // 'group', 'edit', 'read'
})

const spaceName = computed(() => spaceStore.name)
const spaceIsPublic = computed(() => spaceStore.getSpaceIsPublic)
const spaceIsPrivate = computed(() => spaceStore.getSpaceIsPrivate)
const spaceIsReadOnly = computed(() => !userStore.getUserCanEditSpace)
const collaboratorKey = computed(() => spaceStore.collaboratorKey)
const randomUser = computed(() => {
  const luminosity = userStore.theme
  const color = randomColor({ luminosity })
  return { color }
})
const closeDialogs = () => {
  emit('closeDialogs')
}
const emitChildDialogIsVisible = (value) => {
  emit('childDialogIsVisible', value)
}
const closeChildDialogs = () => {
  state.emailInvitesIsVisible = false
  state.shareOptionsPickerIsVisible = false
  state.QRCodeIsVisible = false
}
const toggleEmailInvitesIsVisible = () => {
  const value = !state.emailInvitesIsVisible
  closeChildDialogs()
  closeDialogs()
  state.emailInvitesIsVisible = value
  emitChildDialogIsVisible(state.emailInvitesIsVisible)
}
const toggleShareOptionsPickerIsVisible = () => {
  const isVisible = state.shareOptionsPickerIsVisible
  closeChildDialogs()
  closeDialogs()
  state.shareOptionsPickerIsVisible = !isVisible
  emitChildDialogIsVisible(state.shareOptionsPickerIsVisible)
}
const toggleIsShareInPresentationMode = () => {
  closeChildDialogs()
  closeDialogs()
  state.isShareInPresentationMode = !state.isShareInPresentationMode
}
const toggleQRCodeIsVisible = () => {
  const isVisible = state.QRCodeIsVisible
  closeChildDialogs()
  closeDialogs()
  state.QRCodeIsVisible = !isVisible
  emitChildDialogIsVisible(state.QRCodeIsVisible)
}

// invite types

const inviteTypeIsGroup = computed(() => state.inviteType === 'group')
const inviteTypeIsEdit = computed(() => state.inviteType === 'edit')
const inviteTypeIsRead = computed(() => state.inviteType === 'read')
const updateDefaultInviteType = () => {
  if (spaceGroup.value) {
    state.inviteType = 'group'
  } else if (spaceIsReadOnly.value) {
    state.inviteType = 'read'
  } else {
    state.inviteType = 'edit'
  }
}
const updateInviteType = (type) => {
  state.inviteType = type
}

// urls

const editUrl = computed(() => {
  const currentSpace = spaceStore.getSpaceAllState
  const spaceId = currentSpace.id
  const url = utils.spaceInviteUrl({ spaceId, spaceName: spaceName.value, collaboratorKey: collaboratorKey.value })
  console.info('🍇 invite edit url', url)
  return url
})
const readUrl = computed(() => {
  const currentSpace = spaceStore.getSpaceAllState
  const spaceId = currentSpace.id
  const readOnlyKey = currentSpace.readOnlyKey
  const url = utils.spaceInviteUrl({ spaceId, spaceName: spaceName.value, readOnlyKey })
  console.info('🍇 invite read only url', url, 'readOnlyKey:', readOnlyKey)
  return url
})
const inviteUrl = computed(() => {
  let url
  // group
  if (inviteTypeIsGroup.value) {
    url = groupStore.getGroupInviteUrl(spaceGroup.value)
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

// group

const spaceGroup = computed(() => groupStore.getCurrentSpaceGroup)
watch(() => spaceGroup.value, (value, prevValue) => {
  updateDefaultInviteType()
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
const copyInviteLinkString = computed(() => {
  if (state.inviteType === 'group') {
    return 'Copy Group Invite Link'
  } else {
    return 'Copy Invite Link'
  }
})

// copy public space url

const spaceUrl = computed(() => {
  let url = spaceStore.getSpaceUrl
  url = new URL(url)
  if (state.isShareInPresentationMode) {
    url.searchParams.set('present', true)
  }
  return url.href
})
const copySpaceUrl = async (event) => {
  globalStore.clearNotificationsWithPosition()
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(spaceUrl.value)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

</script>

<template lang="pug">
.invite-to-space(@click.stop="closeDialogs")

  //- invite picker
  .button-wrap.invite-button(v-if="!spaceIsReadOnly")
    button.title-row-flex(@click.stop="toggleShareOptionsPickerIsVisible" :class="{ active: state.shareOptionsPickerIsVisible }")
      InviteLabel(:inviteType="state.inviteType" :group="spaceGroup" :randomUser="randomUser")
      img.icon.down-arrow(src="@/assets/down-arrow.svg")
    ShareOptionsPicker(:visible="state.shareOptionsPickerIsVisible" :inviteType="state.inviteType" :group="spaceGroup" :randomUser="randomUser" @select="updateInviteType" @closeDialogs="closeDialogs")

  //- copy url (public space)
  section.subsection(v-if="spaceIsPublic && inviteTypeIsRead")
    .row.title-row
      .segmented-buttons
        button(@click.left="copySpaceUrl")
          img.icon.copy(src="@/assets/copy.svg")
          //- .badge.badge-in-button.danger.private-copy-badge(v-if="spaceIsPrivate" title="Private spaces can only be viewed by collaborators")
          span Copy Public URL
        button(@click.stop="toggleQRCodeIsVisible" :class="{ active: state.QRCodeIsVisible }" title="Scan QR Code")
          img.icon.qr-code(src="@/assets/qr-code.svg")
      QRCode(:visible="state.QRCodeIsVisible" :value="spaceUrl")
      .row
        //- presentation mode
        label.label.small-button.extra-options-button.inline-button(title="Share in Presentation Mode" @mouseup.prevent.stop.left="toggleIsShareInPresentationMode" @touchend.prevent.stop="toggleIsShareInPresentationMode" :class="{active: state.isShareInPresentationMode}")
          input(type="checkbox" :value="state.isShareInPresentationMode")
          img.icon(src="@/assets/presentation.svg")

  //- copy invite link (private space)
  section.subsection(v-else)
    .row
      .button-wrap
        button(@click.left="copyInviteLink")
          img.icon.copy(src="@/assets/copy.svg")
          span {{copyInviteLinkString}}
      .button-wrap(v-if="inviteTypeIsEdit")
        button(@click.stop="toggleEmailInvitesIsVisible" :class="{ active: state.emailInvitesIsVisible }")
          img.icon.mail(src="@/assets/mail.svg")
          span Email
        EmailInvites(:visible="state.emailInvitesIsVisible")

</template>

<style lang="stylus">
.invite-to-space
  margin-top 10px
  .button-wrap.invite-button
    width 100%
    > button
      width 100%
      border-bottom-left-radius 0
      border-bottom-right-radius 0
  .invite-button + section.subsection
    margin-top 0
    border-top-left-radius 0
    border-top-right-radius 0
  dialog.email-invites
    left initial
    right 8px
</style>
