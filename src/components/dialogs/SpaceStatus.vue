<template lang="pug">
dialog.narrow.space-status(v-if="visible" :open="visible" ref="dialog")
  section
    p(v-if="!isConnected")
      Loader(:visible="true")
      span(v-if="isLoadingSpace || isLoadingOtherItems") Downloading
      span(v-else-if="isJoiningSpace") Connecting to Broadcast
      span(v-else-if="isReconnectingToBroadcast") Reconnecting
    p.badge.success(v-if="isConnected") Connected

  template(v-if="!isConnected")
    section
      p(v-if="(isLoadingSpace || isLoadingOtherItems) && spaceIsCached")
        span.badge.info You can edit right now
        span and your changes will sync once connected
      p(v-else-if="isJoiningSpace || isReconnectingToBroadcast")
        span.badge.info You can edit right now
        span {{' '}}
        span but cannot collaborate yet, your changes will sync once connected
      .button-wrap
        button(@click.left="refreshBrowser")
          img.icon(src="@/assets/refresh.svg")
          span Refresh
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
      spaceIsCached: false,
      showOnRightSide: false
    }
  },
  computed: {
    currentSpace () { return this.$store.state.currentSpace },
    isLoadingSpace () { return this.$store.state.isLoadingSpace },
    isLoadingOtherItems () { return this.$store.state.isLoadingOtherItems },
    isJoiningSpace () { return this.$store.state.isJoiningSpace },
    isReconnectingToBroadcast () { return this.$store.state.isReconnectingToBroadcast },
    isConnected () { return !this.isLoadingSpace && !this.isJoiningSpace && !this.isReconnectingToBroadcast }
  },
  methods: {
    refreshBrowser () {
      window.location.reload()
    }
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
  @media(max-width 414px)
    left -60px
  .badge
    display inline-block

  .loader
    width 14px
    height 14px
    vertical-align -3px
    margin-right 6px

</style>
