<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import GroupLabel from '@/components/GroupLabel.vue'
const store = useStore()

const emit = defineEmits(['selectGroup'])

const props = defineProps({
  groups: Array,
  selectedGroup: Object
})

const selectGroup = (event, group) => {
  emit('selectGroup', event, group)
}
const groupIsSelected = (group) => {
  if (!group) { return }
  if (!props.selectedGroup) { return }
  return group.id === props.selectedGroup.id
}
</script>

<template lang="pug">
ul.results-list.group-list
  template(v-for="group in props.groups")
    li(:class="{ active: groupIsSelected(group) }" @click.stop="selectGroup($event, group)")
      GroupLabel(:group="group" :showName="true")
</template>

<style lang="stylus">
// .component-name
</style>
