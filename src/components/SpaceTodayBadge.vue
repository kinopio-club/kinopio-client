<script setup>
import utils from '@/utils.js'

import dayjs from 'dayjs'
import isYesterday from 'dayjs/plugin/isYesterday'
import isToday from 'dayjs/plugin/isToday'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
dayjs.extend(isYesterday)
dayjs.extend(isToday)
const store = useStore()

const props = defineProps({
  space: Object
})

const isCreatedToday = computed(() => {
  if (!props.space.createdAt) { return }
  return dayjs(props.space.createdAt).isToday()
})
const isCreatedYesterday = computed(() => {
  if (!props.space.createdAt) { return }
  return dayjs(props.space.createdAt).isYesterday()
})

</script>

<template lang="pug">
span.badge.info.inline-badge.space-today-badge(v-if="isCreatedToday" title="Created today")
  img.icon.today(src="@/assets/today.svg")
span.badge.info.inline-badge.space-today-badge.yesterday(v-if="isCreatedYesterday" title="Created yesterday")
  img.icon.today(src="@/assets/today.svg")
  </template>

<style lang="stylus">
.badge.space-today-badge
  margin-left 0
  padding 1px 5px
  margin-right 4px
  .icon.today
    width 11px
    height 11px
    vertical-align 0
  &.yesterday
    opacity 0.5
</style>
