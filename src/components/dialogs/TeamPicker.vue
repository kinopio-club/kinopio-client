<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import TeamList from '@/components/TeamList.vue'
import TeamsBetaInfo from '@/components/TeamsBetaInfo.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['selectTeam', 'clearTeam', 'closeDialogs'])

const props = defineProps({
  visible: Boolean,
  teams: Array,
  selectedTeam: Object
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

const isLoadingUserTeamsSpaces = computed(() => store.state.isLoadingUserTeamsSpaces)

// select team

const clearTeam = () => {
  emit('clearTeam')
}
const selectTeam = (event, team) => {
  emit('selectTeam', team)
}

// is in team

const isOnTeam = computed(() => {
  const teams = store.getters['teams/byUser']()
  return Boolean(teams.length)
})
const teamBetaMessage = computed(() => 'Only teams beta users can add spaces to teams.')

</script>

<template lang="pug">
dialog.narrow.team-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    .row.title-row
      span Add to Team
      button.small-button(v-if="isOnTeam" @click.left="clearTeam")
        img.icon.cancel(src="@/assets/add.svg")
        span Clear

  //- loading
  template(v-if="isLoadingUserTeamsSpaces")
    section
      Loader(:visible="true")
  //- teams list
  template(v-else-if="isOnTeam")
    section.results-section(v-if="props.teams.length")
      TeamList(:teams="props.teams" :selectedTeam="props.selectedTeam" @selectTeam="selectTeam")
  //- teams beta info
  template(v-else)
    TeamsBetaInfo(:message="teamBetaMessage")
</template>

<style lang="stylus">
// dialog.team-picker
</style>
