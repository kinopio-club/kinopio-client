<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import TeamLabel from '@/components/TeamLabel.vue'
import TeamDetails from '@/components/dialogs/TeamDetails.vue'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const props = defineProps({
  visible: Boolean,
  teams: Array
})
const state = reactive({
  dialogHeight: null,
  teamIsVisibleForTeamId: ''
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    state.teamIsVisibleForTeamId = ''
    updateDialogHeight()
  }
})
const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const teamIsVisible = (team) => {
  return state.teamIsVisibleForTeamId === team.id
}
const toggleTeamIsVisible = (team) => {
  if (teamIsVisible(team)) {
    state.teamIsVisibleForTeamId = ''
  } else {
    state.teamIsVisibleForTeamId = team.id
  }
}
</script>

<template lang="pug">
dialog.narrow.teams(v-if="visible" :open="visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p Teams
  section(v-if="!currentUserIsSignedIn")
    p Sign Up or In to create and manage teams
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
  //- team picker
  section.results-section(v-if="props.teams.length")
    ul.results-list
      template(v-for="team in props.teams")
        li(:class="{ active: teamIsVisible(team) }" @click.stop="toggleTeamIsVisible(team)")
          TeamLabel(:team="team" :showIcon="true" :showName="true")
          TeamDetails(:visible="teamIsVisible(team)" :team="team")
  //- teams beta notice
  section(v-else)
    section.subsection
      p While teams is in beta, only beta program users can create and manage teams.
      p
        img.icon(src="@/assets/mail.svg")
        span Interested in trying teams in your company? Email&nbsp;
        a(href="mailto:support@kinopio.club?subject=Kinopio Teams Beta") support@kinopio.club
</template>

<style lang="stylus">
dialog.teams
  top initial !important
  bottom 8px
  ul.results-list
    li
      align-items center
      position initial
</style>
