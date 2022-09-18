<template lang="pug">
.badge.status.explore-message(v-if="showInExplore && !isSpaceMember")
  img.icon.sunglasses(src="@/assets/sunglasses.svg")
  span Explore

.button-wrap.add-to-explore(v-if="isSpaceMember")
  button(:class="{active: showInExplore}" @click.left.prevent="toggleShowInExplore" @keydown.stop.enter="toggleShowInExplore")
    img.icon.sunglasses(src="@/assets/sunglasses.svg")
    span(v-if="showInExplore") In Explore
    span(v-else) Add to Explore

  template(v-if="error.userNeedsToSignUpOrIn")
    p
      span.badge.info Sign Up or In
      span for your spaces to be accessible to others
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

  template(v-else-if="error.spaceMustBeEdited")
    p
      span.badge.info Edit and rename this space
      span to add to explore

  template(v-else-if="error.spaceCardsMinimum")
    p
      span.badge.info Space needs more than 10 cards
      span to add to explore

</template>

<script>
export default {
  name: 'ShowInExploreButton',
  emits: ['updateSpaces'],
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'currentSpace/restoreSpace') {
        this.clearErrors()
      }
    })
  },
  data () {
    return {
      error: {
        userNeedsToSignUpOrIn: false,
        spaceMustBeEdited: false,
        spaceCardsMinimum: false
      }
    }
  },
  computed: {
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    showInExplore () { return this.$store.state.currentSpace.showInExplore },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    spaceIsHelloKinopio () { return this.$store.getters['currentSpace/isHelloKinopio'] },
    spaceCardsCount () { return this.$store.getters['currentCards/all'].length }
  },
  methods: {
    checkIfShouldPrevent () {
      if (this.showInExplore) { return true }
      if (!this.currentUserIsSignedIn) {
        this.error.userNeedsToSignUpOrIn = true
        return true
      }
      if (this.spaceIsHelloKinopio) {
        this.error.spaceMustBeEdited = true
        return true
      }
      if (this.spaceCardsCount < 10) {
        this.error.spaceCardsMinimum = true
        return true
      }
    },
    toggleShowInExplore () {
      const shouldPrevent = this.checkIfShouldPrevent()
      if (shouldPrevent) { return }
      const currentPrivacy = this.$store.state.currentSpace.privacy
      if (currentPrivacy === 'private') {
        this.$store.dispatch('currentSpace/updateSpace', { privacy: 'closed' })
      }
      const value = !this.showInExplore
      this.$store.dispatch('currentSpace/updateSpace', { showInExplore: value })
      this.$emit('updateSpaces')
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'ShowInExploreButton.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    clearErrors () {
      this.error.userNeedsToSignUpOrIn = false
      this.error.spaceMustBeEdited = false
      this.error.spaceCardsMinimum = false
    }
  },
  watch: {
    visible (visible) {
      this.clearErrors()
    }
  }
}
</script>

<style lang="stylus">
.add-to-explore
  input
    vertical-align -1px !important
</style>
