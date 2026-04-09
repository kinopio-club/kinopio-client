<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import UserBillingSettings from '@/components/dialogs/UserBillingSettings.vue'
import UserAccountSettings from '@/components/dialogs/UserAccountSettings.vue'
import UserAPIInfo from '@/components/dialogs/UserAPIInfo.vue'
import NotificationSettings from '@/components/dialogs/NotificationSettings.vue'
import DeleteAllConfirmation from '@/components/dialogs/DeleteAllConfirmation.vue'
import ThemeSettings from '@/components/dialogs/ThemeSettings.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import ModeratorActions from '@/components/dialogs/ModeratorActions.vue'
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

const currentUser = computed(() => userStore.getUserAllState)
const isModerator = computed(() => userStore.isModerator)
const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)

const state = reactive({
  userBillingSettingsIsVisible: false,
  userAccountSettingsIsVisible: false,
  deleteAllConfirmationVisible: false,
  userAPIInfoIsVisible: false,
  moderatorActionsSettingsIsVisible: false,
  notificationSettingsIsVisible: false,
  themeSettingsIsVisible: false
})

// dialog

const closeDialogs = () => {
  state.userBillingSettingsIsVisible = false
  state.userAccountSettingsIsVisible = false
  state.notificationSettingsIsVisible = false
  state.themeSettingsIsVisible = false
  state.userAPIInfoIsVisible = false
  state.moderatorActionsSettingsIsVisible = false
  state.deleteAllConfirmationVisible = false
}

// child dialog state

const toggleDeleteAllConfirmationVisible = () => {
  state.deleteAllConfirmationVisible = !state.deleteAllConfirmationVisible
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
const toggleUserAPIInfoIsVisible = () => {
  const isVisible = state.userAPIInfoIsVisible
  closeDialogs()
  state.userAPIInfoIsVisible = !isVisible
}
const toggleModeratorActionsSettingsIsVisible = () => {
  const isVisible = state.moderatorActionsSettingsIsVisible
  closeDialogs()
  state.moderatorActionsSettingsIsVisible = !isVisible
}

// debug mode

const isDebugMode = computed(() => { return userStore.isDebugMode })
const toggleIsDebugMode = () => {
  const value = !isDebugMode.value
  userStore.updateUser({ isDebugMode: value })
}
</script>

<template lang="pug">
.user-settings-general(v-if="visible" @click="closeDialogs")
  section
    //- Notifications
    .row
      .button-wrap
        button(@click.left.stop="toggleNotificationSettingsIsVisible" :class="{active: state.notificationSettingsIsVisible}")
          img.icon.mail(src="@/assets/mail.svg")
          span Notifications
        NotificationSettings(:visible="state.notificationSettingsIsVisible")
    //- Theme and Colors
    .row
      .button-wrap
        .segmented-buttons
          ThemeToggle
          button(@click.left.stop="toggleThemeSettingsIsVisible" :class="{active: state.themeSettingsIsVisible}")
            span Theme Settings
        ThemeSettings(:visible="state.themeSettingsIsVisible")
  //- Account Settings
  section
    .row
      //- Account
      .button-wrap
        button(@click.left.stop="toggleUserAccountSettingsIsVisible" :class="{active: state.userAccountSettingsIsVisible}")
          User(:user="currentUser" :isClickable="false" :hideYouLabel="true" :key="currentUser.id" :isSmall="true")
          span Account
        UserAccountSettings(:visible="state.userAccountSettingsIsVisible")
      //- Billing
      .button-wrap
        button(@click.left.stop="toggleUserBillingSettingsIsVisible" :class="{active: state.userBillingSettingsIsVisible}")
          span(v-if="isSecureAppContextIOS") Billing
          span(v-else) Billing
        UserBillingSettings(:visible="state.userBillingSettingsIsVisible")
  section
    .row
      //- API/Developer Info
      .button-wrap
        button(@click.left.stop="toggleUserAPIInfoIsVisible" :class="{active: state.userAPIInfoIsVisible}")
          img.icon.key(src="@/assets/key.svg")
          span API
        UserAPIInfo(:visible="state.userAPIInfoIsVisible")
      .button-wrap
        label(:class="{active: isDebugMode}" @click.left.prevent="toggleIsDebugMode" @keydown.stop.enter="toggleIsDebugMode")
          input(type="checkbox" v-model="isDebugMode")
          span Debug Mode
    //- Moderator Actions
    .row(v-if="isModerator")
      .button-wrap
        button(@click.left.stop="toggleModeratorActionsSettingsIsVisible" :class="{active: state.moderatorActionsSettingsIsVisible}")
          span Moderator
        ModeratorActions(:visible="state.moderatorActionsSettingsIsVisible")
  //- Delete Account
  section.delete-account
    .row
      .button-wrap
        button.danger(@click.left.stop="toggleDeleteAllConfirmationVisible" :class="{ active: state.deleteAllConfirmationVisible }")
          img.icon(src="@/assets/remove.svg")
          span Delete Account
        DeleteAllConfirmation(:visible="state.deleteAllConfirmationVisible" @toggleUserBillingSettingsIsVisible="toggleUserBillingSettingsIsVisible")
</template>

<style lang="stylus">
.user-settings-general
  section:not(.subsection)
    border-top 1px solid var(--primary-border)
    border-radius 0 !important
</style>
