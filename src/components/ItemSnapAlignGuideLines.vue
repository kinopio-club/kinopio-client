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
// const guides = computed(() => globalStore.itemSnapAlignGuides) // { x: { targetSide, snapTo, guideAt, distance } , y: {} }
const verticalLine = computed(() => globalStore.itemSnapAlignGuides.x?.guideAt)
const horizontalLine = computed(() => globalStore.itemSnapAlignGuides.y?.guideAt)
</script>

<template lang="pug">
template(v-if="isVisible")
  .snap-align-guide-lines.x-line(
    v-if="horizontalLine"
    :style="{ top: horizontalLine + 'px', background: color }"
  )
  .snap-align-guide-lines.y-line(
    v-if="verticalLine"
    :style="{ left: verticalLine + 'px', background: color }"
  )
</template>

<style lang="stylus">
.snap-align-guide-lines
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
