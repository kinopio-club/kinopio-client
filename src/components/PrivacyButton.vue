<template lang="pug">
.button-wrap.privacy-button(v-if="isSpaceMember || isInvitedButCannotEditSpace")
  button(@click.left.stop="togglePrivacyPickerIsVisible" :disabled="isInvitedButCannotEditSpace" :class="{ active: privacyPickerIsVisible }")
    template(v-if="showIconOnly")
      img.icon(:src="privacyIcon(privacyState).path" :class="privacyState.name")
    template(v-else)
      .badge(:class="privacyState.color")
        img.icon(:src="privacyIcon(privacyState).path" :class="privacyState.name")
        span {{privacyState.name | capitalize}}
    p.description(v-if="showDescription") {{privacyState.description | capitalize}}
  PrivacyPicker(:visible="privacyPickerIsVisible" @closeDialogs="closeDialogs" @updateSpaces="updateSpaces")
</template>

<script>
import PrivacyPicker from '@/components/dialogs/PrivacyPicker.vue'
import utils from '@/utils.js'
import privacy from '@/data/privacy.js'

export default {
  name: 'PrivacyButton',
  components: {
    PrivacyPicker
  },
  props: {
    privacyPickerIsVisible: Boolean,
    showDescription: Boolean,
    showIconOnly: Boolean
  },
  filters: {
    capitalize (value) {
      return utils.capitalizeFirstLetter(value)
    }
  },
  computed: {
    isSpaceMember () { return this.$store.getters['currentUser/isSpaceMember']() },
    isInvitedButCannotEditSpace () { return this.$store.getters['currentUser/isInvitedButCannotEditSpace']() },
    spacePrivacy () { return this.$store.state.currentSpace.privacy },
    privacyState () {
      return privacy.states().find(state => {
        return state.name === this.spacePrivacy
      })
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
