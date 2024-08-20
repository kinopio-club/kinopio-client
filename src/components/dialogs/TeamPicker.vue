<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import TeamLabel from '@/components/TeamLabel.vue'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
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

// select team

const clearTeam = () => {
  emit('clearTeam')
}
const selectTeam = (team) => {
  emit('selectTeam', team)
}
const teamIsSelected = (team) => {
  if (!props.selectedTeam) { return }
  return team.id === props.selectedTeam.id
}
</script>

<template lang="pug">
dialog.narrow.team-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    button(@click.left="clearTeam")
      img.icon.cancel(src="@/assets/add.svg")
      span Clear Team
  section.results-section(v-if="props.teams.length")
    ul.results-list
      template(v-for="team in props.teams")
        li(:class="{ active: teamIsSelected(team) }" @click.stop="selectTeam(team)")
          TeamLabel(:team="team" :showName="true")
</template>

<style lang="stylus">
// dialog.team-picker
</style>
