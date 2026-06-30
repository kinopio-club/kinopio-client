<script setup>
import { reactive, computed, onMounted, onBeforeUnmount } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'

import DatePicker from '@/components/dialogs/DatePicker.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'

const globalStore = useGlobalStore()

let unsubscribes

onMounted(() => {
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerPickerFocusPosition') {
        const { list } = args[0]
        if (list === 'dates') {
          focusFirstItem()
        } else {
          state.focusOnId = ''
        }
      } else if (name === 'triggerPickerNavigationKey') {
        if (!props.isFocused) { return }
        const key = args[0]
        const items = dateItems.value
        const currentIndex = items.findIndex(item => item.id === state.focusOnId)
        if (key === 'ArrowUp') {
          focusPreviousItem(currentIndex)
        } else if (key === 'ArrowDown') {
          focusNextItem(currentIndex)
        }
      } else if (name === 'triggerPickerSelect') {
        if (!props.isFocused) { return }
        selectFocusedItem()
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const emit = defineEmits(['selectDate', 'toggleDatePicker', 'focusPreviousList'])

const props = defineProps({
  search: String,
  dateFromSearch: Object,
  datePickerIsVisible: Boolean,
  isFocused: Boolean
})

const state = reactive({
  focusOnId: ''
})

const dateItems = computed(() => {
  const items = []
  if (props.dateFromSearch) {
    items.push({ id: 'search' })
  } else if (!props.search) {
    items.push({ id: 'today' })
    items.push({ id: 'tomorrow' })
    items.push({ id: 'custom' })
  }
  return items
})

// keyboard focus

const itemIsFocused = (id) => state.focusOnId === id
const focusFirstItem = () => {
  state.focusOnId = dateItems.value[0]?.id || ''
}
const focusPreviousItem = (currentIndex) => {
  const previousItem = dateItems.value[currentIndex - 1]
  if (previousItem) {
    state.focusOnId = previousItem.id
  } else {
    emit('focusPreviousList') // hand off to the list above (e.g. UserList)
  }
}
const focusNextItem = (currentIndex) => {
  const nextItem = dateItems.value[currentIndex + 1]
  if (nextItem) {
    state.focusOnId = nextItem.id
  }
}

// select

const selectFocusedItem = () => {
  const id = state.focusOnId
  if (!id) { return }
  if (id === 'custom') {
    toggleDatePicker()
    return
  }
  globalStore.shouldPreventNextEnterKey = true
  if (id === 'search') {
    selectDate(props.dateFromSearch)
  } else if (id === 'today') {
    selectDaysFromToday(0)
  } else if (id === 'tomorrow') {
    selectDaysFromToday(1)
  }
}

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
    li.date-list-item(@click.left="selectDate(props.dateFromSearch)" :class="{ hover: itemIsFocused('search') }")
      .badge(:class="{ info: dateSearchIsToday, secondary: !dateSearchIsToday }")
        img.icon.cal(src="@/assets/cal.svg")
        span {{dateSearchLabel}}
//- default dates
.date-list(v-if="!props.search")
  ul.results-list
    li.date-list-item(@click.left="selectDaysFromToday(0)" :class="{ hover: itemIsFocused('today') }")
      .badge.info
        img.icon.cal(src="@/assets/cal.svg")
        span 0d
      span Today
    li.date-list-item(@click.left="selectDaysFromToday(1)" :class="{ hover: itemIsFocused('tomorrow') }")
      .badge.secondary
        img.icon.cal(src="@/assets/cal.svg")
        span 1d
      span Tomorrow
    li.date-list-item(@click.stop="toggleDatePicker" :class="{ active: props.datePickerIsVisible, hover: itemIsFocused('custom') }")
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
