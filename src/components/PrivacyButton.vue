<template lang="pug">
.button-wrap.privacy-button(v-if="isSpaceMember || isInvitedButCannotEditSpace" :class="privacyState.name")
  button(@click.left.stop="togglePrivacyPickerIsVisible" :disabled="isInvitedButCannotEditSpace" :class="{ active: privacyPickerIsVisible }")
    template(v-if="showShortName")
      PrivacyIcon(:privacy="privacyState.name")
      span {{shortName}}
    template(v-else)
      .badge(:class="privacyState.color")
        PrivacyIcon(:privacy="privacyState.name")
        span {{name}}
    p.description(v-if="showDescription") {{description}}
  PrivacyPicker(:visible="privacyPickerIsVisible" @closeDialogs="closeDialogs" @updateLocalSpaces="updateLocalSpaces")
</template>

<script>
import PrivacyPicker from '@/components/dialogs/PrivacyPicker.vue'
import PrivacyIcon from '@/components/PrivacyIcon.vue'
import utils from '@/utils.js'
import privacy from '@/data/privacy.js'

export default {
  name: 'PrivacyButton',
  components: {
    PrivacyPicker,
    PrivacyIcon
  },
  props: {
    privacyPickerIsVisible: Boolean,
    showDescription: Boolean,
    showShortName: Boolean
  },
  computed: {
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    isInvitedButCannotEditSpace () { return this.$store.getters['currentUser/isInvitedButCannotEditSpace']() },
    spacePrivacy () { return this.$store.state.currentSpace.privacy },
    privacyState () {
      return privacy.states().find(state => {
        return state.name === this.spacePrivacy
      })
    },
    description () {
      return utils.capitalizeFirstLetter(this.privacyState.description)
    },
    name () {
      const name = this.privacyState.friendlyName || this.privacyState.name
      return utils.capitalizeFirstLetter(name)
    },
    shortName () {
      const name = this.privacyState.shortName || this.privacyState.name
      return utils.capitalizeFirstLetter(name)
    }
  },
  methods: {
    togglePrivacyPickerIsVisible () {
      this.$emit('togglePrivacyPickerIsVisible')
    },
    closeDialogs () {
      this.$emit('closeDialogs')
    },
    updateLocalSpaces () {
      this.$emit('updateLocalSpaces')
    }
  }
}
</script>

<style lang="stylus">
.privacy-button
  button
    height initial
</style>
