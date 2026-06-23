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
  emit('selectUser', event, user)
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
  console.log('❤️❤️❤️❤️', date)
}
// ??or dayjs string dayjs('apr-2,2003')
// const selectDaysFromNow (daysFromToday) => {

// }
const selectDaysFromToday = (count) => {
  console.log('👄', count)
  // emit('selectDate', event, daysFromToday)
}

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

    .row(v-if="state.tipsIsVisible")
      p.badge.info To @mention other people, invite them to this space, or a group

  UserList(
    :users="filteredUsers"
    :selectedUsers="selectedUsers"
    @selectUser="selectUser"
    :isClickable="true"
    :shouldHideOptionsButton="true"
    :shouldHideResultsFilter="true"
  )

  section.results-section(v-if="!props.search")
    //- ^ search is not date
    //- support @2d, @today, @tomorrow, @oct1, @oct20 (monthNumber = next occurance, same yr or next)
    //- @t,o,d,a,y
    //- @n,o,v (default to 1st)

    //- TODO how to handle keyboard
    //- if no names, and a match for custom date, then show active state on li. enterkey = selectDaysFromToday

    //- TODO fix cal icon

    //- if days are > 2 display as abs date
    ul.results-list
      template(v-if="!props.search")
        //- TODO v-if search is valid date (!search = true)
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

    //- no matches found (if no filteredusers and no filteredDates)

    //- TODO DatePicker (design to be wrappable in DatePicker dialog.narrow)

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
  .date-list-item
    display flex
    align-items center
  dialog.date-picker
    top 20px
</style>
