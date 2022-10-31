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
    //- Integrations
    .row
      .button-wrap
        button(@click.left.stop="toggleIntegrationsSettingsIsVisible" :class="{active: integrationsSettingsIsVisible}")
          span Integrations
    .row(v-if="integrationsSettingsIsVisible")
      .button-wrap
        button(@click.left.stop="toggleConnectToTwitterIsVisible" :class="{ active: connectToTwitterIsVisible}")
          img.icon.tweet(src="@/assets/twitter.svg")
          template(v-if="twitterUsername")
            span Connected to Twitter
          template(v-else)
            span Connect to Twitter
        ConnectToTwitter(:visible="connectToTwitterIsVisible")
    //- Notifications
    .row
      .button-wrap
        button(@click.left.stop="toggleNotificationSettingsIsVisible" :class="{active: notificationSettingsIsVisible}")
          span Notifications
        NotificationSettings(:visible="notificationSettingsIsVisible")
    //- Theme and Colors
    .row
      .button-wrap
        button(@click.left.stop="toggleThemeAndColorsSettingsIsVisible" :class="{active: themeAndColorsSettingsIsVisible}")
          span Theme and Colors
        ThemeAndColorsSettings(:visible="themeAndColorsSettingsIsVisible")

  //- Account Settings
  section
    .row
      .button-wrap
        button(@click.left.stop="toggleApiKeyIsVisible" :class="{active: apiKeyIsVisible}")
          span API Key
        ApiKey(:visible="apiKeyIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="toggleUserBillingIsVisible" :class="{active: userBillingIsVisible}")
          span Billing
        UserBilling(:visible="userBillingIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="toggleUpdateEmailIsVisible" :class="{active: updateEmailIsVisible}")
          span Update Email
        UpdateEmail(:visible="updateEmailIsVisible")

  //- Delete Account
  section
    .row
      button.danger(v-if="!deleteAllConfirmationVisible" @click.left="toggleDeleteAllConfirmationVisible")
        img.icon(src="@/assets/remove.svg")
        span Delete All Your Data
      span(v-if="deleteAllConfirmationVisible")
        p
          span.badge.danger Permanently delete
          span(v-if="isSignedIn") all your spaces and user data from this computer and Kinopio's servers?
          span(v-else) all your spaces and user data from this computer?
        p.badge.secondary(v-if="isUpgraded")
          //- span.badge.info.badge-billing Use Billing ⤴
          //- .row.billing-cancel
          span Or cancel paid subscription
          .row.billing-cancel
            button(@click.left.stop="toggleUserBillingIsVisible")
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
import UserBilling from '@/components/dialogs/UserBilling.vue'
import UpdateEmail from '@/components/dialogs/UpdateEmail.vue'
import ApiKey from '@/components/dialogs/ApiKey.vue'
import NotificationSettings from '@/components/dialogs/NotificationSettings.vue'
import ControlsSettings from '@/components/dialogs/ControlsSettings.vue'
import ConnectToTwitter from '@/components/dialogs/ConnectToTwitter.vue'
import ThemeAndColorsSettings from '@/components/dialogs/ThemeAndColorsSettings.vue'
import Loader from '@/components/Loader.vue'

export default {
  name: 'UserSettings',
  components: {
    Loader,
    UserBilling,
    UpdateEmail,
    ApiKey,
    NotificationSettings,
    ControlsSettings,
    ConnectToTwitter,
    ThemeAndColorsSettings
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      userBillingIsVisible: false,
      updateEmailIsVisible: false,
      apiKeyIsVisible: false,
      deleteAllConfirmationVisible: false,
      loading: {
        deleteUserPermanent: false
      },
      notificationSettingsIsVisible: false,
      controlsSettingsIsVisible: false,
      connectToTwitterIsVisible: false,
      integrationsSettingsIsVisible: false,
      themeAndColorsSettingsIsVisible: false
    }
  },
  computed: {
    isSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    isUpgraded () { return this.$store.state.currentUser.isUpgraded },
    twitterUsername () { return this.$store.state.currentUser.twitterUsername }
  },
  methods: {
    closeDialogs () {
      this.userBillingIsVisible = false
      this.updateEmailIsVisible = false
      this.apiKeyIsVisible = false
      this.notificationSettingsIsVisible = false
      this.controlsSettingsIsVisible = false
      this.connectToTwitterIsVisible = false
      this.themeAndColorsSettingsIsVisible = false
    },
    toggleConnectToTwitterIsVisible () {
      const isVisible = this.connectToTwitterIsVisible
      this.closeDialogs()
      this.connectToTwitterIsVisible = !isVisible
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
      this.loading.deleteUserPermanent = false
      this.$emit('removeUser')
    },
    toggleControlsSettingsIsVisible () {
      const isVisible = this.controlsSettingsIsVisible
      this.closeDialogs()
      this.deleteAllConfirmationVisible = false
      this.controlsSettingsIsVisible = !isVisible
    },
    toggleUserBillingIsVisible () {
      const isVisible = this.userBillingIsVisible
      this.closeDialogs()
      this.deleteAllConfirmationVisible = false
      this.userBillingIsVisible = !isVisible
    },
    toggleUpdateEmailIsVisible () {
      const isVisible = this.updateEmailIsVisible
      this.closeDialogs()
      this.deleteAllConfirmationVisible = false
      this.updateEmailIsVisible = !isVisible
    },
    toggleNotificationSettingsIsVisible () {
      const isVisible = this.notificationSettingsIsVisible
      this.closeDialogs()
      this.deleteAllConfirmationVisible = false
      this.notificationSettingsIsVisible = !isVisible
    },
    toggleApiKeyIsVisible () {
      const isVisible = this.apiKeyIsVisible
      this.closeDialogs()
      this.deleteAllConfirmationVisible = false
      this.apiKeyIsVisible = !isVisible
    },
    toggleIntegrationsSettingsIsVisible () {
      this.deleteAllConfirmationVisible = false
      this.integrationsSettingsIsVisible = !this.integrationsSettingsIsVisible
    },
    toggleThemeAndColorsSettingsIsVisible () {
      const isVisible = this.themeAndColorsSettingsIsVisible
      this.closeDialogs()
      this.deleteAllConfirmationVisible = false
      this.themeAndColorsSettingsIsVisible = !isVisible
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
  @media(max-height 600px)
    .user-settings
      top -100px !important
  .billing-cancel
    margin-top 2px
    padding-bottom 2px
</style>
