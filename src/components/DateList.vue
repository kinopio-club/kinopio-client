<script setup>
import { computed } from 'vue'

import DatePicker from '@/components/dialogs/DatePicker.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'

const emit = defineEmits(['selectDate', 'toggleDatePicker'])

const props = defineProps({
  search: String,
  dateFromSearch: Object,
  hasFilteredUsers: Boolean,
  datePickerIsVisible: Boolean
})

const dateSearchLabel = computed(() => {
  const date = props.dateFromSearch
  if (!date) { return }
  return utils.shortAbsoluteDate(date)
})
const dateSearchIsToday = computed(() => props.dateFromSearch.isSame(dayjs(), 'day'))

const selectDate = (date) => {
  emit('selectDate', date)
}
const selectDaysFromToday = (number) => {
  const date = dayjs().add(number, 'day')
  emit('selectDate', date)
}
const toggleDatePicker = () => {
  emit('toggleDatePicker')
}
</script>

<template lang="pug">
//- date search
.date-list(v-if="props.dateFromSearch")
  ul.results-list
    li.date-list-item(@click.left="selectDate(props.dateFromSearch)" :class="{ hover: !props.hasFilteredUsers }")
      .badge(:class="{ info: dateSearchIsToday, secondary: !dateSearchIsToday }")
        img.icon.cal(src="@/assets/cal.svg")
        span {{dateSearchLabel}}
//- default dates
.date-list(v-if="!props.search")
  ul.results-list
    li.date-list-item(@click.left="selectDaysFromToday(0)")
      .badge.info
        img.icon.cal(src="@/assets/cal.svg")
        span 0d
      span Today
    li.date-list-item(@click.left="selectDaysFromToday(1)")
      .badge.secondary
        img.icon.cal(src="@/assets/cal.svg")
        span 1d
      span Tomorrow
    li.date-list-item(@click.stop="toggleDatePicker" :class="{ active: props.datePickerIsVisible }")
      .badge.secondary
        img.icon.cal(src="@/assets/cal.svg")
        span Custom Date
    DatePicker(:visible="props.datePickerIsVisible" @selectDate="selectDate")
</template>

<style lang="stylus">
.date-list
  padding 0 4px
  .date-list-item
    display flex
    align-items center
  dialog.date-picker
    top 20px
</style>
