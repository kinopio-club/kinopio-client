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
const guides = computed(() => globalStore.itemSnapAlignGuides) // { x, y }
</script>

<template lang="pug">
template(v-if="isVisible")
  .axis-guide-lines.x-line(
    v-if="guides.y"
    :style="{ top: guides.y + 'px', background: color }"
  )
  .axis-guide-lines.y-line(
    v-if="guides.x"
    :style="{ left: guides.x + 'px', background: color }"
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
</style>
