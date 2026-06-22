<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import UserBillingSettings from '@/components/dialogs/UserBillingSettings.vue'
import UserAccountSettings from '@/components/dialogs/UserAccountSettings.vue'
import UserApiInfo from '@/components/dialogs/UserApiInfo.vue'
import NotificationSettings from '@/components/dialogs/NotificationSettings.vue'
import DeleteAccountConfirmation from '@/components/dialogs/DeleteAccountConfirmation.vue'
import ThemeSettings from '@/components/dialogs/ThemeSettings.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import ModeratorActions from '@/components/dialogs/ModeratorActions.vue'
import DateAndTimeSettings from '@/components/dialogs/DateAndTimeSettings.vue'
import User from '@/components/User.vue'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs') {
        closeDialogs()
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

const props = defineProps({
  visible: Boolean
})

const state = reactive({
  userBillingSettingsIsVisible: false,
  userAccountSettingsIsVisible: false,
  userDateAndTimeSettingsIsVisible: false,
  deleteAccountConfirmationVisible: false,
  userApiInfoIsVisible: false,
  moderatorActionsSettingsIsVisible: false,
  notificationSettingsIsVisible: false,
  themeSettingsIsVisible: false
})

const currentUser = computed(() => userStore.getUserAllState)
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const isModerator = computed(() => userStore.isModerator)
const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)

// dialog

const closeDialogs = () => {
  state.userBillingSettingsIsVisible = false
  state.userAccountSettingsIsVisible = false
  state.userDateAndTimeSettingsIsVisible = false
  state.notificationSettingsIsVisible = false
  state.themeSettingsIsVisible = false
  state.userApiInfoIsVisible = false
  state.moderatorActionsSettingsIsVisible = false
  state.deleteAccountConfirmationVisible = false
}

// child dialog state

const toggleDeleteAccountConfirmationVisible = () => {
  const isVisible = state.deleteAccountConfirmationVisible
  closeDialogs()
  state.deleteAccountConfirmationVisible = !isVisible
}
const toggleUserBillingSettingsIsVisible = () => {
  const isVisible = state.userBillingSettingsIsVisible
  closeDialogs()
  state.userBillingSettingsIsVisible = !isVisible
}
const toggleUserAccountSettingsIsVisible = () => {
  const isVisible = state.userAccountSettingsIsVisible
  closeDialogs()
  state.userAccountSettingsIsVisible = !isVisible
}
const toggleNotificationSettingsIsVisible = () => {
  const isVisible = state.notificationSettingsIsVisible
  closeDialogs()
  state.notificationSettingsIsVisible = !isVisible
}
const toggleThemeSettingsIsVisible = () => {
  const isVisible = state.themeSettingsIsVisible
  closeDialogs()
  state.themeSettingsIsVisible = !isVisible
}
const toggleUserApiInfoIsVisible = () => {
  const isVisible = state.userApiInfoIsVisible
  closeDialogs()
  state.userApiInfoIsVisible = !isVisible
}
const toggleModeratorActionsSettingsIsVisible = () => {
  const isVisible = state.moderatorActionsSettingsIsVisible
  closeDialogs()
  state.moderatorActionsSettingsIsVisible = !isVisible
}
const toggleUserDateAndTimeSettingsIsVisible = () => {
  const isVisible = state.userDateAndTimeSettingsIsVisible
  closeDialogs()
  state.userDateAndTimeSettingsIsVisible = !isVisible
}

// debug mode

const isDebugMode = computed(() => userStore.isDebugMode)
const toggleIsDebugMode = () => {
  const value = !isDebugMode.value
  userStore.updateUser({ isDebugMode: value })
}
</script>

<template lang="pug">
.user-settings-general(v-if="visible" @click="closeDialogs")
  //- controls
  section
    //- Notifications
    .row
      .button-wrap
        button(@click.left.stop="toggleNotificationSettingsIsVisible" :class="{active: state.notificationSettingsIsVisible}")
          img.icon.mail(src="@/assets/mail.svg")
          span Notifications
          teleport(to="#settings-child-dialogs" defer)
            NotificationSettings(:visible="state.notificationSettingsIsVisible")

    //- Theme and Colors
    .row
      .button-wrap
        .segmented-buttons
          ThemeToggle
          button(@click.left.stop="toggleThemeSettingsIsVisible" :class="{active: state.themeSettingsIsVisible}")
            span Theme Settings
          teleport(to="#settings-child-dialogs" defer)
            ThemeSettings(:visible="state.themeSettingsIsVisible")

  //- Account Settings
  section
    .row
      //- Account
      .button-wrap
        button(@click.left.stop="toggleUserAccountSettingsIsVisible" :class="{active: state.userAccountSettingsIsVisible}")
          User(:user="currentUser" :isClickable="false" :hideYouLabel="true" :key="currentUser.id" :isSmall="true")
          span Account
          teleport(to="#settings-child-dialogs" defer)
            UserAccountSettings(:visible="state.userAccountSettingsIsVisible")

      //- Billing
      .button-wrap
        button(@click.left.stop="toggleUserBillingSettingsIsVisible" :class="{active: state.userBillingSettingsIsVisible}")
          span(v-if="isSecureAppContextIOS") Billing
          span(v-else) Billing
          teleport(to="#settings-child-dialogs" defer)
            UserBillingSettings(:visible="state.userBillingSettingsIsVisible")
    .row
      //- Date and Time
      .button-wrap
        button(@click.left.stop="toggleUserDateAndTimeSettingsIsVisible" :class="{active: state.userDateAndTimeSettingsIsVisible}")
          img.icon.time(src="@/assets/time.svg")
          span Date and Time
          teleport(to="#settings-child-dialogs" defer)
            DateAndTimeSettings(:visible="state.userDateAndTimeSettingsIsVisible")

  //- Developer Info
  section
    .row
      //- API
      .button-wrap(v-if="currentUserIsSignedIn")
        button(@click.left.stop="toggleUserApiInfoIsVisible" :class="{active: state.userApiInfoIsVisible}")
          img.icon.key(src="@/assets/key.svg")
          span API
          teleport(to="#settings-child-dialogs" defer)
            UserApiInfo(:visible="state.userApiInfoIsVisible")

      //- debug
      .button-wrap
        label(:class="{active: isDebugMode}" @click.left.prevent="toggleIsDebugMode" @keydown.stop.enter="toggleIsDebugMode")
          input(type="checkbox" v-model="isDebugMode")
          span Debug Mode

    //- Moderator Actions
    .row(v-if="isModerator")
      .button-wrap
        button(@click.left.stop="toggleModeratorActionsSettingsIsVisible" :class="{active: state.moderatorActionsSettingsIsVisible}")
          span Moderator
          teleport(to="#settings-child-dialogs" defer)
            ModeratorActions(:visible="state.moderatorActionsSettingsIsVisible")

  //- Delete Account
  section.delete-account
    .row
      .button-wrap
        button.danger(@click.left.stop="toggleDeleteAccountConfirmationVisible" :class="{ active: state.deleteAccountConfirmationVisible }")
          img.icon(src="@/assets/remove.svg")
          span Delete Account
          teleport(to="#settings-child-dialogs" defer)
            DeleteAccountConfirmation(:visible="state.deleteAccountConfirmationVisible" @toggleUserBillingSettingsIsVisible="toggleUserBillingSettingsIsVisible")
</template>

<style lang="stylus">
.user-settings-general
  > section:not(.subsection)
    border-top 1px solid var(--primary-border)
    border-radius 0 !important
</style>
