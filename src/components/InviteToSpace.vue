<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import EmailInvites from '@/components/dialogs/EmailInvites.vue'
import QRCode from '@/components/dialogs/QRCode.vue'
import GroupLabel from '@/components/GroupLabel.vue'
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

const emit = defineEmits(['closeDialogs', 'emailInvitesIsVisible', 'childDialogIsVisible'])

const props = defineProps({
  visible: Boolean,
  group: Object
})

const state = reactive({
  tipsIsVisible: false,
  emailInvitesIsVisible: false,
  isShareInCommentMode: false,
  QRCodeIsVisible: false,
  inviteType: 'edit' // 'group', 'edit', 'readOnly'
})

const currentUser = computed(() => userStore.getUserAllState)
const currentUserIsUpgraded = computed(() => userStore.isUpgraded)
const spaceName = computed(() => spaceStore.name)
const randomUser = computed(() => {
  const luminosity = userStore.theme
  const color = randomColor({ luminosity })
  return { color }
})
const collaboratorKey = computed(() => spaceStore.collaboratorKey)
const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)
const spaceIsPrivate = computed(() => spaceStore.privacy === 'private')
const closeDialogs = () => {
  emit('closeDialogs')
}
// invite types

const inviteTypeIsGroup = computed(() => state.inviteType === 'group')
const inviteTypeIsEdit = computed(() => state.inviteType === 'edit')
const inviteTypeIsReadOnly = computed(() => state.inviteType === 'readOnly')
const inviteTypeIsCommentOnly = computed(() => state.inviteType === 'commentOnly')
const updateDefaultInviteType = () => {
  if (props.group) {
    state.inviteType = 'group'
  }
}
const toggleInviteType = (type) => {
  state.inviteType = type
  state.tipsIsVisible = false
}

// urls

const editUrl = computed(() => {
  const currentSpace = spaceStore.getSpaceAllState
  const spaceId = currentSpace.id
  const url = utils.inviteUrl({ spaceId, spaceName: spaceName.value, collaboratorKey: collaboratorKey.value })
  console.info('🍇 invite edit url', url)
  return url
})
const readOnlyUrl = computed(() => {
  const currentSpace = spaceStore.getSpaceAllState
  const spaceId = currentSpace.id
  const readOnlyKey = currentSpace.readOnlyKey
  const url = utils.inviteUrl({ spaceId, spaceName: spaceName.value, readOnlyKey })
  console.info('🍇 invite read only url', url, 'readOnlyKey:', readOnlyKey)
  return url
})
const commentOnlyUrl = computed(() => {
  const currentSpace = spaceStore.getSpaceAllState
  const spaceId = currentSpace.id
  const url = utils.inviteUrl({ spaceId, spaceName: spaceName.value, collaboratorKey: collaboratorKey.value, isCommentMode: true })
  console.info('🍇 invite comment only url', url)
  return url
})
const inviteUrl = computed(() => {
  let url
  if (inviteTypeIsGroup.value) {
    url = groupStore.getGroupInviteUrl(props.group)
    console.info('🍇 group invite url', url)
  } else if (inviteTypeIsEdit.value) {
    url = editUrl.value
  } else if (inviteTypeIsReadOnly.value) {
    url = readOnlyUrl.value
  } else {
    url = commentOnlyUrl.value
  }
  return url
})

//  copy invite urls

const copyInviteUrl = async (event) => {
  globalStore.clearNotificationsWithPosition()
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyInviteUrl', error, inviteUrl.value)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

// email invites

const closeChildDialogs = () => {
  state.emailInvitesIsVisible = false
  state.QRCodeIsVisible = false
}
const toggleEmailInvitesIsVisible = () => {
  const value = !state.emailInvitesIsVisible
  closeChildDialogs()
  state.emailInvitesIsVisible = value
}
watch(() => state.emailInvitesIsVisible, (value, prevValue) => {
  emit('emailInvitesIsVisible', value)
})

// qr

const toggleQRCodeIsVisible = () => {
  const isVisible = state.QRCodeIsVisible
  closeChildDialogs()
  state.QRCodeIsVisible = !isVisible
  emitChildDialogIsVisible(state.QRCodeIsVisible)
}
const emitChildDialogIsVisible = (value) => {
  emit('childDialogIsVisible', value)
}

// tips

const toggleTipsIsVisible = () => {
  state.tipsIsVisible = !state.tipsIsVisible
}

</script>

<template lang="pug">
section.invite-to-space(v-if="props.visible" @click.stop="closeDialogs")
  .row
    span
      .users
        User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
        User(:user="randomUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
      span Invite

  .row.invite-url-segmented-buttons
    .segmented-buttons
      button(v-if="props.group" @click="toggleInviteType('group')" :class="{active: inviteTypeIsGroup}")
        GroupLabel(:group="props.group")
      button(@click="toggleInviteType('edit')" :class="{active: inviteTypeIsEdit}")
        span Edit
      button(v-if="spaceIsPrivate" @click="toggleInviteType('readOnly')" :class="{active: inviteTypeIsReadOnly}")
        span Read
      button(v-if="spaceIsPrivate" @click="toggleInviteType('commentOnly')" :class="{active: inviteTypeIsCommentOnly}")
        img.icon.comment(src="@/assets/comment.svg")

  section.subsection.invite-url-subsection
    //- invite type info
    .row(v-if="inviteTypeIsCommentOnly")
      .badge.info Comment Only invites are in beta, so only invite people you trust
    .row(v-if="inviteTypeIsReadOnly")
      .badge Invite others to read only
    .row(v-if="inviteTypeIsEdit")
      .badge Invite collaborators to edit space
    .row(v-if="inviteTypeIsGroup")
      .badge Invite members to group{{' '}}
         GroupLabel(:group="props.group")

    //- copy invite
    .row
      .segmented-buttons
        button(@click.left="copyInviteUrl")
          img.icon.copy(src="@/assets/copy.svg")
          span(v-if="inviteTypeIsGroup")
            span Copy Group Invite Link
          span(v-else-if="inviteTypeIsEdit")
            span Copy Invite to Edit Link
          span(v-else-if="inviteTypeIsReadOnly")
            span Copy Invite to Read Link
          span(v-else)
            span Copy Invite to{{' '}}
              img.icon.comment(src="@/assets/comment.svg")
              span Link

        button(@click.stop="toggleQRCodeIsVisible" :class="{ active: state.QRCodeIsVisible }" title="Scan QR Code")
          img.icon.qr-code(src="@/assets/qr-code.svg")
      QRCode(:visible="state.QRCodeIsVisible" :value="inviteUrl")
    //- email invites
    .row(v-if="inviteTypeIsEdit")
      .button-wrap
        button(@click.stop="toggleEmailInvitesIsVisible" :class="{ active: state.emailInvitesIsVisible }")
          img.icon.mail(src="@/assets/mail.svg")
          span Email Invites
        EmailInvites(:visible="state.emailInvitesIsVisible")

    //- Tips
    template(v-if="!inviteTypeIsGroup")
      .row.title-row
        .badge No account required to view
        button.small-button(@click.stop="toggleTipsIsVisible" :class="{ active: state.tipsIsVisible }")
          span ?
      .row(v-if="state.tipsIsVisible")
        .badge.info
          p If your account is upgraded, collaborators can create cards in this space without increasing their free card count.
      //- .row(v-if="currentUserIsUpgraded")
      //-   details
      //-     summary
      //-       span Collaborators edit for free
      //-     section.subsection
      //-       p If your account is upgraded, collaborators can create cards in this space without increasing their free card count
            //- p
            //-   img(src="https://cdn.kinopio.club/EoczbIBOicBBBh-GNuZOE/original-3a3d20bd4be668e1dffd7a97742a501d.gif")
</template>

<style lang="stylus">
section.invite-to-space
  user-select text
  .badge
    margin 0
    color var(--primary)
    vertical-align 0
  .users
    margin-right 5px
    .user
      vertical-align -3px
      &:first-child
        .user-avatar
          border-top-right-radius 0
          border-bottom-right-radius 0
      &:last-child
        .user-avatar
          border-top-left-radius 0
          border-bottom-left-radius 0
  .invite-url-segmented-buttons
    margin-bottom 0
    button
      border-bottom-left-radius 0
      border-bottom-right-radius 0
    + .invite-url-subsection
      border-top-left-radius 0
      // border-top-right-radius 0
</style>
