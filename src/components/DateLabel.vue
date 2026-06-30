<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'

import dayjs from 'dayjs'

const globalStore = useGlobalStore()
const userStore = useUserStore()

let unsubscribes

const props = defineProps({
  date: Object,
  parentCardId: String
})
const state = reactive({
  pointerdownPosition: { x: 0, y: 0 }
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
const titleLabel = computed(() => {
  if (userStore.atMentionDateIsRelative) {
    return utils.shortAbsoluteDate(props.date)
  } else {
    return utils.shortRelativeDate(props.date)
  }
})
const updatePointerdownPosition = (event) => {
  state.pointerdownPosition = utils.cursorPositionInSpace(event)
}
const selectDate = (event) => {
  const position = utils.cursorPositionInSpace(event)
  const isClick = utils.cursorsAreClose(state.pointerdownPosition, position)
  if (!isClick) { return }
  const value = !userStore.atMentionDateIsRelative
  userStore.updateUser({ atMentionDateIsRelative: value })
}
const toggleCurrentUserIsOverCard = (value) => {
  if (!props.parentCardId) { return }
  if (value) {
    globalStore.currentUserIsHoveringOverButtonCardId = props.parentCardId
  } else {
    globalStore.currentUserIsHoveringOverButtonCardId = ''
  }
}
</script>

<template lang="pug">
span.date-label(
  v-if="props.date"
  @click.stop="selectDate"
  @pointerdown="updatePointerdownPosition"
  @mouseover="toggleCurrentUserIsOverCard(true)"
  @mouseleave="toggleCurrentUserIsOverCard(false)"
)
    span.badge.secondary-on-dark-background.button-badge(:class="{info: dateIsToday, danger: dateIsPast}" :title="titleLabel")
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
