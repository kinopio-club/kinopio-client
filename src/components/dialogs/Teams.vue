<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import TeamLabel from '@/components/TeamLabel.vue'
import TeamDetails from '@/components/dialogs/TeamDetails.vue'
import AddTeam from '@/components/dialogs/AddTeam.vue'

import uniqBy from 'lodash-es/uniqBy'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  store.subscribe(mutation => {
    if (mutation.type === 'updatePageSizes') {
      updateDialogHeight()
    }
  })
})

const visible = computed(() => store.state.teamsIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    store.commit('shouldExplicitlyHideFooter', true)
    closeDialogs()
    state.teamDetailsIsVisibleForTeamId = ''
    updateDialogHeight()
  }
})
const updateDialogHeight = async () => {
  if (!visible.value) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const state = reactive({
  dialogHeight: null,
  teamDetailsIsVisibleForTeamId: '',
  addTeamIsVisible: false
})
const closeDialogs = () => {
  state.addTeamIsVisible = false
  state.teamDetailsIsVisibleForTeamId = ''
}

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const currentUserCanCreateTeam = computed(() => currentUserIsSignedIn.value && store.state.currentUser.betaPermissionCreateTeam)
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}

// teams picker list

const teams = computed(() => {
  const user = store.state.currentUser
  const teamIds = utils.clone(store.state.teams.ids)
  const teams = teamIds.map(id => store.getters['teams/byId'](id))
  let teamUserTeams = teams.filter(team => {
    return team.users.find(teamUser => {
      const teamUserId = teamUser.id || teamUser.userId
      return teamUserId === user.id
    })
  })
  teamUserTeams = uniqBy(teamUserTeams, 'id')
  return teamUserTeams
})

// add team

const toggleAddTeamIsVisible = () => {
  const value = !state.addTeamIsVisible
  closeDialogs()
  state.addTeamIsVisible = value
}

// team details

const teamIsVisible = (team) => {
  return state.teamDetailsIsVisibleForTeamId === team.id
}
const toggleTeamDetailsIsVisible = (team) => {
  if (teamIsVisible(team)) {
    state.teamDetailsIsVisibleForTeamId = ''
  } else {
    state.teamDetailsIsVisibleForTeamId = team.id
  }
}
</script>

<template lang="pug">
dialog.narrow.teams(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p Teams
    .row(v-if="currentUserCanCreateTeam")
      .button-wrap
        button(:class="{ active: state.addTeamIsVisible }" @click.stop="toggleAddTeamIsVisible")
          img.icon.add(src="@/assets/add.svg")
          span New Team
        AddTeam(:visible="state.addTeamIsVisible" @closeDialogs="closeDialogs")
  section(v-if="!currentUserIsSignedIn")
    p Sign Up or In to create and manage teams
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
  //- team picker
  section.results-section(v-if="teams.length")
    ul.results-list
      template(v-for="team in teams")
        li(:class="{ active: teamIsVisible(team) }" @click.stop="toggleTeamDetailsIsVisible(team)")
          TeamLabel(:team="team" :showName="true")
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
  left initial
  right 16px
  top 20px
  .results-section
    overflow initial
  ul.results-list
    overflow initial
    li
      align-items center
      position relative
    dialog.team-details
      left -40px
      top 30px
</style>
