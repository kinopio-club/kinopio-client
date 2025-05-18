<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/useUserStore'

const userStore = useUserStore()
const store = useStore()

const isVisible = computed(() => store.state.shouldSnapToGrid)
const origin = computed(() => {
  return {
    x: store.state.snapGuideLinesOrigin.x + 'px',
    y: store.state.snapGuideLinesOrigin.y + 'px'
  }
})
const color = computed(() => userStore.color)
</script>

<template lang="pug">
.snap-guide-lines.x-line(v-if="isVisible" :style="{ top: origin.y, background: color }")
.snap-guide-lines.y-line(v-if="isVisible" :style="{ left: origin.x, background: color }")
</template>

<style lang="stylus">
.snap-guide-lines
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
