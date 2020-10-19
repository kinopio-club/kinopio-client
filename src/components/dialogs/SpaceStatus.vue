<template lang="pug">
dialog.narrow.space-status(v-if="visible" :open="visible")
  section
    Loader(:visible="true")
    template(v-if="isLoadingSpace")
      p {{currentSpace.name}} is downloading…
      p(v-if="spaceIsCached") You can edit it right now and your changes will sync up
    template(v-else-if="isJoiningSpace")
      p Joining {{currentSpace.name}} as a collaborator…
    template(v-else-if="isReconnectingToBroadcast")
      p Broadcast connection error, retrying…
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
</style>
