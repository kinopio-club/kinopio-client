<template lang="pug">
dialog.narrow.privacy-picker(v-if="visible" :open="visible" @click.stop)
  section.results-section
    ul.results-list
      template(v-for="(privacyState in privacyStates")
        li(:class="{ active: privacyStateIsActive(privacyState) }" @click="select(privacyState)")
          .badge(:class="privacyState.color")
            img.icon(v-if="spaceIsPrivate(privacyState)" src="@/assets/lock.svg")
            img.icon(v-else src="@/assets/unlock.svg")
            span {{privacyState.name | capitalize}}
          p.description {{privacyState.description | capitalize}}
</template>

<script>
import privacy from '@/spaces/privacy.js'
import utils from '@/utils.js'

export default {
  name: 'SpacePicker',
  props: {
    visible: Boolean
  },
  filters: {
    capitalize (value) {
      return utils.capitalizeFirstLetter(value)
    }
  },
  computed: {
    privacyStates () { return privacy.states() }
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
      console.log('select', privacyState)
      this.$emit('closeDialog')
    }
  }
}
</script>

<style lang="stylus" scoped>
.privacy-picker
  left initial
  right 8px
  li
    display block
  .results-section
    padding-top 4px
</style>
