<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import UserList from '@/components/UserList.vue'
import DateList from '@/components/DateList.vue'
import utils from '@/utils.js'

import fuzzy from '@/libs/fuzzy.js'
import uniqBy from 'lodash-es/uniqBy'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['selectUser', 'selectDate'])

const props = defineProps({
  visible: Boolean,
  position: Object,
  search: String,
  cursorPosition: Number,
  cards: Array,
  searchIsDisabled: Boolean
})

const state = reactive({
  dialogHeight: null,
  tipsIsVisible: false,
  datePickerIsVisible: false,
  focusedList: 'users' // 'users', 'dates'
})

watch(() => props.visible, async (value) => {
  closeDialogs()
  state.tipsIsVisible = false
  if (value) {
    await updateDialogHeight()
    await nextTick()
    await scrollIntoView()
    updateFocusedList()
  }
})

watch(() => props.search, async (value) => {
  await nextTick()
  updateFocusOnSearch()
})

const scrollIntoView = async () => {
  // wait for element to be rendered before getting position
  await nextTick()
  await nextTick()
  await nextTick()
  const element = dialogElement.value
  globalStore.scrollElementIntoView({ element })
}

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const closeDialogs = () => {
  state.datePickerIsVisible = false
}

const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)

const styles = computed(() => {
  const value = {
    top: props.position?.top + 'px',
    maxHeight: state.dialogHeight + 'px'
  }
  if (isMultipleAvailableUsers.value) {
    const rowHeight = 33
    const userListMaxHeight = 100
    let minHeight = filteredUsers.value.length * rowHeight
    minHeight = Math.min(minHeight, userListMaxHeight)
    value.minHeight = minHeight + 'px'
  }
  return value
})

// keyboard focus across lists

const updateFocusedList = () => {
  if (filteredUsers.value.length) {
    state.focusedList = 'users'
  } else {
    state.focusedList = 'dates'
  }
}
const updateFocusOnSearch = () => {
  updateFocusedList()
  globalStore.triggerPickerFocusPosition({ list: state.focusedList, position: 'first' })
}
// ArrowDown past the end of UserList -> first DateList item
const focusDateList = () => {
  const isDates = Boolean(dateFromSearch.value) || !props.search
  if (!isDates) { return }
  state.focusedList = 'dates'
  globalStore.triggerPickerFocusPosition({ list: 'dates', position: 'first' })
}
// ArrowUp past the first DateList item -> last UserList item
const focusUserList = () => {
  if (!filteredUsers.value.length) { return }
  state.focusedList = 'users'
  globalStore.triggerPickerFocusPosition({ list: 'users', position: 'last' })
}

// users

const availableUsers = computed(() => {
  let users = spaceStore.getSpaceAndGroupMembers
  users = uniqBy(users, 'id')
  return users
})
const isMultipleAvailableUsers = computed(() => availableUsers.value.length > 1)
const filteredUsers = computed(() => {
  let users = availableUsers.value
  if (!props.search) { return users }
  const options = {
    pre: '',
    post: '',
    extract: (item) => {
      const name = item.name || ''
      return name
    }
  }
  const filtered = fuzzy.filter(props.search, users, options)
  users = filtered.map(item => item.original)
  return users.slice(0, 5)
})
const selectUser = (event, user) => {
  emit('selectUser', user)
}
const selectedUsers = computed(() => {
  let users = []
  props.cards.forEach(card => {
    users = users.concat(userStore.getUsersByCardAtUserMentions(card))
  })
  return users
})

// tips

const toggleTipsIsVisible = () => {
  state.tipsIsVisible = !state.tipsIsVisible
}

// date

const parseDateString = (input) => {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  const lower = input.toLowerCase()
  const monthPart = lower.slice(0, 3)
  const dayPart = lower.slice(3)
  if (!months.includes(monthPart)) { return }
  const month = months.indexOf(monthPart)
  const day = parseInt(dayPart, 10) || 1 // if no day, use 1
  const year = dayjs().year()
  let date = dayjs(new Date(year, month, day))
  if (date.isBefore(dayjs(), 'day')) date = date.add(1, 'year') // if date is past, use next year
  return date
}

const dateFromSearch = computed(() => {
  if (!props.search) { return }
  // @2d
  // https://regexr.com/8nef7
  const dayPattern = /^\d{1,2}d$/i // 1-2 digits + d
  const isDays = dayPattern.test(props.search)
  if (isDays) {
    return dateDaysFromToday(parseInt(props.search))
  }
  // @today
  const isToday = 'today'.startsWith(props.search)
  if (isToday) {
    return dateDaysFromToday(0)
  }
  // @tomorrow
  const isTomorrow = 'tomorrow'.startsWith(props.search)
  if (isTomorrow) {
    return dateDaysFromToday(1)
  }
  // @nov20
  const datePattern = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\d{0,2}$/i // match + 0-2 digits
  const isDate = datePattern.test(props.search)
  if (isDate) {
    return parseDateString(props.search)
  }
  return null
})
const triggerDateAndTimeSettingsIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerDateAndTimeSettingsIsVisible()
}
const toggleDatePickerIsVisible = () => {
  const value = !state.datePickerIsVisible
  closeDialogs()
  state.datePickerIsVisible = value
}
const selectDate = (date) => {
  emit('selectDate', date)
}
const dateDaysFromToday = (number) => {
  const date = dayjs().add(number, 'day')
  return date
}

const isNoResults = computed(() => {
  if (!props.search) { return }
  const isUsers = Boolean(filteredUsers.value.length)
  const isDate = Boolean(dateFromSearch.value)
  return !isUsers && !isDate
})
</script>

<template lang="pug">
dialog.narrow.at-picker(v-if="props.visible" :open="props.visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="styles" :class="{ 'child-dialog-is-visible': state.datePickerIsVisible }")
  section.info-section(v-if="!props.search && currentUserIsSignedIn && !props.searchIsDisabled")
    .row.title-row
      div
        img.icon.search(src="@/assets/search.svg")
        span Type users or date
      div
        //- settings
        button.small-button(@click.stop="triggerDateAndTimeSettingsIsVisible" title="Date and Time Settings")
          img.icon.settings(src="@/assets/settings.svg")
        //- tips
        button.small-button(@click.stop="toggleTipsIsVisible" :class="{ active: state.tipsIsVisible }")
          span ?
    //- tips
    .row(v-if="state.tipsIsVisible")
      span.badge.info.tips-badge
        p To @mention other people, invite them to this space, or a group.
        p Type dates with '5d', 'today', 'tomorrow', or 'nov20' syntax.
  //- users
  UserList(
    :users="filteredUsers"
    :selectedUsers="selectedUsers"
    @selectUser="selectUser"
    :isClickable="true"
    :shouldHideOptionsButton="true"
    :shouldHideResultsFilter="true"
    :isFocused="state.focusedList === 'users'"
    @focusNextList="focusDateList"
  )
  //- dates
  DateList(
    :search="props.search"
    :dateFromSearch="dateFromSearch"
    :datePickerIsVisible="state.datePickerIsVisible"
    :isFocused="state.focusedList === 'dates'"
    @selectDate="selectDate"
    @toggleDatePicker="toggleDatePickerIsVisible"
    @focusPreviousList="focusUserList"
  )
  //- no matches
  section(v-if="isNoResults") No matches found
</template>

<style lang="stylus">
dialog.at-picker
  overflow auto
  &.child-dialog-is-visible
    overflow initial
  .user-list
    max-height 100px // matches userListMaxHeight
    overflow auto
    padding 0 4px
  .tips-badge
    margin 0
</style>
