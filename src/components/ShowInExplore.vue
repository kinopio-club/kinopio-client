<template lang="pug">
.button-wrap(v-if="isSpaceMember")
  label(:class="{disabled: exploreIsDisabled, active: showInExplore}" @click.prevent="toggleShowInExplore" @keydown.stop.enter="toggleShowInExplore")
    input(type="checkbox" v-model="showInExplore")
    span {{showInExploreLabel}}

  template(v-if="!this.userIsSignedIn")
    p
      span To show in explore,
      span.badge.info you need to Sign Up or In
      span for your spaces to be accessible anywhere
    button(@click="triggerSignUpOrInIsVisible") Sign Up or In
  template(v-else-if="this.spaceIsHelloKinopio")
    p
      span To show in explore,
      span.badge.info you need to edit and rename this space first

</template>

<script>
export default {
  name: 'ShowInExplore',
  props: {
    label: String
  },
  computed: {
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    showInExplore () { return this.$store.state.currentSpace.showInExplore },
    userIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    spaceIsHelloKinopio () { return this.$store.getters['currentSpace/isHelloKinopio'] },
    exploreIsDisabled () {
      if (!this.userIsSignedIn || this.spaceIsHelloKinopio) {
        return true
      } else {
        return false
      }
    },
    showInExploreLabel () {
      return this.label || 'Show in Explore'
    }
  },
  methods: {
    toggleShowInExplore () {
      const value = !this.showInExplore
      this.$store.dispatch('currentSpace/updateSpace', { showInExplore: value })
      this.$emit('updateSpaces')
    },
    triggerSignUpOrInIsVisible () {
      this.$store.commit('closeAllDialogs')
      this.$store.commit('triggerSignUpOrInIsVisible')
    }

  }
}
</script>

<style lang="stylus">
</style>
