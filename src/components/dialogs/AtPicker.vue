<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import UserList from '@/components/UserList.vue'
import DatePicker from '@/components/dialogs/DatePicker.vue'
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

let unsubscribes

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerPickerSelect') {
        if (filteredUsers.value.length) { return }
        if (dateFromSearch.value) {
          selectDate(dateFromSearch.value)
        }
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
  unsubscribes()
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
  datePickerIsVisible: false
})

watch(() => props.visible, async (value) => {
  closeDialogs()
  state.tipsIsVisible = false
  if (value) {
    await updateDialogHeight()
    await nextTick()
    await scrollIntoView()
  }
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

// users

const availableUsers = computed(() => {
  let users = spaceStore.getSpaceAndGroupMembers.concat(globalStore.getOtherUsers)
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

watch(() => props.search, async (value) => {
  globalStore.triggerPickerNavigationFirst()
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
const dateSearchLabel = computed(() => {
  const date = dateFromSearch.value
  if (!date) { return }
  return utils.shortAbsoluteDate(date)
})
const dateSearchIsToday = computed(() => dateFromSearch.value.isSame(dayjs(), 'day'))
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
  console.log('🧞‍♀️', number, date)
  return date
}
const selectDaysFromToday = (number) => {
  const date = dateDaysFromToday(number)
  selectDate(date)
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
      p.badge.info To @mention other people, invite them to this space, or a group
  //- users
  UserList(
    :users="filteredUsers"
    :selectedUsers="selectedUsers"
    @selectUser="selectUser"
    :isClickable="true"
    :shouldHideOptionsButton="true"
    :shouldHideResultsFilter="true"
  )
  //- date search
  .date-list(v-if="dateFromSearch")
    ul.results-list
      li.date-list-item(@click.left="selectDate(dateFromSearch)" :class="{ hover: !filteredUsers.length }")
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
      li.date-list-item(@click.stop="toggleDatePickerIsVisible" :class="{ active: state.datePickerIsVisible }")
        .badge.secondary
          img.icon.cal(src="@/assets/cal.svg")
          span Custom Date
      DatePicker(:visible="state.datePickerIsVisible" @selectDate="selectDate")
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
  .date-list
    padding 0 4px
  .date-list-item
    display flex
    align-items center
  dialog.date-picker
    top 20px
</style>
