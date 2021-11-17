<template lang="pug">
dialog.narrow.notification-settings(v-if="visible" :open="visible" @click.left.stop ref="dialog" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Notification Settings
  template(v-if="!currentUserIsSignedIn")
    section
      p After you sign up you'll be able to manage your notification settings here
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
  template(v-else)
    section
      .row A biweekly newsletter about upcoming features and cool spaces
      .row
        label(:class="{active: shouldEmailBulletin}" @click.left.prevent="toggleShouldEmailBulletin" @keydown.stop.enter="toggleShouldEmailBulletin")
          input(type="checkbox" v-model="shouldEmailBulletin")
          span Email Bulletins
    section
      .row Updates when collaborators add cards to your spaces
      .row
        label(:class="{active: shouldEmailNotifications}" @click.left.prevent="toggleShouldEmailNotifications" @keydown.stop.enter="toggleShouldEmailNotifications")
          input(type="checkbox" v-model="shouldEmailNotifications")
          span Email Notifications
      Loader(:visible="isLoading")

      template(v-if="unsubscribedSpaces.length")
        .row Resubscribe to:
        SpaceList(:spaces="unsubscribedSpaces" :showUser="true" @selectSpace="changeSpace" :showCheckmarkSpace="true" @checkmarkSpace="resubscribeToSpace")

</template>

<script>
import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import utils from '@/utils.js'

export default {
  name: 'NotificationSettings',
  components: {
    Loader,
    SpaceList
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      dialogHeight: null,
      unsubscribedSpaces: [],
      isLoading: true
    }
  },
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.updateDialogHeight()
      }
    })
  },
  computed: {
    isSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    shouldEmailNotifications () { return this.$store.state.currentUser.shouldEmailNotifications },
    shouldEmailBulletin () { return this.$store.state.currentUser.shouldEmailBulletin }
  },
  methods: {
    toggleShouldEmailNotifications () {
      const value = !this.shouldEmailNotifications
      this.$store.dispatch('currentUser/shouldEmailNotifications', value)
    },
    toggleShouldEmailBulletin () {
      const value = !this.shouldEmailBulletin
      this.$store.dispatch('currentUser/shouldEmailBulletin', value)
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'UserSettings.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    updateDialogHeight () {
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.dialogHeight = utils.elementHeight(element)
      })
    },
    async updateUnsubscribedSpaces () {
      this.isLoading = true
      this.unsubscribedSpaces = await this.$store.dispatch('api/getSpacesNotificationUnsubscribed')
      this.isLoading = false
    },
    resubscribeToSpace (space) {
      this.unsubscribedSpaces = this.unsubscribedSpaces.filter(item => item.id !== space.id)
      this.$store.dispatch('api/spaceNotificationResubscribe', space)
      this.$store.commit('addNotification', { message: `Resubscribed to notifications from ${space.name}`, type: 'success' })
    },
    changeSpace (space) {
      this.$store.dispatch('currentSpace/changeSpace', { space, isRemote: true })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.updateDialogHeight()
        this.updateUnsubscribedSpaces()
      }
    }
  }
}
</script>

<style lang="stylus">
.notification-settings
  overflow auto
</style>
