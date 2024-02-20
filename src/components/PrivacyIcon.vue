<template lang="pug">
img.icon.privacy-icon(
  v-if="isOpen"
  src="@/assets/open.svg"
  :class="privacyState.name"
)
img.icon.privacy-icon(
  v-else-if="isClosed"
  src="@/assets/unlock.svg"
  :class="privacyState.name"
)
img.icon.privacy-icon(
  v-else-if="isPrivate"
  src="@/assets/lock.svg"
  :class="privacyState.name"
)
</template>

<script>
import privacy from '@/data/privacy.js'

export default {
  name: 'PrivacyIcon',
  props: {
    privacy: String,
    closedIsNotVisible: Boolean
  },
  computed: {
    privacyState () {
      return privacy.states().find(state => {
        return state.name === this.privacy
      })
    },
    isOpen () {
      return this.privacyState.name === 'open'
    },
    isClosed () {
      return this.privacyState.name === 'closed' && !this.closedIsNotVisible
    },
    isPrivate () {
      return this.privacyState.name === 'private'
    }
  }
}
</script>

<style lang="stylus">
.icon.privacy-icon
  vertical-align 0
  &.open
    vertical-align -1px
</style>
