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

const currentDayLabel = computed(() => {
  const date = dayjs(`${state.year}-${state.month + 1}-${state.day}`)
  return date.format('MMM D, YYYY')
})

const today = computed(() => {
  return {
    month: dayjs().month(),
    day: dayjs().date(),
    year: dayjs().year()
  }
})

const toToday = () => {
  console.log(state.month, state.day)

  state.month = today.value.month
  state.day = today.value.day
  state.year = today.value.year
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
      startsOnIndex: date.day(), // 0 Sun – 6 Sat
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

const currentMonthData = computed(() => calendarData.value[state.month])
const days = computed(() => {
  const daysInMonth = currentMonthData.value.daysInMonth
  return Array.from({ length: daysInMonth }, (item, index) => index + 1)
})
const styles = (index) => {
  if (index !== 0) { return }
  return { '--start-day': currentMonthData.value.startsOnIndex + 1 }
}

</script>

<template lang="pug">
dialog.narrow.date-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement")
  section.title-section
    .row.title-row
      p {{currentDayLabel}}

      div
        .segmented-buttons
          //- prev
          button.small-button(@click="toPrevMonth" title="Previous Month")
            img.icon.left-arrow(src="@/assets/down-arrow.svg")
          //- today
          button.small-button(@click="toToday")
            span.badge.info.badge-in-button.today-badge-icon
          //- next
          button.small-button(@click="toNextMonth" title="Next Month")
            img.icon.right-arrow(src="@/assets/down-arrow.svg")

  section.calendar-day-labels
    .day.day-label Su
    .day.day-label Mo
    .day.day-label Tu
    .day.day-label We
    .day.day-label Th
    .day.day-label Fr
    .day.day-label Sa

  section.calendar
    button.day(
      v-for="(day, index) in days"
      :key="day"
      :class="{ active: day === state.day }"
      :style="styles(index)"
    )
      span.badge.info.badge-in-button(v-if="day === state.day") {{ day }}
      span(v-else) {{ day }}
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

  .today-badge-icon
    min-height 0
    display inline-block
    min-width 0
    padding 0
    width 10px
    height 10px

  section.calendar
    button.day
      margin 0
      width 100%
      min-width 0
      display flex
      align-items center
      justify-content center
      text-align center
      padding 2px 0

      // padding 0
      &:first-child
        grid-column-start var(--start-day, 1)
      .badge
        margin 0
        padding 0 1px
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
