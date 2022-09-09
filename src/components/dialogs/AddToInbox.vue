<template lang="pug">
dialog.add-to-inbox.narrow(v-if="visible" :open="visible" @touchstart.stop.prevent @touchend.stop.prevent @click.left.stop ref="dialog")
  AddToInbox(@successSpaceId="updateSuccessSpaceId")
</template>

<script>
import AddToInbox from '@/components/AddToInbox.vue'

export default {
  name: 'AddToInboxDialog',
  components: {
    AddToInbox
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      successSpaceId: ''
    }
  },
  computed: {
    inboxUrl () { return this.successSpaceId || 'inbox' },
    successSpaceIsCurrentSpace () {
      const currentSpace = this.$store.state.currentSpace
      return this.successSpaceId === currentSpace.id
    }
  },
  methods: {
    triggerSignUpOrInIsVisible () {
      this.$store.dispatch('closeAllDialogs', 'SpacePicker.triggerSignUpOrInIsVisible')
      this.$store.commit('triggerSignUpOrInIsVisible')
    },
    updateSuccessSpaceId (value) {
      this.successSpaceId = value
    }
  }
}
</script>

<style lang="stylus">
dialog.add-to-inbox
  width 210px
</style>
