<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import GroupList from '@/components/GroupList.vue'
import GroupsBetaInfo from '@/components/GroupsBetaInfo.vue'
import Loader from '@/components/Loader.vue'
import utils from '@/utils.js'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const emit = defineEmits(['selectGroup', 'clearGroup', 'closeDialogs'])

const props = defineProps({
  visible: Boolean,
  teams: Array,
  selectedGroup: Object
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

const isLoadingUserGroupsSpaces = computed(() => store.state.isLoadingUserGroupsSpaces)

// select team

const clearGroup = () => {
  emit('clearGroup')
}
const selectGroup = (event, team) => {
  emit('selectGroup', team)
}

// is in team

const isOnGroup = computed(() => {
  const teams = store.getters['teams/byUser']()
  return Boolean(teams.length)
})
const teamBetaMessage = computed(() => 'Only teams beta users can add spaces to teams.')

</script>

<template lang="pug">
dialog.narrow.team-picker(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    .row.title-row
      span Add to Group
      button.small-button(v-if="isOnGroup" @click.left="clearGroup")
        img.icon.cancel(src="@/assets/add.svg")
        span Clear

  //- loading
  template(v-if="isLoadingUserGroupsSpaces")
    section
      Loader(:visible="true")
  //- teams list
  template(v-else-if="isOnGroup")
    section.results-section(v-if="props.teams.length")
      GroupList(:teams="props.teams" :selectedGroup="props.selectedGroup" @selectGroup="selectGroup")
  //- teams beta info
  template(v-else)
    GroupsBetaInfo(:message="teamBetaMessage")
</template>

<style lang="stylus">
// dialog.team-picker
</style>
