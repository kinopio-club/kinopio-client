<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore, mapState, mapGetters } from 'vuex'

import Loader from '@/components/Loader.vue'
import User from '@/components/User.vue'
import EmailInvites from '@/components/dialogs/EmailInvites.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'

import randomColor from 'randomcolor'
const store = useStore()

onMounted(() => {
  store.commit('clearNotificationsWithPosition')
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeChildDialogs()
    }
  })
})

const emit = defineEmits(['closeDialogs', 'emailInvitesIsVisible'])

const state = reactive({
  tipsIsVisible: false,
  emailInvitesIsVisible: false,
  inviteType: 'edit' // 'edit', 'readOnly'
})

const currentUser = computed(() => store.state.currentUser)
const currentUserIsUpgraded = computed(() => store.state.currentUser.isUpgraded)
const spaceName = computed(() => store.state.currentSpace.name)
const randomUser = computed(() => {
  const luminosity = store.state.currentUser.theme
  const color = randomColor({ luminosity })
  return { color }
})
const collaboratorKey = computed(() => store.state.currentSpace.collaboratorKey)
const toggleTipsIsVisible = () => {
  state.tipsIsVisible = !state.tipsIsVisible
}
const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)
const spaceIsPrivate = computed(() => store.state.currentSpace.privacy === 'private')

// invite types

const inviteTypeIsEdit = computed(() => state.inviteType === 'edit')
const inviteTypeIsReadOnly = computed(() => state.inviteType === 'readOnly')
const toggleInviteType = (type) => {
  state.inviteType = type
}

// urls

const editUrl = computed(() => {
  const currentSpace = store.state.currentSpace
  const spaceId = currentSpace.id
  const url = utils.inviteUrl({ spaceId, spaceName: spaceName.value, collaboratorKey: collaboratorKey.value })
  console.log('🍇 invite edit url', url)
  return url
})
const readOnlyUrl = computed(() => {
  const currentSpace = store.state.currentSpace
  const spaceId = currentSpace.id
  const readOnlyKey = currentSpace.readOnlyKey
  const url = utils.inviteUrl({ spaceId, spaceName: spaceName.value, readOnlyKey })
  console.log('🍇 invite read only url', url)
  return url
})

//  copy invite urls

const copyInviteUrl = async (event) => {
  let url
  if (inviteTypeIsEdit.value) {
    url = editUrl.value
  } else if (inviteTypeIsReadOnly.value) {
    url = readOnlyUrl.value
  }
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(url)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyInviteUrl', error, url)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
const inviteButtonLabel = computed(() => {
  if (inviteTypeIsEdit.value) {
    return 'Copy Invite to Edit URL'
  } else {
    // if inviteTypeIsReadOnly.value
    return 'Copy Invite to Read URL'
  }
})

// native web share

const webShareIsSupported = computed(() => navigator.share)
const webShareInvite = () => {
  let title
  if (inviteTypeIsEdit.value) {
    title = 'Invite to Edit'
  } else if (inviteTypeIsReadOnly.value) {
    title = 'Invite to Edit Only'
  }
  const data = {
    title,
    text: spaceName.value,
    url: editUrl.value
  }
  navigator.share(data)
}

// email invites

const closeChildDialogs = () => {
  state.emailInvitesIsVisible = false
}
const toggleEmailInvitesIsVisible = () => {
  const value = !state.emailInvitesIsVisible
  emit('closeDialogs')
  state.emailInvitesIsVisible = value
}
watch(() => state.emailInvitesIsVisible, (value, prevValue) => {
  emit('emailInvitesIsVisible', value)
})
</script>

<template lang="pug">
section.invite
  .row
    p
      .users
        User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
        User(:user="randomUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
      span Invite Collaborators
    button.small-button.extra-options-button(@click="toggleTipsIsVisible" :class="{active: state.tipsIsVisible}")
      span ?

  .row.invite-url-segmented-buttons(v-if="spaceIsPrivate")
    .segmented-buttons
      button(@click="toggleInviteType('edit')" :class="{active: inviteTypeIsEdit}")
        span Can Edit
      button(@click="toggleInviteType('readOnly')" :class="{active: inviteTypeIsReadOnly}")
        span Read Only

  section.subsection.invite-url-subsection
    //- Copy Invite
    .row
      .segmented-buttons
        button(@click.left="copyInviteUrl")
          img.icon.copy(src="@/assets/copy.svg")
          span {{inviteButtonLabel}}
        button(v-if="webShareIsSupported" @click="webShareInvite")
          img.icon.share(src="@/assets/share.svg")
    .row(v-if="inviteTypeIsEdit")
      .button-wrap
        button(@click.stop="toggleEmailInvitesIsVisible" :class="{ active: state.emailInvitesIsVisible }")
          img.icon.mail(src="@/assets/mail.svg")
          span Email Invites
      EmailInvites(:visible="state.emailInvitesIsVisible")
    //- Tips
    template(v-if="state.tipsIsVisible")
      .row
        p No account is needed to read spaces, but editing requires an account
      .row
        p.badge.success You'll both earn a $6 credit when someone you invite signs up for a Kinopio account
      .row(v-if="currentUserIsUpgraded")
        p.badge.success
          span Because your account is upgraded, others can create cards here for free

</template>

<style lang="stylus">
section.invite
  user-select text
  .badge
    margin 0
    color var(--primary)
    vertical-align 0
  .users
    margin-right 5px
  .invite-url-segmented-buttons
    margin-bottom 0
    button
      border-bottom-left-radius 0
      border-bottom-right-radius 0
    + .invite-url-subsection
      border-top-left-radius 0
</style>
