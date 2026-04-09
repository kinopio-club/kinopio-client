<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import utils from '@/utils.js'

const props = defineProps({
  value: {
    type: Number,
    required: true,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },
  width: {
    type: Number,
    default: 16
  },
  backgroundColor: String,
  count: String
})

const state = reactive({
  strokeWidth: 1
})

const center = computed(() => props.width / 2)
const radius = computed(() => {
  return (props.width - state.strokeWidth) / 2
})
const circumference = computed(() => {
  return 2 * Math.PI * radius.value
})
const percentage = computed(() => {
  const percent = Math.min(100, Math.max(0, (props.value / props.max) * 100))
  return Math.round(percent)
})
const dashOffset = computed(() => {
  const progress = percentage.value / 100
  return circumference.value * (1 - progress)
})
const colorClasses = computed(() => {
  const classes = utils.colorClasses({ backgroundColor: props.backgroundColor })
  console.log(props.backgroundColor, classes)
  return classes
})

</script>

<template lang="pug">
.progress-circle(:class="colorClasses")
  svg.circle-svg(:viewBox="`0 0 ${width} ${width}`" :width="width" :height="width")
    circle.circle-background(
      :cx="center"
      :cy="center"
      :r="radius"
      :stroke-width="state.strokeWidth"
      fill="none"
    )
    circle.circle-progress(
      :cx="center"
      :cy="center"
      :r="radius"
      :stroke-width="state.strokeWidth"
      fill="none"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="dashOffset"
      :style="{ transform: `rotate(-90deg)`, transformOrigin: 'center' }"
    )
  .count(v-if="props.count")
    span {{ props.count }}
</template>

<style lang="stylus" scoped>
.progress-circle
  margin-right 5px
  position relative
  display inline-flex
  align-items center
  justify-content center
  .circle-svg
    transform rotate(0deg)
  .circle-background
    transition stroke 0.3s ease
    stroke var(--primary-border)
  .circle-progress
    stroke-linecap round
    transition stroke-dashoffset 0.4s ease, stroke 0.2s ease
    stroke var(--primary)
  &.is-background-dark
    .circle-background
      stroke var(--primary-border-on-dark-background)
    .circle-progress
      stroke var(--secondary-active-background-dark)
  .progress-value
    display block
    line-height 1
  .count
    position absolute
    margin-top -3px
    span
      color var(--background-color)
      font-size 10px
</style>
