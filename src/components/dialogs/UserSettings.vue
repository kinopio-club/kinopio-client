<template lang="pug">
dialog.user-settings.narrow(v-if="visible" :open="visible" ref="dialog" @click.left.stop="closeDialogs")
  section
    p User Settings

  //- User Preferences
  section
    .row
      .button-wrap
        button(@click.left.stop="toggleControlsSettingsIsVisible" :class="{active: controlsSettingsIsVisible}")
          span Controls
        ControlsSettings(:visible="controlsSettingsIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="toggleNotificationSettingsIsVisible" :class="{active: notificationSettingsIsVisible}")
          span Notifications
        NotificationSettings(:visible="notificationSettingsIsVisible")

  //- Account Settings
  section
    .row
      .button-wrap
        button(@click.left.stop="toggleApiKeyIsVisible" :class="{active: apiKeyIsVisible}")
          span API Key
        ApiKey(:visible="apiKeyIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="toggleUpdateEmailIsVisible" :class="{active: updateEmailIsVisible}")
          span Update Email
        UpdateEmail(:visible="updateEmailIsVisible")
    .row
      .button-wrap
        button(@click.left.stop="toggleUserBillingIsVisible" :class="{active: userBillingIsVisible}")
          span Billing
        UserBilling(:visible="userBillingIsVisible")

    .row
      button.danger(v-if="!removeAllConfirmationVisible" @click.left="toggleRemoveAllConfirmationVisible")
        img.icon(src="@/assets/remove.svg")
        span Remove All Your Data
      span(v-if="removeAllConfirmationVisible")
        p
          span.badge.danger Permanently remove
          span(v-if="isSignedIn") all your spaces and user data from this computer and Kinopio's servers?
          span(v-else) all your spaces and user data from this computer?
        p(v-if="isUpgraded")
          span.badge.info.badge-billing Use Billing ⤴
          span if you just want to cancel your paid subscription
        .segmented-buttons
          button(@click.left="toggleRemoveAllConfirmationVisible")
            span Cancel
          button.danger(@click.left="removeUserPermanent")
            img.icon(src="@/assets/remove.svg")
            span Remove All
            Loader(:visible="loading.removeUserPermanent")

</template>

<script>
import UserBilling from '@/components/dialogs/UserBilling.vue'
import UpdateEmail from '@/components/dialogs/UpdateEmail.vue'
import ApiKey from '@/components/dialogs/ApiKey.vue'
import NotificationSettings from '@/components/dialogs/NotificationSettings.vue'
import ControlsSettings from '@/components/dialogs/ControlsSettings.vue'
import Loader from '@/components/Loader.vue'

export default {
  name: 'UserSettings',
  components: {
    Loader,
    UserBilling,
    UpdateEmail,
    ApiKey,
    NotificationSettings,
    ControlsSettings
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      userBillingIsVisible: false,
      updateEmailIsVisible: false,
      apiKeyIsVisible: false,
      removeAllConfirmationVisible: false,
      loading: {
        removeUserPermanent: false
      },
      notificationSettingsIsVisible: false,
      controlsSettingsIsVisible: false
    }
  },
  computed: {
    isSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    isUpgraded () { return this.$store.state.currentUser.isUpgraded }
  },
  methods: {
    closeDialogs () {
      this.userBillingIsVisible = false
      this.updateEmailIsVisible = false
      this.apiKeyIsVisible = false
      this.notificationSettingsIsVisible = false
      this.controlsSettingsIsVisible = false
    },
    toggleRemoveAllConfirmationVisible () {
      this.removeAllConfirmationVisible = !this.removeAllConfirmationVisible
    },
    async removeUserPermanent () {
      this.loading.removeUserPermanent = true
      if (this.$store.state.currentUser.isUpgraded) {
        await this.$store.dispatch('api/cancelSubscription', {
          userId: this.$store.state.currentUser.id
        })
      }
      await this.$store.dispatch('api/removeUserPermanent')
      this.loading.removeUserPermanent = false
      this.$emit('removeUser')
    },
    toggleControlsSettingsIsVisible () {
      const isVisible = this.controlsSettingsIsVisible
      this.closeDialogs()
      this.controlsSettingsIsVisible = !isVisible
    },
    toggleUserBillingIsVisible () {
      const isVisible = this.userBillingIsVisible
      this.closeDialogs()
      this.userBillingIsVisible = !isVisible
    },
    toggleUpdateEmailIsVisible () {
      const isVisible = this.updateEmailIsVisible
      this.closeDialogs()
      this.updateEmailIsVisible = !isVisible
    },
    toggleNotificationSettingsIsVisible () {
      const isVisible = this.notificationSettingsIsVisible
      this.closeDialogs()
      this.notificationSettingsIsVisible = !isVisible
    },
    toggleApiKeyIsVisible () {
      const isVisible = this.apiKeyIsVisible
      this.closeDialogs()
      this.apiKeyIsVisible = !isVisible
    }
  },
  watch: {
    visible (value) {
      if (value) {
        this.removeAllConfirmationVisible = false
        this.closeDialogs()
      }
    }
  }
}
</script>

<style lang="stylus">
  @media(max-height 500px)
    .user-settings
      top -100px !important
</style>
