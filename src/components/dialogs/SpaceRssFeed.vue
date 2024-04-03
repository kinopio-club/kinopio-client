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
  urlIsCopied: false,
  url: ''
})

const spaceIsPrivate = computed(() => store.state.currentSpace.privacy === 'private')
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
  const spaceId = store.state.currentSpace.id
  state.url = `${consts.apiHost()}/space/${spaceId}/feed.json`
}
</script>

<template lang="pug">
dialog.narrow.space-rss-feed(v-if="visible" :open="visible" @click.left.stop)
  section
    p Space RSS Feed
  section
    .row
      p Subscribe to cards recently created or updated
    .row
      p.badge.danger(v-if="spaceIsPrivate")
        img.icon(src="@/assets/lock.svg")
        span RSS Feeds are only available on public spaces
    template(v-if="!spaceIsPrivate")
      .row
        button(@click.left="copyUrl")
          img.icon.copy(src="@/assets/copy.svg")
          span Copy Feed URL
</template>

<style lang="stylus">
dialog.space-rss-feed
  left initial
  right 4px
  .badge
    margin-right 0
</style>
