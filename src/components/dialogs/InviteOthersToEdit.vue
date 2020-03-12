<template lang="pug">
dialog.narrow.invite-others-to-edit(v-if="visible" :open="visible" @click.stop)
  section
    p Invite blah blah
  //- section
  //-   p hello
</template>

<script>
// import privacy from '@/spaces/privacy.js'
// import utils from '@/utils.js'

export default {
  name: 'InviteOthersToEdit',
  props: {
    visible: Boolean
  },
  computed: {
    // privacyStates () { return privacy.states() }
  },
  methods: {
    // select (privacyState) {
    //   this.$emit('closeDialog')
    // }
  }
}
</script>

<style lang="stylus">
// todo media query for short screens (SE)?
.invite-others-to-edit
  left initial
  right 8px
</style>
