<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import GroupLabel from '@/components/GroupLabel.vue'
import GroupDetails from '@/components/dialogs/GroupDetails.vue'
import ResultsFilter from '@/components/ResultsFilter.vue'
import utils from '@/utils.js'

import sortBy from 'lodash-es/sortBy'

const emit = defineEmits(['selectGroup'])

const props = defineProps({
  groups: Array,
  selectedGroup: Object,
  groupDetailsIsVisibleForGroupId: String
})
const state = reactive({
  filter: '',
  filteredGroups: []
})

const selectGroup = (event, group) => {
  emit('selectGroup', event, group)
}
const groupIsSelected = (group) => {
  if (!group) { return }
  if (!props.selectedGroup) { return }
  return group.id === props.selectedGroup.id
}
const groupDetailsIsVisible = (group) => {
  return group.id === props.groupDetailsIsVisibleForGroupId
}

// filter

const groups = computed(() => utils.clone(props.groups))
const groupsFiltered = computed(() => {
  let items
  if (state.filter) {
    items = state.filteredGroups
  } else {
    items = props.groups
  }
  return items
})

const updateFilter = (filter) => {
  state.filter = filter
}
const updateFilteredGroups = (groups) => {
  state.filteredGroups = groups
}
</script>

<template lang="pug">
span.group-list-wrap
  ResultsFilter(
    :items="groups"
    @updateFilter="updateFilter"
    @updateFilteredItems="updateFilteredGroups"
    placeholder="Search Groups"
  )
  ul.results-list.group-list
    template(v-for="group in groupsFiltered" :key="group.id")
      li(:class="{ active: groupIsSelected(group) }" @click.stop="selectGroup($event, group)" :data-group-id="group.id")
        GroupLabel(:group="group" :showName="true")
        GroupDetails(:visible="groupDetailsIsVisible(group)" :group="group")
</template>

<style lang="stylus">
ul.group-list
  dialog.group-details
    left -30px
    top 30px
  </style>
