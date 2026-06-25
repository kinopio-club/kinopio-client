<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'

import dayjs from 'dayjs'

const userStore = useUserStore()

let unsubscribes

const props = defineProps({
  date: Object
})

const dateIsToday = computed(() => {
  return utils.dateIsToday(props.date)
})
const dateIsPast = computed(() => {
  return utils.dateIsPast(props.date)
})
const dateLabel = computed(() => {
  if (userStore.atMentionDateIsRelative) {
    return utils.shortRelativeDate(props.date)
  } else {
    return utils.shortAbsoluteDate(props.date)
  }
})
</script>

<template lang="pug">
.date-label(v-if="props.date")
    span.badge.secondary-on-dark-background(:class="{info: dateIsToday, danger: dateIsPast}")
      img.icon.cal(src="@/assets/cal.svg")
      span {{dateLabel}}
</template>

<style lang="stylus">
.date-label
  .badge
    &.info
      background var(--info-background) !important
    &.danger
      background var(--danger-background) !important
    .icon.cal
      vertical-align -1px
</style>
