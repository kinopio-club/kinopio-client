<template lang="pug">
dialog.add-to-inbox(v-if="visible" :open="visible" @touchstart.stop.prevent @touchend.stop.prevent @click.left.stop ref="dialog")
  AddToInbox(:visible="true")
  //- section if isloading
  section(v-if="isCards && !currentSpaceIsInbox")
    p blank slate, no cards
    p list your recent inbox ccards, instructions to add. click a card to move it to this space
</template>

<script>
import AddToInbox from '@/components/AddToInbox.vue'

import { mapState, mapGetters } from 'vuex'

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
      cards: []
    }
  },
  computed: {
    ...mapState([
      'currentSpace'
    ]),
    ...mapGetters([
    ]),
    isCards () {
      return Boolean(this.cards.length)
    },
    currentSpaceIsInbox () {
      return this.currentSpace.name === 'Inbox'
    }
  },
  methods: {
    moveCardToSpace () {
      // get center vp + scroll
      // api patch: update id w new card x,y, and spaceid
      // commit the card to state: currentCards/create
      // animate//highlight the card
    }
  }
}
</script>

<style lang="stylus">
dialog.add-to-inbox
  width 210px
</style>
