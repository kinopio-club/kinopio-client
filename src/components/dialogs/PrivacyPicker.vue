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
    spaceIsPrivate (privacyState) {
      return privacyState.name === 'private'
    },
    privacyStateIsActive (privacyState) {
      const currentPrivacy = this.$store.state.currentSpace.privacy
      return privacyState.name === currentPrivacy
    },
    select (privacyState) {
      this.$store.dispatch('currentSpace/updateSpace', { privacy: privacyState.name })
      this.updateSpaces()
      this.$emit('closeDialogs')
    },
    privacyIcon (privacyState) {
      return {
        path: require(`@/assets/${privacyState.icon}.svg`)
      }
    },
    updateSpaces () {
      this.$emit('updateSpaces')
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
