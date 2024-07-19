<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import MoonPhase from '@/components/MoonPhase.vue'
import moonphase from '@/moonphase.js'
import UserList from '@/components/UserList.vue'
import utils from '@/utils.js'

import uniqBy from 'lodash-es/uniqBy'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    } else if (mutation.type === 'triggerClearAllSpaceFilters') {
      clearAllFilters()
    }
  })
  state.moonPhase = moonphase()
})

const props = defineProps({
  visible: Boolean,
  spaces: Array
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const state = reactive({
  moonPhase: {}
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const dialogSpaceFilters = computed(() => store.state.currentUser.dialogSpaceFilters)
const dialogSpaceFilterByUser = computed(() => store.state.currentUser.dialogSpaceFilterByUser)

// clear all

const clearAllFilters = () => {
  showAllSpaces()
  updateUserFilter({})
  updateSortBy(null)
  store.dispatch('currentUser/update', { dialogSpaceFilterShowHidden: false })
}
// show hidden

const showHiddenSpace = computed({
  get () {
    return store.state.currentUser.dialogSpaceFilterShowHidden
  },
  set () {
    toggleShowHiddenSpace()
  }
})
const toggleShowHiddenSpace = () => {
  const value = !store.state.currentUser.dialogSpaceFilterShowHidden
  store.dispatch('currentUser/update', { dialogSpaceFilterShowHidden: value })
}

// types visibile

const allIsActive = computed(() => Boolean(!dialogSpaceFilters.value))
const journalsIsActive = computed(() => dialogSpaceFilters.value === 'journals')
const spacesIsActive = computed(() => dialogSpaceFilters.value === 'spaces')
const showJournalsOnly = () => {
  updateFilter('journals')
}
const showSpacesOnly = () => {
  updateFilter('spaces')
}
const showAllSpaces = () => {
  updateFilter(null)
}
const updateFilter = (value) => {
  store.dispatch('currentUser/update', { dialogSpaceFilters: value })
  if (value === 'journals') {
    updateSortBy('createdAt')
  } else {
    updateSortBy('updatedAt')
  }
}

// sort by

const dialogSpaceFiltersSortBy = computed(() => store.state.currentUser.dialogSpaceFiltersSortBy)
const isSortByUpdatedAt = computed(() => {
  const value = dialogSpaceFiltersSortBy.value
  return !value || value === 'updatedAt'
})
const isSortByCreatedAt = computed(() => {
  const value = dialogSpaceFiltersSortBy.value
  return value === 'createdAt'
})
const updateSortBy = (value) => {
  store.dispatch('currentUser/update', { dialogSpaceFiltersSortBy: value })
}

// collaborators

const spaceUsers = computed(() => {
  const currentUserId = store.state.currentUser.id
  const spaces = props.spaces.filter(space => space.userId !== currentUserId)
  let users = spaces.map(space => space.users[0])
  users = users.filter(user => Boolean(user))
  users = uniqBy(users, 'id')
  return users
})
const updateUserFilter = (value) => {
  store.dispatch('currentUser/update', { dialogSpaceFilterByUser: value })
}
const filterByUser = (event, user) => {
  if (user.id === dialogSpaceFilterByUser.value.id) {
    updateUserFilter({})
  } else {
    updateUserFilter(user)
  }
}
</script>

<template lang="pug">
dialog.narrow.space-filters(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement")
  section
    p Space Filters
  section
    //- clear all
    button(@click.left="clearAllFilters")
      img.icon.cancel(src="@/assets/add.svg")
      span Clear all
    //- show hidden
    .row
      .checkbox-wrap
        label(:class="{active: showHiddenSpace}")
          input(type="checkbox" v-model="showHiddenSpace")
          img.icon(v-if="!showHiddenSpace" src="@/assets/view.svg")
          img.icon(v-if="showHiddenSpace" src="@/assets/view-hidden.svg")
          span Hidden Spaces
    //- types visibile
    .row
      .segmented-buttons
        button(@click="showAllSpaces" :class="{active: allIsActive}") All
        button(@click="showSpacesOnly" :class="{active: spacesIsActive}") Normal
        button(@click="showJournalsOnly" :class="{active: journalsIsActive}")
          MoonPhase(:moonPhase="state.moonPhase.name")
          span Journals
    //- sort by
    .row
      .segmented-buttons
        button(:class="{active: isSortByUpdatedAt}" @click="updateSortBy('updatedAt')")
          img.icon.time(src="@/assets/time.svg")
          span Updated
        button(:class="{active: isSortByCreatedAt}" @click="updateSortBy('createdAt')")
          img.icon.time(src="@/assets/time.svg")
          span Created
  //- collaborators
  section.results-section.collaborators
    UserList(:users="spaceUsers" :isClickable="true" @selectUser="filterByUser" :selectedUser="dialogSpaceFilterByUser")
</template>

<style lang="stylus">
dialog.space-filters
  left inherit
  right -212px
  @media(max-width 560px)
    right -100px
  @media(max-width 430px)
    right -50px
  @media(max-width 370px)
    right -0px
  .collaborators
    max-height calc(100vh - 200px)
  button + .row
    margin-top 10px
  .cancel
    vertical-align 0
</style>
