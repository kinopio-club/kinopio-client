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
  return dayjs(props.space.createdAt).isToday()
})
const isCreatedYesterday = computed(() => {
  return dayjs(props.space.createdAt).isYesterday()
})

</script>

<template lang="pug">
span.badge.info.inline-badge(v-if="isCreatedToday" title="Created today")
  img.icon(src="@/assets/today.svg")
span.badge.info.inline-badge.yesterday(v-if="isCreatedYesterday" title="Created yesterday")
  img.icon(src="@/assets/today.svg")
</template>

<style lang="stylus" scoped>
.icon
  width 12px
  height 12px
  vertical-align -1px
.yesterday
  opacity 0.5
</style>
