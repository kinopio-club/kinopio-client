<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserList from '@/components/UserList.vue'
import utils from '@/utils.js'
import GroupList from '@/components/GroupList.vue'
import Loader from '@/components/Loader.vue'

import uniqBy from 'lodash-es/uniqBy'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  store.subscribe(mutation => {
    if (mutation.type === 'triggerClearAllSpaceFilters') {
      clearAllFilters()
    }
  })
})

const props = defineProps({
  visible: Boolean,
  spaces: Array,
  isLoading: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const state = reactive({
  dialogHeight: null
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

// filters

const dialogSpaceFilterSortBy = computed(() => store.state.currentUser.dialogSpaceFilterSortBy)
const dialogSpaceFilterByUser = computed(() => store.state.currentUser.dialogSpaceFilterByUser)
const dialogSpaceFilterShowHidden = computed(() => store.state.currentUser.dialogSpaceFilterShowHidden)
const dialogSpaceFilterByGroup = computed(() => store.state.currentUser.dialogSpaceFilterByGroup)
const dialogSpaceFilterByTemplates = computed(() => store.state.currentUser.dialogSpaceFilterByTemplates)

// clear all

const clearAllFilters = () => {
  updateGroupFilter({})
  updateUserFilter({})
  updateSortBy(null)
  store.dispatch('currentUser/update', {
    dialogSpaceFilterShowHidden: false,
    dialogSpaceFilterByTemplates: false
  })
}
const totalFiltersActive = computed(() => {
  let count = 0
  if (dialogSpaceFilterSortBy.value === 'createdAt') {
    count += 1
  }
  if (dialogSpaceFilterShowHidden.value) {
    count += 1
  }
  if (utils.objectHasKeys(dialogSpaceFilterByGroup.value)) {
    count += 1
  }
  if (utils.objectHasKeys(dialogSpaceFilterByUser.value)) {
    count += 1
  }
  if (dialogSpaceFilterByTemplates.value) {
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

// sort by

const isSortByUpdatedAt = computed(() => {
  const value = dialogSpaceFilterSortBy.value
  return !value || value === 'updatedAt'
})
const isSortByCreatedAt = computed(() => {
  const value = dialogSpaceFilterSortBy.value
  return value === 'createdAt'
})
const isSortByAlphabetical = computed(() => {
  const value = dialogSpaceFilterSortBy.value
  return value === 'alphabetical'
})
const updateSortBy = (value) => {
  store.dispatch('currentUser/update', { dialogSpaceFilterSortBy: value })
}

// templates

const isTemplates = computed(() => {
  const templateSpace = props.spaces.find(space => space.isTemplate)
  return Boolean(templateSpace)
})
const toggleFilterByTemplates = () => {
  const value = !dialogSpaceFilterByTemplates.value
  store.dispatch('currentUser/update', { dialogSpaceFilterByTemplates: value })
}

// groups

const isGroups = computed(() => {
  if (!groups.value) { return }
  return groups.value.length
})
const groups = computed(() => store.getters['groups/byUser']())
const filterByGroup = (event, group) => {
  if (group.id === dialogSpaceFilterByGroup.value.id) {
    updateGroupFilter({})
  } else {
    updateGroupFilter(group)
  }
}
const updateGroupFilter = (value) => {
  store.dispatch('currentUser/update', { dialogSpaceFilterByGroup: value })
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

const isLoading = computed(() => {
  return props.isLoading || store.state.isLoadingGroups
})

</script>

<template lang="pug">
dialog.narrow.space-filters(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.section-title
    .row.title-row
      span Space Filters
      button.small-button(@click.left="clearAllFilters" title="Clear all space filters")
        img.icon.cancel(src="@/assets/add.svg")
        span Clear
        span.badge.info.filter-is-active(v-if="totalFiltersActive")

  section
    //- sort by
    section.subsection
      p
        span Sort by
      .segmented-buttons
        button(:class="{active: isSortByUpdatedAt}" @click="updateSortBy('updatedAt')" title="Sort spaces by updated at")
          span Updated
        button(:class="{active: isSortByCreatedAt}" @click="updateSortBy('createdAt')" title="Sort spaces by created at")
          span Created
        button(:class="{active: isSortByAlphabetical}" @click="updateSortBy('alphabetical')" title="Sort spaces alphabetically")
          span ABC
    //- show hidden
    .row
      .checkbox-wrap.button-wrap
        label(:class="{active: showHiddenSpace}" title="Show hidden spaces")
          input(type="checkbox" v-model="showHiddenSpace")
          span Show Hidden

  //- loading
  section(v-if="isLoading")
    Loader(:visible="true")

  //- other space filter types
  section.results-section.other(v-if="isTemplates")
    ul.results-list
      li(@click="toggleFilterByTemplates" :class="{active: dialogSpaceFilterByTemplates}")
        img.icon.templates(src="@/assets/templates.svg")
        span Templates
  //- groups
  section.results-section.groups(v-if="isGroups")
    GroupList(:groups="groups" :selectedGroup="dialogSpaceFilterByGroup" @selectGroup="filterByGroup")
  //- collaborators
  section.results-section.collaborators(v-if="spaceUsers.length")
    UserList(:users="spaceUsers" :selectedUser="dialogSpaceFilterByUser" @selectUser="filterByUser")

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
