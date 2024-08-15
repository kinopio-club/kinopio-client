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
  moonPhase: {},
  dialogHeight: null
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

// filters

const dialogSpaceFilterSortByDate = computed(() => store.state.currentUser.dialogSpaceFilterSortByDate)
const dialogSpaceFilterByType = computed(() => store.state.currentUser.dialogSpaceFilterByType)
const dialogSpaceFilterByUser = computed(() => store.state.currentUser.dialogSpaceFilterByUser)
const dialogSpaceFilterShowHidden = computed(() => store.state.currentUser.dialogSpaceFilterShowHidden)
const dialogSpaceFilterByTeam = computed(() => store.state.currentUser.dialogSpaceFilterByTeam)

// clear all

const clearAllFilters = () => {
  updateFilterByTeam(null)
  updateFilterByType(null)
  updateUserFilter({})
  updateSortBy(null)
  store.dispatch('currentUser/update', { dialogSpaceFilterShowHidden: false })
}
const totalFiltersActive = computed(() => {
  let count = 0
  if (dialogSpaceFilterByType.value) {
    count += 1
  }
  if (dialogSpaceFilterByUser.value) {
    count += Object.keys(dialogSpaceFilterByUser.value).length
  }
  if (dialogSpaceFilterSortByDate.value === 'createdAt') {
    count += 1
  }
  if (dialogSpaceFilterShowHidden.value) {
    count += 1
  }
  if (dialogSpaceFilterByTeam.value) {
    count += 1
  }
  return count
})

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
  const value = !dialogSpaceFilterShowHidden.value
  store.dispatch('currentUser/update', { dialogSpaceFilterShowHidden: value })
}

// by team

const teams = computed(() => store.getters['teams/byUser']())

const filterByTeamAll = computed(() => !dialogSpaceFilterByTeam.value)
const filterByTeamTeam = computed(() => dialogSpaceFilterByTeam.value === 'team')
const filterByTeamPersonal = computed(() => dialogSpaceFilterByTeam.value === 'personal')
const updateFilterByTeam = (value) => {
  store.dispatch('currentUser/update', { dialogSpaceFilterByTeam: value })
}

// by types

const filterByTypeAll = computed(() => Boolean(!dialogSpaceFilterByType.value))
const filterByTypeSpaces = computed(() => dialogSpaceFilterByType.value === 'spaces')
const filterByTypeJournals = computed(() => dialogSpaceFilterByType.value === 'journals')
const updateFilterByType = (value) => {
  store.dispatch('currentUser/update', { dialogSpaceFilterByType: value })
  if (value === 'journals') {
    updateSortBy('createdAt')
  } else {
    updateSortBy('updatedAt')
  }
}

// sort by

const isSortByUpdatedAt = computed(() => {
  const value = dialogSpaceFilterSortByDate.value
  return !value || value === 'updatedAt'
})
const isSortByCreatedAt = computed(() => {
  const value = dialogSpaceFilterSortByDate.value
  return value === 'createdAt'
})
const updateSortBy = (value) => {
  store.dispatch('currentUser/update', { dialogSpaceFilterSortByDate: value })
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
dialog.narrow.space-filters(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p Space Filters
  section
    .row
      //- clear all
      button(@click.left="clearAllFilters")
        img.icon.cancel(src="@/assets/add.svg")
        span Clear all
        span.badge.info.total-filters-active(v-if="totalFiltersActive") {{totalFiltersActive}}
    //- show team
    section.subsection(v-if="teams.length")
      p Filter by Team
      .segmented-buttons
        button(:class="{active: filterByTeamAll}" @click="updateFilterByTeam(null)")
          span All
        button(:class="{active: filterByTeamTeam}" @click="updateFilterByTeam('team')")
          img.icon.team(src="@/assets/team.svg")
        button(:class="{active: filterByTeamPersonal}" @click="updateFilterByTeam('personal')")
          span Personal

    //- types visibile
    section.subsection
      p Filter by Type

      .segmented-buttons
        button(@click="updateFilterByType(null)" :class="{active: filterByTypeAll}")
          span All
        button(@click="updateFilterByType('spaces')" :class="{active: filterByTypeSpaces}")
          span Normal
        button(@click="updateFilterByType('journals')" :class="{active: filterByTypeJournals}")
          MoonPhase(:moonPhase="state.moonPhase.name")
          span Journals
    //- sort by
    section.subsection
      p Sort by Date
      .segmented-buttons
        button(:class="{active: isSortByUpdatedAt}" @click="updateSortBy('updatedAt')")
          img.icon.time(src="@/assets/time.svg")
          span Updated
        button(:class="{active: isSortByCreatedAt}" @click="updateSortBy('createdAt')")
          img.icon.time(src="@/assets/time.svg")
          span Created
    //- show hidden
    .row
      .checkbox-wrap
        label(:class="{active: showHiddenSpace}")
          input(type="checkbox" v-model="showHiddenSpace")
          img.icon(v-if="!showHiddenSpace" src="@/assets/view.svg")
          img.icon(v-if="showHiddenSpace" src="@/assets/view-hidden.svg")
          span Show Hidden

  //- collaborators
  section.results-section.collaborators
    UserList(:users="spaceUsers" @selectUser="filterByUser" :selectedUser="dialogSpaceFilterByUser")
</template>

<style lang="stylus">
dialog.space-filters
  overflow auto
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
  .total-filters-active
    margin 0
    margin-left 5px
    margin-top -8px
    transform translateY(2px)
</style>
