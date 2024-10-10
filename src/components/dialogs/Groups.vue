<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import GroupLabel from '@/components/GroupLabel.vue'
import GroupDetails from '@/components/dialogs/GroupDetails.vue'
import AddGroup from '@/components/dialogs/AddGroup.vue'
import GroupsBetaInfo from '@/components/GroupsBetaInfo.vue'

import uniqBy from 'lodash-es/uniqBy'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const visible = computed(() => store.state.teamsIsVisible)
watch(() => visible.value, (value, prevValue) => {
  if (value) {
    store.commit('shouldExplicitlyHideFooter', true)
    closeDialogs()
    state.teamDetailsIsVisibleForGroupId = ''
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
  teamDetailsIsVisibleForGroupId: '',
  addGroupIsVisible: false
})
const closeDialogs = () => {
  state.addGroupIsVisible = false
  state.teamDetailsIsVisibleForGroupId = ''
}

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const currentUserCanCreateGroup = computed(() => currentUserIsSignedIn.value && store.state.currentUser.betaPermissionCreateGroup)
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}

// teams picker list

const teams = computed(() => {
  const user = store.state.currentUser
  const teamIds = utils.clone(store.state.teams.ids)
  const teams = teamIds.map(id => store.getters['teams/byId'](id))
  let teamUserGroups = teams.filter(team => {
    return team.users.find(teamUser => {
      const teamUserId = teamUser.id || teamUser.userId
      return teamUserId === user.id
    })
  })
  teamUserGroups = uniqBy(teamUserGroups, 'id')
  return teamUserGroups
})

// add team

const toggleAddGroupIsVisible = () => {
  const value = !state.addGroupIsVisible
  closeDialogs()
  state.addGroupIsVisible = value
}

// team details

const teamIsVisible = (team) => {
  return state.teamDetailsIsVisibleForGroupId === team.id
}
const toggleGroupDetailsIsVisible = (team) => {
  if (teamIsVisible(team)) {
    state.teamDetailsIsVisibleForGroupId = ''
  } else {
    state.teamDetailsIsVisibleForGroupId = team.id
  }
}

// beta info

const teamBetaMessage = computed(() => 'Only teams beta users can create and manage teams.')

</script>

<template lang="pug">
dialog.narrow.teams(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p Groups
    .row(v-if="currentUserCanCreateGroup")
      .button-wrap
        button(:class="{ active: state.addGroupIsVisible }" @click.stop="toggleAddGroupIsVisible")
          img.icon.add(src="@/assets/add.svg")
          span New Group
        AddGroup(:visible="state.addGroupIsVisible" @closeDialogs="closeDialogs")
  section(v-if="!currentUserIsSignedIn")
    p Sign Up or In to create and manage teams
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
  //- team picker
  template(v-if="teams.length")
    section.results-section
      ul.results-list
        template(v-for="team in teams")
          li(:class="{ active: teamIsVisible(team) }" @click.stop="toggleGroupDetailsIsVisible(team)")
            GroupLabel(:team="team" :showName="true")
            GroupDetails(:visible="teamIsVisible(team)" :team="team")
  //- teams beta notice
  template(v-else)
    GroupsBetaInfo(:message="teamBetaMessage")
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
