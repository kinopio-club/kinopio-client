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

const state = reactive({
  urlIsCopied: false
})

const spaceIsPrivate = computed(() => store.state.currentSpace.privacy === 'private')

const spaceUrl = computed(() => {
  const spaceId = store.state.currentSpace.id
  return `${consts.apiHost()}/space/${spaceId}/feed.json`
})
const exploreUrl = computed(() => `${consts.apiHost()}/space/explore-spaces/feed.json`)
const everyoneUrl = computed(() => `${consts.apiHost()}/space/everyone-spaces/feed.json`)

const copyUrl = async (event, url) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(url)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
    console.log('🍇 copy rss url', url)
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
</script>

<template lang="pug">
dialog.narrow.space-rss-feed(v-if="visible" :open="visible" @click.left.stop)
  section
    p RSS Feeds
  section
    .row
      p Subscribe to cards recently created or updated in this space
    .row(v-if="spaceIsPrivate")
      p.badge.danger
        img.icon(src="@/assets/lock.svg")
        span Space RSS Feeds are only available on public spaces
    .row(v-if="!spaceIsPrivate")
      button(@click.left="copyUrl($event, spaceUrl)")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy Feed URL
  section
    .row
      p
        img.icon.sunglasses(src="@/assets/sunglasses.svg")
        span Subscribe to new community spaces
    .row
      button(@click.left="copyUrl($event, exploreUrl)")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy Explore Feed URL
    .row
      button(@click.left="copyUrl($event, everyoneUrl)")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy Everyone Feed URL

</template>

<style lang="stylus">
dialog.space-rss-feed
  left initial
  right 4px
  .badge
    margin-right 0
</style>
