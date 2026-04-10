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
const cardAlignGuides = computed(() => globalStore.cardAlignGuides)
</script>

<template lang="pug">
//- grid snap guide lines
.axis-guide-lines.x-line(v-if="isVisible" :style="{ top: origin.y, background: color }")
.axis-guide-lines.y-line(v-if="isVisible" :style="{ left: origin.x, background: color }")
//- card alignment snap guide lines
template(v-for="guide in cardAlignGuides" :key="guide.axis + guide.position")
  .axis-guide-lines.x-line.is-card-align-guide(
    v-if="guide.axis === 'y'"
    :style="{ top: guide.position + 'px', background: color }"
  )
  .axis-guide-lines.y-line.is-card-align-guide(
    v-if="guide.axis === 'x'"
    :style="{ left: guide.position + 'px', background: color }"
  )
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
  // &.is-card-align-guide
  //   opacity 0.6
</style>
