<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import TeamLabel from '@/components/TeamLabel.vue'
const store = useStore()

const emit = defineEmits(['selectTeam'])

const props = defineProps({
  teams: Array,
  selectedTeam: Object
})

const selectTeam = (team) => {
  emit('selectTeam', team)
}
const teamIsSelected = (team) => {
  if (!props.selectedTeam) { return }
  return team.id === props.selectedTeam.id
}
</script>

<template lang="pug">
ul.results-list.team-list
  template(v-for="team in props.teams")
    li(:class="{ active: teamIsSelected(team) }" @click.stop="selectTeam(team)")
      TeamLabel(:team="team" :showName="true")
</template>

<style lang="stylus">
// .component-name
</style>
