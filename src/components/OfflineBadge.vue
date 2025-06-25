<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

const globalStore = useGlobalStore()

const props = defineProps({
  isInline: Boolean,
  isDanger: Boolean
})

const visible = computed(() => !globalStore.isOnline)
const offlineIsVisible = computed(() => globalStore.offlineIsVisible)
const toggleOfflineIsVisible = () => {
  const value = globalStore.offlineIsVisible
  globalStore.offlineIsVisible = !value
}

const classes = computed(() => {
  return {
    active: offlineIsVisible.value,
    'inline-badge': props.isInline,
    'button-badge': !props.isInline,
    info: !props.isDanger,
    danger: props.isDanger
  }
})
const title = computed(() => {
  if (props.isDanger) {
    return 'Unavailable Offline'
  } else {
    return ''
  }
})
</script>

<template lang="pug">
.row.offline-badge(v-if="visible")
  span.badge(@click.stop="toggleOfflineIsVisible" :class="classes" :title="title")
    img.icon.offline(src="@/assets/offline.svg")
    span(v-if="!isInline") Offline
</template>

<style lang="stylus">
.offline-badge
  .badge
    display block !important
</style>
