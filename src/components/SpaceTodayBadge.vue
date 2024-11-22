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

const shouldHide = computed(() => {
  if (!props.space.createdAt) { return true }
  const name = props.space.name
  return name === 'Inbox' || name === 'Hello Kinopio'
})
const isCreatedToday = computed(() => {
  if (shouldHide.value) { return }
  return dayjs(props.space.createdAt).isToday()
})
const isCreatedYesterday = computed(() => {
  if (shouldHide.value) { return }
  return dayjs(props.space.createdAt).isYesterday()
})

</script>

<template lang="pug">
span.badge.info.inline-badge.space-today-badge(v-if="isCreatedToday" title="Created Today")
  img.icon.today(src="@/assets/today.svg")
span.badge.info.inline-badge.space-today-badge.yesterday(v-if="isCreatedYesterday" title="Created Yesterday")
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
