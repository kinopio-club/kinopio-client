<template lang="pug">
.button-wrap.add-to-explore(@click.stop v-if="isVisible")
  button(:class="{active: showInExplore}" @click.left.prevent="toggleShowInExplore" @keydown.stop.enter="toggleShowInExplore")
    span(v-if="!showInExplore")
    img.icon.sunglasses(src="@/assets/sunglasses.svg")
    span(v-if="!showInExplore") Add to Explore
    span(v-if="showInExplore") In Explore

  template(v-if="error.userNeedsToSignUpOrIn")
    .badge.info
      span Sign Up or In for your spaces to be accessible to others
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

  template(v-else-if="error.spaceMustBeEdited")
    .badge.info
      span Edit and rename this space to add to Explore

  template(v-else-if="error.spaceCardsMinimum")
    .badge.info
      span Space needs more than 10 cards to add to Explore

</template>

<script>
import utils from '@/utils.js'

let prevPrivacy = ''

export default {
  name: 'ShowInExploreButton',
  emits: ['updateLocalSpaces', 'updateAddToExplore'],
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'currentSpace/restoreSpace') {
        this.clearErrors()
      }
    })
  },
  props: {
    space: Object,
    visible: Boolean
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
    isVisible () {
      return this.visible || this.$store.getters['currentUser/isSpaceMember']()
    },
    showInExplore () {
      const space = this.space || this.$store.state.currentSpace
      const showInExplore = space.showInExplore
      const isNotPrivate = space.privacy !== 'private'
      return showInExplore && isNotPrivate
    },
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    spaceIsHelloKinopio () { return this.$store.getters['currentSpace/isHelloKinopio'] },
    spaceCardsCount () { return this.$store.getters['currentCards/all'].length }
  },
  methods: {
    checkIfShouldPrevent (event) {
      if (this.space) { return }
      let shouldPrevent
      if (this.showInExplore) { return }
      if (!this.currentUserIsSignedIn) {
        this.error.userNeedsToSignUpOrIn = true
        shouldPrevent = true
      }
      if (this.spaceIsHelloKinopio) {
        this.error.spaceMustBeEdited = true
        shouldPrevent = true
      }
      if (this.spaceCardsCount < 10) {
        this.error.spaceCardsMinimum = true
        shouldPrevent = true
      }
      // if (shouldPrevent) {
      //   const position = utils.cursorPositionInPage(event)
      //   this.$store.commit('addNotificationWithPosition', { message: 'Could Not Add', position, type: 'danger', layer: 'app', icon: 'cancel' })
      // }
      return shouldPrevent
    },
    toggleShowInExplore (event) {
      this.$store.commit('clearNotificationsWithPosition')
      const shouldPrevent = this.checkIfShouldPrevent(event)
      if (shouldPrevent) { return }
      if (this.space) {
        this.emitUpdateShowInExplore()
      } else {
        this.updateShowInExplore()
      }
      this.notifyShowInExplore(event)
    },
    notifyShowInExplore (event) {
      const shouldShow = this.showInExplore
      const position = utils.cursorPositionInPage(event)
      if (shouldShow) {
        this.$store.commit('addNotificationWithPosition', { message: 'Added to Explore', position, type: 'success', layer: 'app', icon: 'checkmark' })
      } else {
        this.$store.commit('addNotificationWithPosition', { message: 'Removed from Explore', position, type: 'success', layer: 'app', icon: 'checkmark' })
      }
    },
    emitUpdateShowInExplore () {
      let space = this.space
      space.showInExplore = !space.showInExplore
      this.$emit('updateAddToExplore', space)
    },
    updateShowInExplore () {
      this.updateSpacePrivacy()
      const shouldShow = !this.showInExplore
      this.$store.dispatch('currentSpace/updateSpace', { showInExplore: shouldShow })
      this.$emit('updateLocalSpaces')
    },
    updateSpacePrivacy () {
      const shouldShow = !this.showInExplore
      const currentPrivacy = this.$store.state.currentSpace.privacy
      if (shouldShow) {
        prevPrivacy = currentPrivacy
        if (currentPrivacy === 'private') {
          this.$store.dispatch('currentSpace/updateSpace', { privacy: 'closed' })
        }
      } else {
        prevPrivacy = prevPrivacy || 'closed'
        this.$store.dispatch('currentSpace/updateSpace', { privacy: prevPrivacy })
      }
    },
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs')
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
  .icon.add
    margin-right 4px
  .badge
    margin-top 10px
  button
    white-space initial !important

</style>
