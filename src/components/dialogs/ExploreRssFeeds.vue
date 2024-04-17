<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import consts from '@/consts.js'
const store = useStore()

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  store.commit('clearNotificationsWithPosition')
})

const exploreUrl = computed(() => `${consts.apiHost()}/space/explore-spaces/feed.json`)
const everyoneUrl = computed(() => `${consts.apiHost()}/space/everyone-spaces/feed.json`)

const copyUrl = async (event, url) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(url)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
</script>

<template lang="pug">
dialog.narrow.explore-rss-feed(v-if="visible" :open="visible" @click.left.stop)
  section
    p Explore RSS Feeds
  section
    .row
      p Subscribe to new spaces
    .row
      button(@click.left="copyUrl($event, exploreUrl)")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy Explore Feed URL
    .row
      button(@click.left="copyUrl($event, everyoneUrl)")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy Everyone Feed URL
</template>

<style lang="stylus" scoped>
.explore-rss-feed
  left initial
  right 10px
  top calc(100% - 12px) !important
  bottom initial !important
  @media(max-width 400px)
    left -40px
  @media(max-width 350px)
    left -90px
  .badge
    display inline
</style>
