<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import cache from '@/cache.js'
import utils from '@/utils.js'
const store = useStore()

const dialogElement = ref(null)

const props = defineProps({
  visible: Boolean
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateQueue()
  }
})
const state = reactive({
  queue: []
})
const updateQueue = async () => {
  const queue = await cache.queue()
  state.queue = queue
}

const currentUserIsSignedIn = computed(() => {
  return Boolean(store.getters['currentUser/isSignedIn'])
})
const pluralChanges = computed(() => {
  const condition = state.queue.length !== 1
  return utils.pluralize('change', condition)
})
const refreshBrowser = () => {
  window.location.reload()
}
</script>

<template lang="pug">
dialog.narrow.offline(v-if="visible" :open="visible" ref="dialogElement")
  section
    .row.title-row
      p Offline
      span
        button.small-button(@click.left="refreshBrowser" title="Refresh")
          img.refresh.icon(src="@/assets/refresh.svg")
  section
    .row
      p Kinopio works offline
    section.subsection(v-if="currentUserIsSignedIn")
      p Your changes are saved locally, and will sync up when you're back online
      p
        span.badge.info
          img.icon.offline(src="@/assets/offline.svg")
          span {{state.queue.length}} {{pluralChanges}} to sync
    section.subsection(v-else)
      p Your changes are saved locally
</template>

<style lang="stylus" scoped>
dialog.offline
  width 200px
</style>
