<template lang="pug">
.button-wrap.privacy-button(v-if="isSpaceMember")
  button(@click.stop="togglePrivacyPickerIsVisible" :class="{ active: privacyPickerIsVisible }")
    .badge(:class="privacyState.color")
      img.icon(:src="privacyIcon(privacyState).path" :class="privacyState.name")
      span {{privacyState.name | capitalize}}
    .badge.status.explore-message(v-if="shouldShowInExplore")
      img.icon(src="@/assets/checkmark.svg")
      span In Explore
    p.description(v-if="!hideDescription") {{privacyState.description | capitalize}}
  PrivacyPicker(:visible="privacyPickerIsVisible" @closeDialog="closeDialogs" @updateSpaces="updateSpaces")

</template>

<script>
import PrivacyPicker from '@/components/dialogs/PrivacyPicker.vue'
import utils from '@/utils.js'
import privacy from '@/spaces/privacy.js'

export default {
  name: 'PrivacyButton',
  components: {
    PrivacyPicker
  },
  props: {
    hideDescription: Boolean,
    privacyPickerIsVisible: Boolean
  },
  filters: {
    capitalize (value) {
      return utils.capitalizeFirstLetter(value)
    }
  },
  computed: {
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    spacePrivacy () { return this.$store.state.currentSpace.privacy },
    privacyState () {
      return privacy.states().find(state => {
        return state.name === this.spacePrivacy
      })
    },
    shouldShowInExplore () {
      const privacy = this.$store.state.currentSpace.privacy
      if (privacy === 'private') { return false }
      return this.$store.state.currentSpace.showInExplore
    }
  },
  methods: {
    togglePrivacyPickerIsVisible () {
      this.$emit('togglePrivacyPickerIsVisible')
    },
    closeDialogs () {
      this.$emit('closeDialogs')
    },
    updateSpaces () {
      this.$emit('updateSpaces')
    },
    privacyIcon (privacyState) {
      return {
        path: require(`@/assets/${privacyState.icon}.svg`)
      }
    }
  }
}
</script>

<style lang="stylus">
.privacy-button
  .badge
    margin 0
  .badge.explore-message
    display inline-flex
    margin 0
  .badge + .explore-message
    margin-left 3px

</style>
