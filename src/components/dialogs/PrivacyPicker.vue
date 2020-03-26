<template lang="pug">
dialog.narrow.privacy-picker(v-if="visible" :open="visible" @click.stop)
  section.results-section
    ul.results-list
      template(v-for="(privacyState in privacyStates")
        li(:class="{ active: privacyStateIsActive(privacyState) }" @click="select(privacyState)")
          .badge(:class="privacyState.color")
            img.icon(:src="privacyIcon(privacyState).path" :class="privacyState.name")
            span {{privacyState.name | capitalize}}
          p.description {{privacyState.description | capitalize}}
  section(v-if="currentPrivacyIsNotPrivate")
    label(:class="{disabled: exploreIsDisabled, active: showInExplore}" @click.prevent="toggleShowInExplore" @keydown.stop.enter="toggleShowInExplore")
      input(type="checkbox" v-model="showInExplore")
      span Show in Explore

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
import privacy from '@/spaces/privacy.js'
import utils from '@/utils.js'

export default {
  name: 'PrivacyPicker',
  props: {
    visible: Boolean
  },
  filters: {
    capitalize (value) {
      return utils.capitalizeFirstLetter(value)
    }
  },
  computed: {
    showInExplore () { return this.$store.state.currentSpace.showInExplore },
    userIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    spaceIsHelloKinopio () { return this.$store.getters['currentSpace/isHelloKinopio'] },
    privacyStates () {
      const userIsSignedIn = this.$store.getters['currentUser/isSignedIn']
      const privacyStates = privacy.states()
      if (userIsSignedIn) {
        return privacyStates
      } else {
        return privacyStates.slice(1, 3)
      }
    },
    currentPrivacyIsNotPrivate () {
      const privacy = this.$store.state.currentSpace.privacy
      return privacy !== 'private'
    },
    exploreIsDisabled () {
      if (!this.userIsSignedIn || this.spaceIsHelloKinopio) {
        return true
      } else {
        return false
      }
    }
  },
  methods: {
    spaceIsPrivate (privacyState) {
      return privacyState.name === 'private'
    },
    privacyStateIsActive (privacyState) {
      const currentPrivacy = this.$store.state.currentSpace.privacy
      return privacyState.name === currentPrivacy
    },
    select (privacyState) {
      this.$store.dispatch('currentSpace/updateSpace', { privacy: privacyState.name })
      this.$emit('updateSpaces')
    },
    privacyIcon (privacyState) {
      return {
        path: require(`@/assets/${privacyState.icon}.svg`)
      }
    },
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

<style lang="stylus" scoped>
.privacy-picker
  .badge
    display inline-block
  li
    display block
  .results-section
    padding-top 4px
    max-height calc(92vh - 120px)
  .description
    margin-top 3px
</style>
