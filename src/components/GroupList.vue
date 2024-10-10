<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import GroupLabel from '@/components/GroupLabel.vue'
const store = useStore()

const emit = defineEmits(['selectGroup'])

const props = defineProps({
  teams: Array,
  selectedGroup: Object
})

const selectGroup = (event, team) => {
  emit('selectGroup', event, team)
}
const teamIsSelected = (team) => {
  if (!team) { return }
  if (!props.selectedGroup) { return }
  return team.id === props.selectedGroup.id
}
</script>

<template lang="pug">
ul.results-list.team-list
  template(v-for="team in props.teams")
    li(:class="{ active: teamIsSelected(team) }" @click.stop="selectGroup($event, team)")
      GroupLabel(:team="team" :showName="true")
</template>

<style lang="stylus">
// .component-name
</style>
