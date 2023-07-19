<template lang="pug">
.button-wrap.ask-to-add-to-explore(v-if="isVisible")
  template(v-if="!isAsked")
    button(@click.left.prevent="askToAddToExplore" @keydown.stop.enter="askToAddToExplore")
      img.icon.sunglasses(src="@/assets/sunglasses.svg")
      span Ask to Add to Explore
    template(v-if="error.userNeedsToSignUpOrIn")
      p
        span.badge.info Sign Up or In
        span to propose spaces to be added to explore
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

  template(v-else)
    .badge.success Space Creator Notified – Thank you for sharing the love

</template>

<script>
export default {
  name: 'AskToAddToExploreButton',
  emits: ['updateDialogHeight'],
  data () {
    return {
      error: {
        userNeedsToSignUpOrIn: false
      },
      isAsked: false
    }
  },
  computed: {
    showInExplore () { return this.$store.state.currentSpace.showInExplore },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    isVisible () {
      return !this.isSpaceMember && !this.showInExplore
    }
  },
  methods: {
    askToAddToExplore () {
      if (this.isAsked) { return }
      if (!this.currentUserIsSignedIn) {
        this.error.userNeedsToSignUpOrIn = true
        return
      }
      this.$store.dispatch('userNotifications/addAskToAddToExplore')
      this.isAsked = true
      this.$emit('updateDialogHeight')
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    }
  }
}
</script>

<style lang="stylus">
.ask-to-add-to-explore
  .icon.add
    margin-right 4px
  .badge
    display inline-block !important
</style>
