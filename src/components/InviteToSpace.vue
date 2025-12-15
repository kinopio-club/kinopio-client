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
// import InviteTips from '@/components/dialogs/InviteTips.vue'
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
  invitePickerIsVisible: false,
  inviteType: 'edit' // 'group', 'edit', 'read'
})

const spaceName = computed(() => spaceStore.name)
const collaboratorKey = computed(() => spaceStore.collaboratorKey)
// const spaceIsPrivate = computed(() => spaceStore.privacy === 'private')
const closeDialogs = () => {
  emit('closeDialogs')
}
const emitChildDialogIsVisible = (value) => {
  emit('childDialogIsVisible', value)
}

// invite types

const inviteTypeIsGroup = computed(() => state.inviteType === 'group')
const inviteTypeIsEdit = computed(() => state.inviteType === 'edit')
const inviteTypeIsRead = computed(() => state.inviteType === 'read')
// const inviteTypeIsCommentOnly = computed(() => state.inviteType === 'commentOnly')
const updateDefaultInviteType = () => {
  if (props.group) {
    // state.inviteType = 'group'
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
const readUrl = computed(() => {
  const currentSpace = spaceStore.getSpaceAllState
  const spaceId = currentSpace.id
  const readOnlyKey = currentSpace.readOnlyKey
  const url = utils.inviteUrl({ spaceId, spaceName: spaceName.value, readOnlyKey })
  console.info('🍇 invite read only url', url, 'readOnlyKey:', readOnlyKey)
  return url
})
// const commentOnlyUrl = computed(() => {
//   const currentSpace = spaceStore.getSpaceAllState
//   const spaceId = currentSpace.id
//   const url = utils.inviteUrl({ spaceId, spaceName: spaceName.value, collaboratorKey: collaboratorKey.value, isCommentMode: true })
//   console.info('🍇 invite comment only url', url)
//   return url
// })
const inviteUrl = computed(() => {
  let url
  if (inviteTypeIsGroup.value) {
    url = groupStore.getGroupInviteUrl(props.group)
    console.info('🍇 group invite url', url)
  } else if (inviteTypeIsEdit.value) {
    url = editUrl.value
  } else if (inviteTypeIsRead.value) {
    url = readUrl.value
  }
  // else {
  //   url = commentOnlyUrl.value
  // }
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
  state.invitePickerIsVisible = false
  state.tipsIsVisible = false
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

const toggleInvitePickerIsVisible = () => {
  const isVisible = state.invitePickerIsVisible
  closeChildDialogs()
  state.invitePickerIsVisible = !isVisible
  emitChildDialogIsVisible(state.invitePickerIsVisible)
}

// tips

const toggleTipsIsVisible = () => {
  const isVisible = state.tipsIsVisible
  closeChildDialogs()
  state.tipsIsVisible = !isVisible
  emitChildDialogIsVisible(state.tipsIsVisible)
}

</script>

<template lang="pug">
section.invite-to-space(v-if="props.visible" @click.stop="closeDialogs")

  .button-wrap.invite-button
    button(@click.stop="toggleInvitePickerIsVisible" :class="{ active: state.invitePickerIsVisible }")
      InviteLabel(:inviteType="state.inviteType" :group="props.group")
      InvitePicker(:visible="state.invitePickerIsVisible" :inviteType="state.inviteType")

  section.subsection
    .row.title-row
      div
        //- .button-wrap
        //-   button(@click.stop="toggleEmailInvitesIsVisible" :class="{ active: state.emailInvitesIsVisible }")
        //-     img.icon.mail(src="@/assets/mail.svg")
        //-     span Email
        //-   EmailInvites(:visible="state.emailInvitesIsVisible")

        .button-wrap(v-if="inviteTypeIsEdit")
          button(@click.stop="toggleEmailInvitesIsVisible" :class="{ active: state.emailInvitesIsVisible }")
            img.icon.mail(src="@/assets/mail.svg")
            span Email
          EmailInvites(:visible="state.emailInvitesIsVisible")

        .button-wrap
          button(@click.left="copyInviteUrl")
            img.icon.copy(src="@/assets/copy.svg")
            span
              span Copy Invite Link

      //- .button-wrap
      //-   button.small-button(@click.stop="toggleTipsIsVisible" :class="{ active: state.tipsIsVisible }")
      //-     span ?
      //-   InviteTips(:visible="state.tipsIsVisible")
    //- .row
    //-   //- (v-if="inviteTypeIsEdit")
    //-   .button-wrap
    //-     button(@click.stop="toggleEmailInvitesIsVisible" :class="{ active: state.emailInvitesIsVisible }")
    //-       img.icon.mail(src="@/assets/mail.svg")
    //-       span Email
    //-     EmailInvites(:visible="state.emailInvitesIsVisible")

  //- TODO integrate tips into invitepicker , remove InviteTips dialog

  //- TODO old, replace
  //- .row.title-row
    //- span
    //-   .users
    //-     User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")
    //-     User(:user="randomUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")
    //-   span Invite Collaborators
    //- .button-wrap
    //-   button.small-button(@click.stop="toggleTipsIsVisible" :class="{ active: state.tipsIsVisible }")
    //-     span ?
    //-   InviteTips(:visible="state.tipsIsVisible")
  //- .row.invite-url-segmented-buttons
  //-   .segmented-buttons
  //-     button(v-if="props.group" @click="toggleInviteType('group')" :class="{active: inviteTypeIsGroup}")
  //-       GroupLabel(:group="props.group")
  //-     button(@click="toggleInviteType('edit')" :class="{active: inviteTypeIsEdit}")
  //-       span Edit
  //-     button(v-if="spaceIsPrivate" @click="toggleInviteType('read')" :class="{active: inviteTypeIsRead}")
  //-       span Read

      //- button(v-if="spaceIsPrivate" @click="toggleInviteType('commentOnly')" :class="{active: inviteTypeIsCommentOnly}")
      //-   img.icon.comment(src="@/assets/comment.svg")

  //- section.subsection
    //- .invite-url-subsection
    //- invite type info
    //- .row(v-if="inviteTypeIsCommentOnly")
    //- //-   .badge.info Comment Only invites are in beta, so only invite people you trust
    //- .row(v-if="inviteTypeIsRead")
    //-   .badge Invite others to read only
    //- .row(v-if="inviteTypeIsEdit")
    //-   .badge Invite collaborators to edit space
    //- .row(v-if="inviteTypeIsGroup")
    //-   .badge Group members can edit any space in{{' '}}
    //-      GroupLabel(:group="props.group" :showName="true")

    //- copy invite
    //- .row
      //- .segmented-buttons
      //-   button(@click.left="copyInviteUrl")
      //-     img.icon.copy(src="@/assets/copy.svg")
      //-     span(v-if="inviteTypeIsGroup")
      //-       span Copy Invite Link to Group
      //-     span(v-else-if="inviteTypeIsEdit")
      //-       span Copy Invite Link to Edit
      //-     span(v-else-if="inviteTypeIsRead")
      //-       span Copy Invite Link to Read Only
      //-     span(v-else)
      //-       span Copy Invite Link to{{' '}}
              //- img.icon.comment(src="@/assets/comment.svg")

      //-   button(@click.stop="toggleInvitePickerIsVisible" :class="{ active: state.invitePickerIsVisible }" title="Scan QR Code")
      //-     img.icon.qr-code(src="@/assets/qr-code.svg")
      //- QRCode(:visible="state.invitePickerIsVisible" :value="inviteUrl")
    //- email invites
</template>

<style lang="stylus">
section.invite-to-space
  // user-select text
  // .badge
  //   margin 0
  //   color var(--primary)
  //   vertical-align 0

  // .invite-url-segmented-buttons
  //   margin-bottom 0
  //   button
  //     border-bottom-left-radius 0
  //     border-bottom-right-radius 0
  //   + .invite-url-subsection
  //     border-top-left-radius 0
  //     // border-top-right-radius 0

  // .invite-button-wrap
  // width 100%
  .button-wrap.invite-button
    width 100%

    > button
      width 100%
      border-bottom-left-radius 0
      border-bottom-right-radius 0
    // display flex
    // align-items center
    // display flex

  section.subsection
    margin-top 0
    border-top-left-radius 0
    border-top-right-radius 0

</style>
