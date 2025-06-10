<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import UserBillingSettings from '@/components/dialogs/UserBillingSettings.vue'
import UserAccountSettings from '@/components/dialogs/UserAccountSettings.vue'
import UserDeveloperInfo from '@/components/dialogs/UserDeveloperInfo.vue'
import NotificationSettings from '@/components/dialogs/NotificationSettings.vue'
import ThemeSettings from '@/components/dialogs/ThemeSettings.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import User from '@/components/User.vue'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

let unsubscribes

onMounted(() => {
  const globalStoreUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerCloseChildDialogs') {
        closeDialogs()
      }
    }
  )
  unsubscribes = () => {
    globalStoreUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const props = defineProps({
  visible: Boolean
})

const isSignedIn = computed(() => userStore.getUserIsSignedIn)
const isUpgraded = computed(() => userStore.isUpgraded)
const currentUser = computed(() => userStore.getUserAllState)
const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)

const state = reactive({
  userBillingSettingsIsVisible: false,
  userAccountSettingsIsVisible: false,
  deleteAllConfirmationVisible: false,
  userDeveloperInfoIsVisible: false,
  loading: {
    deleteUserPermanent: false
  },
  notificationSettingsIsVisible: false,
  themeSettingsIsVisible: false
})

// dialog

const closeDialogs = () => {
  state.userBillingSettingsIsVisible = false
  state.userAccountSettingsIsVisible = false
  state.notificationSettingsIsVisible = false
  state.themeSettingsIsVisible = false
  state.userDeveloperInfoIsVisible = false
}

// child dialog state

const closeConfirmations = () => {
  state.deleteAllConfirmationVisible = false
}
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
  closeConfirmations()
  state.userAccountSettingsIsVisible = !isVisible
}
const toggleNotificationSettingsIsVisible = () => {
  const isVisible = state.notificationSettingsIsVisible
  closeDialogs()
  closeConfirmations()
  state.notificationSettingsIsVisible = !isVisible
}
const toggleThemeSettingsIsVisible = () => {
  const isVisible = state.themeSettingsIsVisible
  closeDialogs()
  closeConfirmations()
  state.themeSettingsIsVisible = !isVisible
}
const toggleUserDeveloperInfoIsVisible = () => {
  const isVisible = state.userDeveloperInfoIsVisible
  closeDialogs()
  closeConfirmations()
  state.userDeveloperInfoIsVisible = !isVisible
}

// delete user

const deleteUserPermanent = async () => {
  state.loading.deleteUserPermanent = true
  await apiStore.deleteUserPermanent()
  await cache.removeAll()
  // clear history wipe state from vue-router
  window.history.replaceState({}, 'Kinopio', '/')
  location.reload()
  state.loading.deleteUserPermanent = false
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
    .row
      //- Developer Info
      .button-wrap
        button(@click.left.stop="toggleUserDeveloperInfoIsVisible" :class="{active: state.userDeveloperInfoIsVisible}")
          img.icon.key(src="@/assets/key.svg")
          span Developer
        UserDeveloperInfo(:visible="state.userDeveloperInfoIsVisible")

  //- Delete Account
  section.delete-account
    .row
      button.danger(v-if="!state.deleteAllConfirmationVisible" @click.left="toggleDeleteAllConfirmationVisible")
        img.icon(src="@/assets/remove.svg")
        span Delete All Your Data
      span(v-if="state.deleteAllConfirmationVisible")
        p.badge.danger
          span(v-if="isSignedIn") Permanently Delete all your spaces and user data from this computer and Kinopio's servers?
          span(v-else) all your spaces and user data from this computer?
          br
          br
          span There is no going back. Please be certain.
        section.subsection(v-if="isUpgraded")
          span Or cancel paid subscription
          .row.billing-cancel
            button(@click.left.stop="toggleUserBillingSettingsIsVisible")
              span Billing

        .segmented-buttons
          button(@click.left="toggleDeleteAllConfirmationVisible")
            img.icon.cancel(src="@/assets/add.svg")
            span Cancel
          button.danger(@click.left="deleteUserPermanent")
            img.icon(src="@/assets/remove.svg")
            span Delete All
            Loader(:visible="state.loading.deleteUserPermanent")
</template>

<style lang="stylus">
.user-settings-general
  .billing-cancel
    margin-top 2px
    padding-bottom 2px
  .delete-account
    .subsection
      margin-top 10px
      margin-bottom 10px
  > section:not(.subsection)
    border-top 1px solid var(--primary-border)
    border-radius 0 !important
</style>
