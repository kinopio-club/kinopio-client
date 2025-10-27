<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'

import PrivacyButton from '@/components/PrivacyButton.vue'
import InviteToSpace from '@/components/InviteToSpace.vue'
import InviteToGroup from '@/components/InviteToGroup.vue'
import SpaceUsers from '@/components/dialogs/SpaceUsers.vue'
import RssFeeds from '@/components/dialogs/RssFeeds.vue'
import QRCode from '@/components/dialogs/QRCode.vue'
import Embed from '@/components/dialogs/Embed.vue'
import utils from '@/utils.js'
import ImportExportButton from '@/components/ImportExportButton.vue'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const groupStore = useGroupStore()

const dialog = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean
})

watch(() => props.visible, (value, prevValue) => {
  globalStore.clearNotificationsWithPosition()
  closeDialogs()
  if (value) {
    updateDialogHeight()
    globalStore.shouldExplicitlyHideFooter = true
    spaceStore.updateSpacePreviewImage()
  } else {
    globalStore.shouldExplicitlyHideFooter = false
  }
})

const state = reactive({
  urlIsCopied: false,
  privacyPickerIsVisible: false,
  dialogHeight: null,
  rssFeedsIsVisible: false,
  embedIsVisible: false,
  isShareInPresentationMode: false,
  emailInvitesIsVisible: false,
  childDialogIsVisible: false,
  spaceUsersIsVisible: false,
  QRCodeIsVisible: false
})

const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)
const spaceIsRemote = computed(() => spaceStore.getSpaceIsRemote)
const spaceIsPublic = computed(() => spaceStore.privacy !== 'private')
const spaceIsPrivate = computed(() => spaceStore.privacy === 'private')

// copy url

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

// dialog

const updateDialogHeight = () => {
  if (!props.visible) { return }
  nextTick(() => {
    const element = dialog.value
    state.dialogHeight = utils.elementHeight(element)
  })
}
const dialogIsVisible = computed(() => {
  return state.privacyPickerIsVisible || state.rssFeedsIsVisible || state.embedIsVisible || state.emailInvitesIsVisible || state.childDialogIsVisible || state.spaceUsersIsVisible || state.QRCodeIsVisible
})
const closeDialogs = () => {
  state.privacyPickerIsVisible = false
  state.rssFeedsIsVisible = false
  state.embedIsVisible = false
  state.emailInvitesIsVisible = false
  state.childDialogIsVisible = false
  state.spaceUsersIsVisible = false
  state.QRCodeIsVisible = false
  globalStore.triggerCloseChildDialogs()
}
const childDialogIsVisible = (value) => {
  state.childDialogIsVisible = value
  state.embedIsVisible = false
}

// toggles

const triggerSignUpOrInIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSignUpOrInIsVisible()
}
const togglePrivacyPickerIsVisible = () => {
  const isVisible = state.privacyPickerIsVisible
  closeDialogs()
  state.privacyPickerIsVisible = !isVisible
}
const toggleRssFeedsIsVisible = () => {
  const isVisible = state.rssFeedsIsVisible
  closeDialogs()
  state.rssFeedsIsVisible = !isVisible
}
const toggleEmbedIsVisible = () => {
  const isVisible = state.embedIsVisible
  closeDialogs()
  state.embedIsVisible = !isVisible
}
const toggleIsShareInPresentationMode = () => {
  closeDialogs()
  state.isShareInPresentationMode = !state.isShareInPresentationMode
}
const updateEmailInvitesIsVisible = (value) => {
  state.emailInvitesIsVisible = value
}
const toggleQRCodeIsVisible = () => {
  const isVisible = state.QRCodeIsVisible
  closeDialogs()
  state.QRCodeIsVisible = !isVisible
}

// invites

const currentUserIsCurrentSpaceGroupUser = computed(() => groupStore.getIsCurrentSpaceGroupUser)
const spaceGroup = computed(() => groupStore.getCurrentSpaceGroup)

// users

const users = computed(() => spaceStore.getSpaceAndGroupMembers)
const toggleSpaceUsersIsVisible = () => {
  const value = !state.spaceUsersIsVisible
  closeDialogs()
  state.spaceUsersIsVisible = value
}

</script>

<template lang="pug">
dialog.share.wide(v-if="props.visible" :open="props.visible" @click.left.stop="closeDialogs" ref="dialog" :style="{'max-height': state.dialogHeight + 'px'}" :class="{overflow: !dialogIsVisible}")
  section.title-section
    .row.title-row
      p Share
      .row
        //- .button-wrap
        //-   button.small-button
        //-     img.icon.group(src="@/assets/group.svg")
        //-     span Groups
        //- users
        .button-wrap
          button.small-button(@click.stop="toggleSpaceUsersIsVisible" :class="{active: state.spaceUsersIsVisible}")
            span Users
          SpaceUsers(:visible="state.spaceUsersIsVisible")
        //- rss
        .button-wrap(v-if="spaceIsRemote")
          button.small-button(@click.left.stop="toggleRssFeedsIsVisible" :class="{ active: state.rssFeedsIsVisible }" title="RSS Feeds")
            span RSS
          RssFeeds(:visible="state.rssFeedsIsVisible")

  section(v-if="spaceIsRemote")
    PrivacyButton(:privacyPickerIsVisible="state.privacyPickerIsVisible" @togglePrivacyPickerIsVisible="togglePrivacyPickerIsVisible" @closeDialogs="closeDialogs")

    //- Copy URL
    section.subsection(:class="{'share-url-subsection-member': isSpaceMember}")
      .row.title-row
        .segmented-buttons
          button(@click.left="copySpaceUrl")
            img.icon.copy(src="@/assets/copy.svg")
            .badge.badge-in-button.danger.private-copy-badge(v-if="spaceIsPrivate" title="Private spaces can only be viewed by collaborators")
              img.icon.lock(src="@/assets/lock.svg")
            span Copy Link
          button(@click.stop="toggleQRCodeIsVisible" :class="{ active: state.QRCodeIsVisible }" title="QR Code")
            img.icon.qr-code(src="@/assets/qr-code.svg")
        QRCode(:visible="state.QRCodeIsVisible" :value="spaceUrl")

        .row
          //- presentation mode
          label.label.small-button.extra-options-button.inline-button(title="Share in Presentation Mode" @mouseup.prevent.stop.left="toggleIsShareInPresentationMode" @touchend.prevent.stop="toggleIsShareInPresentationMode" :class="{active: state.isShareInPresentationMode}")
            input(type="checkbox" :value="state.isShareInPresentationMode")
            img.icon(src="@/assets/presentation.svg")

  //- Invite
  InviteToSpace(:visible="isSpaceMember && currentUserIsSignedIn" @closeDialogs="closeDialogs" @emailInvitesIsVisible="updateEmailInvitesIsVisible" :group="spaceGroup" @childDialogIsVisible="childDialogIsVisible")

  section(v-if="!spaceIsRemote")
    p
      span To share or invite collaborators,
      span.badge.info you need to Sign Up or In
      span for your spaces to be synced and accessible anywhere.
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

  //- Import, Export, Embed
  section.import-export-section
    .row
      ImportExportButton(@childDialogIsVisible="childDialogIsVisible")
      //- Embed
      .button-wrap
        button(@click.left.stop="toggleEmbedIsVisible" :class="{ active: state.embedIsVisible }")
          span Embed
        Embed(:visible="state.embedIsVisible")
    details(@toggle="updateDialogHeight")
      summary Spread the Word
      section.subsection
        p I don't have the resources of a VC backed company, so when you tell a friend about Kinopio, or share spaces at work, it really helps.
        //- p Your voice is the water that grows this seedling.
        p – Piri
        p
          img(src="https://cdn.kinopio.club/fqoJozHGrobicZe0XUG1e/my-garden.webp")
        //- https://alternativeto.net/software/kinopio/about/
        //- https://toolfinder.co/tools/kinopio
</template>

<style lang="stylus">
dialog.share
  top calc(100% - 8px)
  left initial
  right 8px
  max-height calc(100vh - 25px)
  &.overflow
    overflow auto
  .badge
    display inline-block
    &.danger
      background-color var(--danger-background)
  .privacy-button + .textarea
    margin-top 10px
  .description
    margin-top 3px
  dialog.user-details
    left initial
    right calc(100% - 20px)
  dialog.import-export,
  dialog.embed
    top initial
    bottom 25px
  .share-private
    margin-top 10px
  .privacy-button + input
    margin-top 10px
  .privacy-button
    > button
      padding-top 8px
  .button-tip-badge
    top -12px
    pointer-events none
  p + .subsection
    margin-top 10px
  .share-url-subsection-member
    margin-top 0
    border-top-left-radius 0
    border-top-right-radius 0

  .segmented-buttons
    z-index 1
  .extra-options-button
    margin-left auto
    margin-top 0
    margin-bottom -2px
    width auto
    cursor pointer
    height 20px
    width initial
    &.label
      padding-top 2px
      input
        background-color transparent
        pointer-events none

  .privacy-button
    button
      border-bottom-left-radius 0
      border-bottom-right-radius 0

  .private-copy-badge
    margin-left 6px
    vertical-align 1px
  .title-row
    p + .row
      margin-top 0
    label + label
      margin-left 6px
</style>
