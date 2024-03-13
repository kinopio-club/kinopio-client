<script setup>
import { reactive, computed, onMounted, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserBillingSettings from '@/components/dialogs/UserBillingSettings.vue'
import UserAccountSettings from '@/components/dialogs/UserAccountSettings.vue'
import NotificationSettings from '@/components/dialogs/NotificationSettings.vue'
import ThemeAndColorsSettings from '@/components/dialogs/ThemeAndColorsSettings.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import User from '@/components/User.vue'
import consts from '@/consts.js'

const store = useStore()

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerCloseChildDialogs') {
      closeChildDialogs()
    }
  })
})

const props = defineProps({
  visible: Boolean
})

const isSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const isUpgraded = computed(() => store.state.currentUser.isUpgraded)
const currentUser = computed(() => store.state.currentUser)
const isSecureAppContextIOS = computed(() => consts.isSecureAppContextIOS)

const state = reactive({
  userBillingSettingsIsVisible: false,
  userAccountSettingsIsVisible: false,
  deleteAllConfirmationVisible: false,
  loading: {
    deleteUserPermanent: false
  },
  notificationSettingsIsVisible: false,
  themeAndColorsSettingsIsVisible: false
})

// dialog

const closeChildDialogs = () => {
  state.userBillingSettingsIsVisible = false
  state.userAccountSettingsIsVisible = false
  state.notificationSettingsIsVisible = false
  state.themeAndColorsSettingsIsVisible = false
}

// child dialog state

const toggleDeleteAllConfirmationVisible = () => {
  state.deleteAllConfirmationVisible = !state.deleteAllConfirmationVisible
}
const toggleUserBillingSettingsIsVisible = () => {
  const isVisible = state.userBillingSettingsIsVisible
  closeChildDialogs()
  state.deleteAllConfirmationVisible = false
  state.userBillingSettingsIsVisible = !isVisible
}
const toggleUserAccountSettingsIsVisible = () => {
  const isVisible = state.userAccountSettingsIsVisible
  closeChildDialogs()
  state.deleteAllConfirmationVisible = false
  state.userAccountSettingsIsVisible = !isVisible
}
const toggleNotificationSettingsIsVisible = () => {
  const isVisible = state.notificationSettingsIsVisible
  closeChildDialogs()
  state.deleteAllConfirmationVisible = false
  state.notificationSettingsIsVisible = !isVisible
}
const toggleThemeAndColorsSettingsIsVisible = () => {
  const isVisible = state.themeAndColorsSettingsIsVisible
  closeChildDialogs()
  state.deleteAllConfirmationVisible = false
  state.themeAndColorsSettingsIsVisible = !isVisible
}

// delete user

const deleteUserPermanent = async () => {
  state.loading.deleteUserPermanent = true
  if (store.state.currentUser.isUpgraded) {
    await store.dispatch('api/cancelSubscription', {
      userId: store.state.currentUser.id
    })
  }
  await store.dispatch('api/deleteUserPermanent')
  cache.removeAll()
  // clear history wipe state from vue-router
  window.history.replaceState({}, 'Kinopio', '/')
  location.reload()
  state.loading.deleteUserPermanent = false
}
</script>

<template lang="pug">
.user-settings-general(v-if="visible")
  section
    //- Notifications
    .row
      .button-wrap
        button(@click.left.stop="toggleNotificationSettingsIsVisible" :class="{active: state.notificationSettingsIsVisible}")
          span Notifications
        NotificationSettings(:visible="state.notificationSettingsIsVisible")
    //- Theme and Colors
    .row
      .button-wrap
        .segmented-buttons
          button(@click.left.stop="toggleThemeAndColorsSettingsIsVisible" :class="{active: state.themeAndColorsSettingsIsVisible}")
            span Theme and Colors
          ThemeToggle
        ThemeAndColorsSettings(:visible="state.themeAndColorsSettingsIsVisible")
  //- Account Settings
  section
    .row
      .button-wrap
        button(@click.left.stop="toggleUserAccountSettingsIsVisible" :class="{active: state.userAccountSettingsIsVisible}")
          User(:user="currentUser" :isClickable="false" :hideYouLabel="true" :key="currentUser.id")
          span Account
        UserAccountSettings(:visible="state.userAccountSettingsIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="toggleUserBillingSettingsIsVisible" :class="{active: state.userBillingSettingsIsVisible}")
          span(v-if="isSecureAppContextIOS") Billing
          span(v-else) Billing
        UserBillingSettings(:visible="state.userBillingSettingsIsVisible")
  //- Delete Account
  section.delete-account
    .row
      button.danger(v-if="!state.deleteAllConfirmationVisible" @click.left="toggleDeleteAllConfirmationVisible")
        img.icon(src="@/assets/remove.svg")
        span Delete All Your Data
      span(v-if="state.deleteAllConfirmationVisible")
        p
          span.badge.danger Permanently delete
          span(v-if="isSignedIn") all your spaces and user data from this computer and Kinopio's servers?
          span(v-else) all your spaces and user data from this computer?
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
  section
    border-top 1px solid var(--primary-border)
    border-radius 0 !important
</style>
