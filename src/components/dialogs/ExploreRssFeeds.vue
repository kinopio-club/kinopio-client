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
  if (value) {
    updateUrl()
  }
})

const state = reactive({
  url: ''
})

const copyUrl = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(state.url)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
const updateUrl = () => {
  state.url = `${consts.apiHost(true)}/space/explore-spaces/feed.json`
}
</script>

<template lang="pug">
dialog.narrow.explore-rss-feed(v-if="visible" :open="visible" @click.left.stop)
  section
    p Explore RSS Feeds
  section
    .row
      p Subscribe to new spaces added to Highlights
    .row
      button(@click.left="copyUrl")
        img.icon.copy(src="@/assets/copy.svg")
        span Copy Feed URL
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
