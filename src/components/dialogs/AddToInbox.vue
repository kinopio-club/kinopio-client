<template lang="pug">
dialog.narrow.add-to-inbox(v-if="visible" :open="visible" @touchstart.stop.prevent @touchend.stop.prevent @click.left.stop ref="dialog")
  section
    span Add To Inbox
  AddToInbox(:visible="visible")
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
  }
}
</script>

<style lang="stylus">
dialog.add-to-inbox
  width 210px
</style>
