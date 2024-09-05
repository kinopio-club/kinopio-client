<script setup>
import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import cache from '@/cache.js'
import utils from '@/utils.js'
const store = useStore()

const props = defineProps({
  visible: Boolean
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    const cachedSpace = cache.space(currentSpace.value.id)
    state.spaceIsCached = utils.arrayHasItems(cachedSpace.cards)
  }
})

const state = reactive({
  spaceIsCached: false
})

const currentSpace = computed(() => store.state.currentSpace)
const isLoadingSpace = computed(() => store.state.isLoadingSpace)
const isLoadingOtherItems = computed(() => store.state.isLoadingOtherItems)
const isJoiningSpace = computed(() => store.state.isJoiningSpace)
const isReconnectingToBroadcast = computed(() => store.state.isReconnectingToBroadcast)
const isConnected = computed(() => !isLoadingSpace.value && !isJoiningSpace.value && !isReconnectingToBroadcast.value)

const refreshBrowser = () => {
  window.location.reload()
}
</script>

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
      p(v-if="(isLoadingSpace || isLoadingOtherItems) && state.spaceIsCached")
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
