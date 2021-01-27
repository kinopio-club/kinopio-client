<template lang="pug">
dialog.narrow(v-if="visible" :open="visible" @click.left.stop)
  section
    p Notification Settings
  section
    template(v-if="!currentUserIsSignedIn")
      p After you sign up you'll be able to manage your notification settings here
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    template(v-else)
      .row Receive emails when a collaborator adds a card to your spaces
      .row
        label(:class="{active: shouldEmailNotifications}" @click.left.prevent="toggleShouldEmailNotifications" @keydown.stop.enter="toggleShouldEmailNotifications")
          input(type="checkbox" v-model="shouldEmailNotifications")
          span Email Notifications
      .row A biweekly newsletter about upcoming features and cool spaces
      .row
        label(:class="{active: shouldEmailBulletin}" @click.left.prevent="toggleShouldEmailBulletin" @keydown.stop.enter="toggleShouldEmailBulletin")
          input(type="checkbox" v-model="shouldEmailBulletin")
          span Email Bulletins
</template>

<script>

export default {
  name: 'NotificationSettings',
  props: {
    visible: Boolean
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
    }
  }
}
</script>

<style lang="stylus">
</style>
