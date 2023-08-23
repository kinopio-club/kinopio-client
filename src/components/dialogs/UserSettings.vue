<template lang="pug">
dialog.user-settings.narrow(v-if="visible" :open="visible" ref="dialog" @click.left.stop="closeDialogs")
  section
    p User Settings

  //- User Preferences
  section
    //- Controls
    .row
      .button-wrap
        button(@click.left.stop="toggleControlsSettingsIsVisible" :class="{active: controlsSettingsIsVisible}")
          span Controls
        ControlsSettings(:visible="controlsSettingsIsVisible")
    //- Notifications
    .row
      .button-wrap
        button(@click.left.stop="toggleNotificationSettingsIsVisible" :class="{active: notificationSettingsIsVisible}")
          span Notifications
        NotificationSettings(:visible="notificationSettingsIsVisible")
    //- Theme and Colors
    .row
      .button-wrap
        .segmented-buttons
          button(@click.left.stop="toggleThemeSettingsIsVisible" :class="{active: themeSettingsIsVisible}")
            span Theme
          ThemeToggle
        ThemeSettings(:visible="themeSettingsIsVisible")

  //- Account Settings
  section
    .row
      .button-wrap
        button(@click.left.stop="toggleUserAccountSettingsIsVisible" :class="{active: userAccountSettingsIsVisible}")
          User(:user="currentUser" :isClickable="false" :hideYouLabel="true" :key="currentUser.id")
          span Account
        UserAccountSettings(:visible="userAccountSettingsIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="toggleUserBillingAndCreditsIsVisible" :class="{active: userBillingAndCreditsIsVisible}")
          span Billing and Credits
        UserBillingAndCredits(:visible="userBillingAndCreditsIsVisible")

  //- Delete Account
  section.delete-account
    .row
      button.danger(v-if="!deleteAllConfirmationVisible" @click.left="toggleDeleteAllConfirmationVisible")
        img.icon(src="@/assets/remove.svg")
        span Delete All Your Data
      span(v-if="deleteAllConfirmationVisible")
        p
          span.badge.danger Permanently delete
          span(v-if="isSignedIn") all your spaces and user data from this computer and Kinopio's servers?
          span(v-else) all your spaces and user data from this computer?
        section.subsection(v-if="isUpgraded")
          span Or cancel paid subscription
          .row.billing-cancel
            button(@click.left.stop="toggleUserBillingAndCreditsIsVisible")
              span Billing

        .segmented-buttons
          button(@click.left="toggleDeleteAllConfirmationVisible")
            img.icon.cancel(src="@/assets/add.svg")
            span Cancel
          button.danger(@click.left="deleteUserPermanent")
            img.icon(src="@/assets/remove.svg")
            span Delete All
            Loader(:visible="loading.deleteUserPermanent")

</template>

<script>
import UserBillingAndCredits from '@/components/dialogs/UserBillingAndCredits.vue'
import UserAccountSettings from '@/components/dialogs/UserAccountSettings.vue'
import NotificationSettings from '@/components/dialogs/NotificationSettings.vue'
import ControlsSettings from '@/components/dialogs/ControlsSettings.vue'
import ThemeSettings from '@/components/dialogs/ThemeSettings.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import User from '@/components/User.vue'

export default {
  name: 'UserSettings',
  components: {
    Loader,
    UserBillingAndCredits,
    UserAccountSettings,
    NotificationSettings,
    ControlsSettings,
    ThemeSettings,
    ThemeToggle,
    User
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'triggerControlsSettingsIsVisible') {
        this.controlsSettingsIsVisible = true
      }
    })
  },
  data () {
    return {
      userBillingAndCreditsIsVisible: false,
      userAccountSettingsIsVisible: false,
      deleteAllConfirmationVisible: false,
      loading: {
        deleteUserPermanent: false
      },
      notificationSettingsIsVisible: false,
      controlsSettingsIsVisible: false,
      themeSettingsIsVisible: false
    }
  },
  computed: {
    visible () { return this.$store.state.userSettingsIsVisible },
    isSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    isUpgraded () { return this.$store.state.currentUser.isUpgraded },
    currentUser () { return this.$store.state.currentUser }
  },
  methods: {
    closeDialogs () {
      this.userBillingAndCreditsIsVisible = false
      this.userAccountSettingsIsVisible = false
      this.notificationSettingsIsVisible = false
      this.controlsSettingsIsVisible = false
      this.themeSettingsIsVisible = false
    },
    toggleDeleteAllConfirmationVisible () {
      this.deleteAllConfirmationVisible = !this.deleteAllConfirmationVisible
    },
    async deleteUserPermanent () {
      this.loading.deleteUserPermanent = true
      if (this.$store.state.currentUser.isUpgraded) {
        await this.$store.dispatch('api/cancelSubscription', {
          userId: this.$store.state.currentUser.id
        })
      }
      await this.$store.dispatch('api/deleteUserPermanent')
      cache.removeAll()
      // clear history wipe state from vue-router
      window.history.replaceState({}, 'Kinopio', '/')
      location.reload()
      this.loading.deleteUserPermanent = false
    },
    toggleControlsSettingsIsVisible () {
      const isVisible = this.controlsSettingsIsVisible
      this.closeDialogs()
      this.deleteAllConfirmationVisible = false
      this.controlsSettingsIsVisible = !isVisible
    },
    toggleUserBillingAndCreditsIsVisible () {
      const isVisible = this.userBillingAndCreditsIsVisible
      this.closeDialogs()
      this.deleteAllConfirmationVisible = false
      this.userBillingAndCreditsIsVisible = !isVisible
    },
    toggleUserAccountSettingsIsVisible () {
      const isVisible = this.userAccountSettingsIsVisible
      this.closeDialogs()
      this.deleteAllConfirmationVisible = false
      this.userAccountSettingsIsVisible = !isVisible
    },
    toggleNotificationSettingsIsVisible () {
      const isVisible = this.notificationSettingsIsVisible
      this.closeDialogs()
      this.deleteAllConfirmationVisible = false
      this.notificationSettingsIsVisible = !isVisible
    },
    toggleThemeSettingsIsVisible () {
      const isVisible = this.themeSettingsIsVisible
      this.closeDialogs()
      this.deleteAllConfirmationVisible = false
      this.themeSettingsIsVisible = !isVisible
    }

  },
  watch: {
    visible (value) {
      if (value) {
        this.deleteAllConfirmationVisible = false
        this.closeDialogs()
      }
    }
  }
}
</script>

<style lang="stylus">
dialog.user-settings
  left initial
  right 16px
  .billing-cancel
    margin-top 2px
    padding-bottom 2px
  .delete-account
    .subsection
      margin-top 10px
      margin-bottom 10px
</style>
