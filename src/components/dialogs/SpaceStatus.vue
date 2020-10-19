<template lang="pug">
dialog.narrow.space-status(v-if="visible" :open="visible")
  section
    .badge.info
      Loader(:visible="true")
      span(v-if="isLoadingSpace") Downloading
      span(v-else-if="isJoiningSpace") Joining
      span(v-else-if="isReconnectingToBroadcast") Reconnecting

    p(v-if="isLoadingSpace && spaceIsCached") You can edit right now, your changes will sync up later
    p(v-else-if="isJoiningSpace") You'll be able to edit this space as a collaborator
    p(v-else-if="isReconnectingToBroadcast") Reconnecting to collaborators. If you're not currently collaborating, you can edit right now
</template>

<script>
import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'

export default {
  name: 'SpaceStatus',
  components: {
    Loader
  },
  props: {
    visible: Boolean
  },
  data () {
    return {
      spaceIsCached: false
    }
  },
  computed: {
    currentSpace () { return this.$store.state.currentSpace },
    isLoadingSpace () { return this.$store.state.isLoadingSpace },
    isJoiningSpace () { return this.$store.state.isJoiningSpace },
    isReconnectingToBroadcast () { return this.$store.state.isReconnectingToBroadcast }
  },
  watch: {
    visible (visible) {
      if (visible) {
        const cachedSpace = cache.space(this.currentSpace.id)
        this.spaceIsCached = utils.arrayHasItems(cachedSpace.cards)
      }
    }
  }
}
</script>

<style lang="stylus">
.space-status
  .badge
    display inline-block
</style>
