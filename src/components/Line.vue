<script setup>
import { reactive, computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useLineStore } from '@/stores/useLineStore'

import utils from '@/utils.js'
import postMessage from '@/postMessage.js'

const globalStore = useGlobalStore()
const lineStore = useLineStore()

let isMultiTouch
// locking
// long press to touch drag card
const lockingPreDuration = 100 // ms
const lockingDuration = 100 // ms
let lockingAnimationTimer, lockingStartTime, shouldCancelLocking
const initialTouchEvent = {}
const touchPosition = {}
const currentTouchPosition = {}

const props = defineProps({
  line: Object
})

const state = reactive({
  isLocking: false,
  lockingPercent: 0,
  lockingAlpha: 0
})

// styles

const colorClasses = computed(() => {
  return utils.colorClasses({ backgroundColor: props.line.color })
})
const styles = computed(() => {
  const styles = {
    top: props.line.y + 'px',
    backgroundColor: props.line.color
  }
  return styles
})
const infoStyles = computed(() => {
  const styles = {
    backgroundColor: props.line.color,
    top: props.line.y - 10 + 'px'
  }
  if (globalStore.isSelectingAllBelow) {
    styles.pointerEvents = 'none'
  }
  return styles
})
const horizontalLineStyles = computed(() => {
  return {
    backgroundColor: props.line.color,
    width: globalStore.pageWidth + 'px'
  }
})
</script>

<template lang="pug">
.line(:data-line-id="props.line.id" :style="styles")
.line-info.badge.button-badge(
    :data-line-id="props.line.id"
    :style="infoStyles"
  )
  button.small-button.translucent-button(@click="selectAllBelow")
    img.icon(src="@/assets/brush-y.svg")
  span.name(:class="colorClasses") {{props.line.name}}
</template>

<style lang="stylus">
.line
  pointer-events none
  width 100%
  height 1px
  position absolute
  left 0
  z-index calc(var(--max-z) - 100)
.line-info
  pointer-events all
  position absolute
  min-width 60px
  z-index var(--max-z)
  border-top-left-radius 0
  border-bottom-left-radius 0
  .name
    &.is-background-light
      color var(--primary-on-light-background)
    &.is-background-dark
      color var(--primary-on-dark-background)
  button
    margin-right 5px

</style>
