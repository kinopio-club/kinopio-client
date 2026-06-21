<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

import dayjs from 'dayjs'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

// const dialogElement = ref(null)

// onMounted(() => {
//   window.addEventListener('resize', updateDialogHeight)

//   const globalActionUnsubscribe = globalStore.$onAction(
//     ({ name, args }) => {
//       if (name === 'clearDraggingItems') {
//         console.log('clearDraggingItems')
//       }
//     }
//   )
//   unsubscribes = () => {
//     globalActionUnsubscribe()
//   }
// })
// onBeforeUnmount(() => {
//   unsubscribes()
//   window.removeEventListener('resize', updateDialogHeight)
// })

const emit = defineEmits(['selectDate', 'clearDate'])

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  month: dayjs().month(), // 0-11 https://day.js.org/docs/en/get-set/month
  day: dayjs().date(), // 1-31
  year: dayjs().year() // 2026
  // count: 0,
  // dialogHeight: null
})

// watch(() => props.visible, (value, prevValue) => {
//   if (value) {
//     updateDialogHeight()
//   }
// })
// watch(() => globalStore.spaceZoomPercent, (value, prevValue) => {

const today = computed(() => {
  return {
    month: dayjs().month(),
    day: dayjs().date()
  }
})

const toToday = () => {
  console.log(state.month, state.day)

  state.month = dayjs().month()
  state.day = dayjs().date()
  console.log('☎️☎️', state.month, state.day, calendarData.value, calendarData.value[state.month])
}
const toPrevMonth = () => {}
const toNextMonth = () => {}

// const updateDialogHeight = async () => {
//   if (!props.visible) { return }
//   await nextTick()
//   const element = dialogElement.value
//   state.dialogHeight = utils.elementHeight(element)
// }

// initialdateisToday

// const currentMonth =

const yearData = (year) => {
  return Array.from({ length: 12 }, (item, index) => {
    const date = dayjs(`${year}-${index + 1}-01`)
    return {
      month: date.format('MMM'),
      daysInMonth: date.daysInMonth(),
      startsOn: date.format('dd'),
      year
    }
  })
}
const calendarData = computed(() => {
  const year = dayjs().year()
  const currentYearData = yearData(year)
  const nextYearData = yearData(year + 1)
  const data = currentYearData.concat(nextYearData) // 24 months
  return data
})

// Object { month: "Jan", daysInMonth: 31, startsOn: "Wed" }

</script>

<template lang="pug">
dialog.narrow.date-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement")
  section.title-section
    .row.title-row
      p Jun 12, 2026
      div
        .segmented-buttons
          //- prev
          button.small-button(@click="toPrevMonth" title="Previous Month")
            img.icon.left-arrow(src="@/assets/down-arrow.svg")
          //- today
          button.small-button(@click="toToday")
            span Today
          //- next
          button.small-button(@click="toNextMonth" title="Next Month")
            img.icon.right-arrow(src="@/assets/down-arrow.svg")

  section.calendar-day-labels
    .day.day-label(data-label="Su") Su
    .day.day-label(data-label="Mo") Mo
    .day.day-label(data-label="Tu") Tu
    .day.day-label(data-label="We") We
    .day.day-label(data-label="Th") Th
    .day.day-label(data-label="Fr") Fr
    .day.day-label(data-label="Sa") Sa

  section.calendar
    button.day
      span 1
    button.day 2
    button.day 3
    button.day 4
    button.day.active
      span.badge.info.badge-in-button 5
    button.day 6
    button.day 7
    button.day 2
    button.day 2
    button.day 1
    button.day 12
    button.day 22
    button.day 12
</template>

<style lang="stylus">
dialog.date-picker
  .badge-in-button
    margin 0
  section.calendar-day-labels + section.calendar
    border-top 0
    padding-top 0

  section.calendar-day-labels,
  section.calendar
    display grid
    grid-template-columns repeat(7, 1fr)
    gap 6px
    justify-items center

  // section.calendar-day-labels
  //   .day-label
  //     color var(--secondary-active-background)

  section.calendar
    button.day
      margin 0
      width 100%
      min-width 0
      display flex
      align-items center
      justify-content center
      text-align center

      // padding 0
      &:first-child
        grid-column-start var(--start-day, 1)
      .badge
        margin 0
        padding 0 2px
  // .calendar-grid
  //   display grid
  //   grid-template-columns repeat(7, 1fr) /* 7 equal day columns */
  //   gap 1px
  // section.calendar + section.calendar
  //   border-top 0
  //   padding-top 0

  // section.calendar
  //   display flex
  //   flex-wrap wrap
  //   // align-content space-between
  //   // gap 6px
  //   &.day-labels
  //     justify-content space-between
  //     .day
  //       width 18px
  //   // .day-label
  //   //   color var(--secondary-background)
  //   button
  //     margin 0
  //     width fit-content
  //   .day
  //     width 24px
    // div
    //   margin 0

</style>
