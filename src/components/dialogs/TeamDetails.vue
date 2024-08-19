<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import UserList from '@/components/UserList.vue'
import User from '@/components/User.vue'
import ColorPicker from '@/components/dialogs/ColorPicker.vue'
import TeamLabel from '@/components/TeamLabel.vue'
import utils from '@/utils.js'

import randomColor from 'randomcolor'

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
  team: Object
})
const state = reactive({
  dialogHeight: null,
  colorPickerIsVisible: false,
  billingTipsIsVisible: false
})

watch(() => props.visible, (value, prevValue) => {
  closeDialogs()
  state.billingTipsIsVisible = false
  if (value) {
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}
const closeDialogs = () => {
  state.colorPickerIsVisible = false
  store.commit('userDetailsIsVisible', false)
}
const childDialogIsVisible = computed(() => {
  return state.colorPickerIsVisible
})

// team

const currentUserIsTeamAdmin = computed(() => {
  return store.getters['teams/teamUserIsAdmin']({
    userId: store.state.currentUser.id,
    teamId: props.team.id
  })
})
const updateTeam = (update) => {
  update.id = props.team.id
  store.dispatch('teams/update', update)
}

// team color

const teamColor = computed(() => props.team.color)
const updateTeamColor = (newValue) => {
  updateTeam({ color: newValue })
}
const toggleColorPicker = () => {
  const isVisible = state.colorPickerIsVisible
  closeDialogs()
  state.colorPickerIsVisible = !isVisible
}

// team name

const teamName = computed({
  get () {
    return props.team.name
  },
  set (newValue) {
    updateTeam({ name: newValue })
  }
})

// billing

const toggleBillingTipsIsVisible = () => {
  state.billingTipsIsVisible = !state.billingTipsIsVisible
}

// invite

const currentUser = computed(() => store.state.currentUser)
const randomUser = computed(() => {
  const luminosity = store.state.currentUser.theme
  const color = randomColor({ luminosity })
  return { color }
})
const inviteUrl = computed(() => {
  if (!props.team.collaboratorKey) { return }
  const url = utils.teamInviteUrl({
    teamId: props.team.id,
    teamName: props.team.name,
    collaboratorKey: props.team.collaboratorKey
  })
  return url
})
const copyInviteUrl = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  console.log('🍇 team invite url', inviteUrl.value)
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyInviteUrl', error, inviteUrl.value)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

// select user

const selectedUser = computed(() => {
  const userDetailsIsVisible = store.state.userDetailsIsVisible
  if (!userDetailsIsVisible) { return }
  return store.state.userDetailsUser
})
const toggleUserDetails = (event, user) => {
  closeDialogs()
  showUserDetails(event, user)
}
const showUserDetails = (event, user) => {
  const shouldHideUserDetails = user.id === store.state.userDetailsUser.id
  if (shouldHideUserDetails) {
    closeDialogs()
    store.commit('userDetailsUser', {})
    return
  }
  let element = event.target
  let options = { element, offsetX: 0, shouldIgnoreZoom: true }
  let position = utils.childDialogPositionFromParent(options)
  const userListBadgeOffsetY = 60
  position.y = position.y - userListBadgeOffsetY
  store.commit('userDetailsUser', user)
  store.commit('userDetailsPosition', position)
  store.commit('userDetailsIsVisible', true)
}
</script>

<template lang="pug">
dialog.team-details.wide(v-if="visible" :open="visible" @click.left.stop="closeDialogs" ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}" :class="{ 'child-dialog-is-visible': childDialogIsVisible }")
  section
    .row
      template(v-if="currentUserIsTeamAdmin")
        .button-wrap
          button.change-color(@click.left.stop="toggleColorPicker" :class="{active: state.colorPickerIsVisible}" title="Change Team Color")
            .current-color.current-team-color(:style="{ background: teamColor }")
          ColorPicker(:currentColor="teamColor" :visible="state.colorPickerIsVisible" @selectedColor="updateTeamColor")
        input.name(placeholder="Team Name" v-model="teamName" name="teamName" maxlength=100 @mouseup.stop)

      template(v-else)
        TeamLabel(:team="props.team" :showName="true")

    //- TODO is billing user
    //- .row.billing-tips(v-if="currentUserIsTeamAdmin" :class="{ active: state.billingTipsIsVisible} ")
  section(v-if="inviteUrl")
    .row.invite-row
      p
        .users
          User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
          User(:user="randomUser" :isClickable="false" :key="currentUser.id" :isSmall="true" :hideYouLabel="true")
        span Invite Team Members
      button.small-button(v-if="currentUserIsTeamAdmin" @click="toggleBillingTipsIsVisible" :class="{ active: state.billingTipsIsVisible} ")
        span Billing

    section.subsection(v-if="state.billingTipsIsVisible")
      p Each team user costs 6$/mo or 60$/yr
      p Team users can create unlimited cards and have all the other benefits of an upgraded account.
      p If you have a multiple teams with the same user, you will only be billed once for that user.
      button team billing center
      //- p btn settings -> team billing
      //- p next bill cost
      //- p update team billing info
      //- p total current cost is $12/mo

    section.subsection
      .row
        button(@click.left="copyInviteUrl")
          img.icon.copy(src="@/assets/copy.svg")
          span Copy Invite to Team URL
      //- .row
      //-   button
      //-     img.icon.mail(src="@/assets/mail.svg")
      //-     span Email Invites
  UserList(
    :users="props.team.users"
    :selectedUser="selectedUser"
    @selectUser="toggleUserDetails"
    :isClickable="true"
    :showTeamUserActions="true"
    :team="props.team"
  )
</template>

<style lang="stylus">
dialog.team-details
  overflow auto
  &.child-dialog-is-visible
    overflow initial
  input.name
    margin-bottom 0
  button.change-color
    margin-right 6px
  .search-wrap
    padding-top 6px
  .user-list
    border-top 1px solid var(--primary-border)
  .invite-row
    justify-content space-between
    button
      margin 0
    .users
      margin-right 5px
      .user
        vertical-align -3px
        .anon-avatar
          top 6px
  .change-color
    .current-team-color
      border-radius 10px
</style>
