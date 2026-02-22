<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const isVisible = computed(() => globalStore.shouldSnapToGrid)
const origin = computed(() => {
  return {
    x: globalStore.axisGuideLinesOrigin.x + 'px',
    y: globalStore.axisGuideLinesOrigin.y + 'px'
  }
})
const color = computed(() => userStore.color)
</script>

<template lang="pug">
.axis-guide-lines.x-line(v-if="isVisible" :style="{ top: origin.y, background: color }")
.axis-guide-lines.y-line(v-if="isVisible" :style="{ left: origin.x, background: color }")
</template>

<style lang="stylus">
.axis-guide-lines
  pointer-events none
  position absolute
  &.x-line
    height 1px
    width 100%
    left 0
  &.y-line
    width 1px
    height 100%
    top 0
</style>
