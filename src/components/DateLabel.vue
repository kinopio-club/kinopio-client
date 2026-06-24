<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()

let unsubscribes

const props = defineProps({
  date: String
})

const dateIsToday = computed(() => {
  // const segment = props.segment
  // if (!date) { return }
  return utils.dateIsToday(props.date)
})
const dateLabel = computed(() => {
  // takes optional prop card
  // TODO change to cardStore atMentionDateIsRelative bool, set on date create
  if (userStore.atMentionDateIsRelative) {
    return utils.shortRelativeDate(props.date)
  } else {
    return utils.shortAbsoluteDate(props.date)
  }
})
</script>

<template lang="pug">
.date-label(v-if="props.date")
    span.badge.secondary-on-dark-background(:class="{info: dateIsToday}")
      img.icon.cal(src="@/assets/cal.svg")
      span {{dateLabel}}
</template>

<style lang="stylus">
.date-label
  .badge
    &.info
      background var(--info-background) !important
      .icon.cal
        vertical-align -1px
</style>
