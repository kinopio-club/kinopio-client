<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import TeamList from '@/components/TeamList.vue'
import utils from '@/utils.js'

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
const selectTeam = (event, team) => {
  emit('selectTeam', team)
}

</script>

<template lang="pug">
dialog.narrow.team-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    button(@click.left="clearTeam")
      img.icon.cancel(src="@/assets/add.svg")
      span Clear Team
  section.results-section(v-if="props.teams.length")
    TeamList(:teams="props.teams" :selectedTeam="props.selectedTeam" @selectTeam="selectTeam")
</template>

<style lang="stylus">
// dialog.team-picker
</style>
