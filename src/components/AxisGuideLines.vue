<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const isVisible = computed(() => globalStore.shouldSnapAlign)
const color = computed(() => userStore.color)
const itemSnapAlignGuides = computed(() => globalStore.itemSnapAlignGuides)
</script>

<template lang="pug">
template(v-if="isVisible" v-for="guide in itemSnapAlignGuides" :key="guide.axis + guide.position")
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
