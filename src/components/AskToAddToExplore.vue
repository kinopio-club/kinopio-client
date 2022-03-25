<template lang="pug">
.row(v-if="isVisible")
  .button-wrap(v-if="!creatorNotified")
    button(@click.left.prevent="askToAddToExplore" @keydown.stop.enter="askToAddToExplore")
      img.icon.sunglasses(src="@/assets/sunglasses.svg")
      span Ask to Add to Explore
    template(v-if="error.userNeedsToSignUpOrIn")
      p
        span.badge.info Sign Up or In
        span to propose spaces to be added to explore
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

  .badge.success(v-if="creatorNotified") Space Creator Notified – Thank You for Sharing the Love

</template>

<script>
export default {
  name: 'AskToAddToExploreButton',
  data () {
    return {
      error: {
        userNeedsToSignUpOrIn: false
      },
      creatorNotified: false
    }
  },
  computed: {
    showInExplore () { return this.$store.state.currentSpace.showInExplore },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    canEditSpace () { return this.$store.getters['currentUser/canEditSpace']() },
    isVisible () {
      return !this.canEditSpace && !this.showInExplore
    }
  },
  methods: {
    askToAddToExplore () {
      if (this.creatorNotified) { return }
      if (!this.currentUserIsSignedIn) {
        this.error.userNeedsToSignUpOrIn = true
        return
      }
      const userId = this.$store.state.currentUser.id
      const spaceId = this.$store.state.currentSpace.id
      let recipientUserIds = this.$store.getters['currentSpace/userIdsToNotify']
      recipientUserIds = recipientUserIds.filter(id => Boolean(id))
      const notification = {
        type: 'askToAddToExplore',
        userId,
        spaceId,
        recipientUserIds
      }
      this.$store.dispatch('api/addToQueue', { name: 'askToAddToExploreNotification', body: notification })
      this.creatorNotified = true
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'ShowInExploreButton.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    }
  }
}
</script>

<style lang="stylus">
</style>
