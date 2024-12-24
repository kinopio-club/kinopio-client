<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import GroupLabel from '@/components/GroupLabel.vue'
import GroupDetails from '@/components/dialogs/GroupDetails.vue'

import sortBy from 'lodash-es/sortBy'

const store = useStore()

const emit = defineEmits(['selectGroup'])

const props = defineProps({
  groups: Array,
  selectedGroup: Object,
  groupDetailsIsVisibleForGroupId: String
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
const sortedGroups = computed(() => sortBy(props.groups, 'name'))
</script>

<template lang="pug">
ul.results-list.group-list
  template(v-for="group in sortedGroups" :key="group.id")
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
