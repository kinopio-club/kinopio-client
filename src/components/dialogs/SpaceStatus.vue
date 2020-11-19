<template lang="pug">
dialog.narrow.space-status(v-if="visible" :open="visible" ref="dialog" :class="{'right-side': showOnRightSide}")
  section
    p Status
  section
    .badge.success(v-if="isConnected") Connected

    p(v-if="isLoadingSpace && spaceIsCached") You can edit right now, your changes will sync
    p(v-else-if="isJoiningSpace || isReconnectingToBroadcast") You can edit right now but cannot collaborate yet, your changes will sync

    p.badge.info(v-if="!isConnected")
      Loader(:visible="true")
      span(v-if="isLoadingSpace") Downloading
      span(v-else-if="isJoiningSpace") Connecting to Broadcast
      span(v-else-if="isReconnectingToBroadcast") Reconnecting
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
  created () {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'updatePageSizes') {
        this.checkIfShouldBeOnRightSide()
      }
    })
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
    isJoiningSpace () { return this.$store.state.isJoiningSpace },
    isReconnectingToBroadcast () { return this.$store.state.isReconnectingToBroadcast },
    isConnected () { return !this.isLoadingSpace && !this.isJoiningSpace && !this.isReconnectingToBroadcast }
  },
  methods: {
    checkIfShouldBeOnRightSide () {
      this.showOnRightSide = false
      if (!this.visible) { return }
      this.$nextTick(() => {
        let element = this.$refs.dialog
        this.showOnRightSide = utils.elementShouldBeOnRightSide(element)
      })
    }
  },
  watch: {
    visible (visible) {
      if (visible) {
        const cachedSpace = cache.space(this.currentSpace.id)
        this.spaceIsCached = utils.arrayHasItems(cachedSpace.cards)
        this.checkIfShouldBeOnRightSide()
      }
    }
  }
}
</script>

<style lang="stylus">
.space-status
  &.right-side
    left initial
    right 8px
  .badge
    display inline-block
</style>
