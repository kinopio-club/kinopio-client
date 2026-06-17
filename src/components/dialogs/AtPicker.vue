<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import UserList from '@/components/UserList.vue'
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

const emit = defineEmits(['closeDialog', 'selectUser', 'selectDate'])

const props = defineProps({
  visible: Boolean,
  position: Object,
  search: String,
  cursorPosition: Number,
  cards: Array,
  searchIsDisabled: Boolean
})

const state = reactive({
  dialogHeight: null
})

watch(() => props.visible, async (value) => {
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

const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const availableUsers = computed(() => {
  let users = spaceStore.getSpaceAndGroupMembers.concat(globalStore.getOtherUsers)
  users = uniqBy(users, 'id')
  return users
})
const isMultipleAvailableUsers = computed(() => availableUsers.value.length > 1)

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
const selectDate = (event, daysFromToday) => {
  emit('selectDate', event, daysFromToday)
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

</script>

<template lang="pug">
dialog.narrow.at-picker(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="styles")
  section.info-section(v-if="!props.search && currentUserIsSignedIn && !props.searchIsDisabled")
    p
      img.icon.search(src="@/assets/search.svg")
      span Type for users or dates

  UserList(
    :users="filteredUsers"
    :selectedUsers="selectedUsers"
    @selectUser="selectUser"
    :isClickable="true"
    :shouldHideOptionsButton="true"
    :shouldHideResultsFilter="true"
  )
  section(v-if="!isMultipleAvailableUsers")
    p.badge.info To @mention others, invite them to this space, or a group

  section.results-section(v-if="!props.search")
    //- ^ search is not date
    //- support @2d, @today, @tomorrow, @oct1, @oct20
    //- @t,o,d,a,y
    //- @n,o,v (default to 1st)

    //- TODO how to handle keyboard
    //- if no names, and a match for custom date, then show active state on li. enterkey = selectdate

    //- TODO fix cal icon

    //- if days are > 2 display as abs date
    ul.results-list
      template(v-if="!props.search")
        li.date-list-item
          //- @click.left=selectDate(1)
          .badge.secondary
            img.icon.time(src="@/assets/time.svg")
            span 0d
          span Today
        li.date-list-item
          .badge.secondary
            //- @click.left=selectDate(1)
            img.icon.time(src="@/assets/time.svg")
            span 1d
          span Tomorrow
        li.date-list-item
          .badge.secondary
            img.icon.time(src="@/assets/time.svg")
            span Custom Date

      //- DatePicker (teleport to top of dialog)

</template>

<style lang="stylus">
dialog.at-picker
  overflow auto
  .user-list
    max-height 100px // matches userListMaxHeight
    overflow auto
  .date-list-item
    display flex
    align-items center
    > .badge.secondary
      display flex
      align-items center
      margin-left -4px
</style>
