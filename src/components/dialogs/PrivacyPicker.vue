<template lang="pug">
dialog.narrow.privacy-picker(v-if="visible" :open="visible" @click.left.stop)
  section.results-section
    ul.results-list
      template(v-for="(privacyState in privacyStates")
        li(:class="{ active: privacyStateIsActive(privacyState) }" @click.left="select(privacyState)")
          .badge(:class="privacyState.color")
            PrivacyIcon(:privacy="privacyState.name")
            span {{ privacyStateName(privacyState) }}
          p.description {{ privacyStateDescription(privacyState) }}
</template>

<script>
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import privacy from '@/data/privacy.js'
import utils from '@/utils.js'

export default {
  name: 'PrivacyPicker',
  components: {
    PrivacyIcon
  },
  props: {
    visible: Boolean
  },
  computed: {
    currentUserIsSignedIn () { return this.$store.getters['currentUser/isSignedIn'] },
    privacyStates () {
      const currentUserIsSignedIn = this.$store.getters['currentUser/isSignedIn']
      const privacyStates = privacy.states()
      if (currentUserIsSignedIn) {
        return privacyStates
      } else {
        return privacyStates.slice(1, 3)
      }
    }
  },
  methods: {
    privacyStateName (privacyState) {
      const name = privacyState.friendlyName || privacyState.name
      return utils.capitalizeFirstLetter(name)
    },
    privacyStateDescription (privacyState) {
      const description = privacyState.description
      return utils.capitalizeFirstLetter(description)
    },
    spaceIsPrivate (privacyState) {
      return privacyState.name === 'private'
    },
    privacyStateIsActive (privacyState) {
      const currentPrivacy = this.$store.state.currentSpace.privacy
      return privacyState.name === currentPrivacy
    },
    select (privacyState) {
      this.$store.dispatch('currentSpace/updateSpace', { privacy: privacyState.name })
      this.updateLocalSpaces()
      this.$emit('closeDialogs')
    },
    updateLocalSpaces () {
      this.$emit('updateLocalSpaces')
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
