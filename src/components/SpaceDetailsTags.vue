<template lang="pug">
.row.space-details-tags(v-if="isVisible")
  button(:class="{active: currentSpaceHasTag}")
    span Tag
  .horizontal-row
    .badge.button-badge.test1.active my cool tag
    //- .badge.button-badge.test2 feature
</template>

<script>
export default {
  name: 'SpaceDetailsTags',
  data () {
    return {
      isVisible: true // temp,
    }
  },
  computed: {
    currentSpaceHasTag () { return true } // temp
    // showInExplore () { return this.$store.state.currentSpace.showInExplore },
    // currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    // isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    // isVisible () {
    //   return !this.isSpaceMember && !this.showInExplore
    // }
  },
  methods: {
    // askToAddToExplore () {
    //   if (this.isAsked) { return }
    //   if (!this.currentUserIsSignedIn) {
    //     this.error.userNeedsToSignUpOrIn = true
    //     return
    //   }
    //   const userId = this.$store.state.currentUser.id
    //   const spaceId = this.$store.state.currentSpace.id
    //   let recipientUserIds = this.$store.getters['currentSpace/userIdsToNotify']
    //   recipientUserIds = recipientUserIds.filter(id => Boolean(id))
    //   const notification = {
    //     type: 'askToAddToExplore',
    //     userId,
    //     spaceId,
    //     recipientUserIds
    //   }
    //   this.$store.dispatch('api/addToQueue', { name: 'createAskToAddToExploreNotification', body: notification })
    //   this.isAsked = true
    // },
    // triggerSignUpOrInIsVisible () {
    //   this.$store.dispatch('closeAllDialogs', 'askToAddToExplore.triggerSignUpOrInIsVisible')
    //   this.$store.commit('triggerSignUpOrInIsVisible')
    // }
  }
}
</script>

<style lang="stylus">
.space-details-tags
  .horizontal-row
    margin-left 6px
    .badge + .badge
      margin-left 6px

  .test1
    background-color #fcc3f6
  .test2
    background-color #df75f4
</style>
