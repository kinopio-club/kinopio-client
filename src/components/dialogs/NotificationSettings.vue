<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import GroupList from '@/components/GroupList.vue'
import utils from '@/utils.js'

const store = useStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  unsubscribedSpaces: [],
  unsubscribedGroups: [],
  isLoading: true
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
    updateUnsubscribed()
    // updateUnsubscribedGroups()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  let element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const isSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const shouldEmailNotifications = computed(() => store.state.currentUser.shouldEmailNotifications)
const shouldEmailBulletin = computed(() => store.state.currentUser.shouldEmailBulletin)
const shouldEmailWeeklyReview = computed(() => store.state.currentUser.shouldEmailWeeklyReview)
const parentDialog = computed(() => 'notificationSettings')

const toggleShouldEmailNotifications = () => {
  const value = !shouldEmailNotifications.value
  store.dispatch('currentUser/shouldEmailNotifications', value)
}
const toggleShouldEmailBulletin = () => {
  const value = !shouldEmailBulletin.value
  store.dispatch('currentUser/shouldEmailBulletin', value)
}
const toggleShouldEmailWeeklyReview = () => {
  const value = !shouldEmailWeeklyReview.value
  store.dispatch('currentUser/shouldEmailWeeklyReview', value)
}
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}

// items

const updateUnsubscribed = async () => {
  try {
    state.isLoading = true
    state.unsubscribedSpaces = await store.dispatch('api/getSpacesNotificationUnsubscribed')
    state.unsubscribedGroups = await store.dispatch('api/getGroupsNotificationUnsubscribed')
    console.log(state.unsubscribedGroups)
  } catch (error) {
    console.error('🚒 updateUnsubscribed', error)
  }
  state.isLoading = false
}
const resubscribeToSpace = (space) => {
  state.unsubscribedSpaces = state.unsubscribedSpaces.filter(item => item.id !== space.id)
  store.dispatch('api/spaceNotificationResubscribe', space)
  store.commit('addNotification', { message: `Resubscribed to notifications from ${space.name}`, type: 'success' })
}
const resubscribeToGroup = (event, group) => {
  state.unsubscribedGroups = state.unsubscribedGroups.filter(item => item.id !== group.id)
  store.dispatch('api/groupNotificationResubscribe', group)
  store.commit('addNotification', { message: `Resubscribed to notifications from ${group.name}`, type: 'success' })
}
</script>

<template lang="pug">
dialog.narrow.notification-settings(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section
    p Notifications
  template(v-if="!currentUserIsSignedIn")
    section
      p After you sign up you'll be able to manage your notification settings here
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
  template(v-else)
    section
      .row A biweekly newsletter about upcoming features and cool spaces
      .row
        label(:class="{active: shouldEmailBulletin}" @click.left.prevent="toggleShouldEmailBulletin" @keydown.stop.enter="toggleShouldEmailBulletin")
          input(type="checkbox" v-model="shouldEmailBulletin")
          span Email Bulletins
    section
      .row Review cards you've created and updated this week
      .row
        label(:class="{active: shouldEmailWeeklyReview}" @click.left.prevent="toggleShouldEmailWeeklyReview" @keydown.stop.enter="toggleShouldEmailWeeklyReview")
          input(type="checkbox" v-model="shouldEmailWeeklyReview")
          span Email Weekly Review

    section
      .row Updates when collaborators add cards to your spaces, or invite you to their spaces
      .row
        label(:class="{active: shouldEmailNotifications}" @click.left.prevent="toggleShouldEmailNotifications" @keydown.stop.enter="toggleShouldEmailNotifications")
          input(type="checkbox" v-model="shouldEmailNotifications")
          span Email Notifications
      Loader(:visible="state.isLoading")

      template(v-if="state.unsubscribedSpaces.length || state.unsubscribedGroups.length")
        .row Resubscribe to:
        SpaceList(
          :spaces="state.unsubscribedSpaces"
          :showUser="true"
          @selectSpace="resubscribeToSpace"
          :disableListOptimizations="true"
          :parentDialog="parentDialog"
          :hidePreviewImage="true"
        )
        GroupList(
          :groups="state.unsubscribedGroups"
          @selectGroup="resubscribeToGroup"
        )
</template>

<style lang="stylus">
.notification-settings
  overflow auto
</style>
