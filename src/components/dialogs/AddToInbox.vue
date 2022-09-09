<template lang="pug">
dialog.add-to-inbox.narrow(v-if="visible" :open="visible" @touchstart.stop.prevent @touchend.stop.prevent @click.left.stop ref="dialog")
  AddToInbox
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
  computed: {
    // inboxUrl () { return this.successSpaceId || 'inbox' },
  },
  methods: {
  }
}
</script>

<style lang="stylus">
dialog.add-to-inbox
  width 210px
</style>
