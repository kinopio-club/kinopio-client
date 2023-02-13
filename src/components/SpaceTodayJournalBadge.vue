<script setup>
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const props = defineProps({
  space: Object
})

const isToday = computed(() => {
  if (!props.space.moonPhase) { return }
  const createdAt = utils.journalSpaceDateFromName(props.space.name)
  if (!createdAt) { return }
  const today = utils.journalSpaceName({})
  return createdAt === today
})

const isYesterday = computed(() => {
  if (!props.space.moonPhase) { return }
  const createdAt = utils.journalSpaceDateFromName(props.space.name)
  if (!createdAt) { return }
  const yesterday = utils.journalSpaceName({ isYesterday: true })
  return createdAt === yesterday
})

const isTomorrow = computed(() => {
  if (!props.space.moonPhase) { return }
  const createdAt = utils.journalSpaceDateFromName(props.space.name)
  if (!createdAt) { return }
  const tomorrow = utils.journalSpaceName({ isTomorrow: true })
  return createdAt === tomorrow
})

</script>

<template lang="pug">
span.badge.info.inline-badge(v-if="isToday" title="Today's journal")
  img.icon(src="@/assets/today.svg")
span.badge.info.inline-badge.yesterday(v-if="isYesterday" title="Yesterday's journal")
  img.icon(src="@/assets/today.svg")
span.badge.info.inline-badge.search(v-if="isTomorrow" title="Tomorrow's journal")
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
