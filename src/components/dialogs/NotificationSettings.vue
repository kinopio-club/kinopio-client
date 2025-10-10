<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import Loader from '@/components/Loader.vue'
import SpaceList from '@/components/SpaceList.vue'
import GroupList from '@/components/GroupList.vue'
import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

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
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const isSignedIn = computed(() => userStore.getUserIsSignedIn)
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const shouldEmailNotifications = computed(() => userStore.shouldEmailNotifications)
const shouldEmailBulletin = computed(() => userStore.shouldEmailBulletin)
const shouldEmailWeeklyReview = computed(() => userStore.shouldEmailWeeklyReview)
const parentDialog = computed(() => 'notificationSettings')

const toggleShouldEmailNotifications = () => {
  const value = !shouldEmailNotifications.value
  userStore.updateUser({ shouldEmailNotifications: value })
}
const toggleShouldEmailBulletin = () => {
  const value = !shouldEmailBulletin.value
  userStore.updateUser({ shouldEmailBulletin: value })
}
const toggleShouldEmailWeeklyReview = () => {
  const value = !shouldEmailWeeklyReview.value
  userStore.updateUser({ shouldEmailWeeklyReview: value })
}
const triggerSignUpOrInIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSignUpOrInIsVisible()
}

// items

const updateUnsubscribed = async () => {
  try {
    state.isLoading = true
    state.unsubscribedSpaces = await apiStore.getSpacesNotificationUnsubscribed()
    state.unsubscribedGroups = await apiStore.getGroupsNotificationUnsubscribed()
    console.info(state.unsubscribedGroups)
  } catch (error) {
    console.error('🚒 updateUnsubscribed', error)
  }
  state.isLoading = false
}
const resubscribeToSpace = (space) => {
  state.unsubscribedSpaces = state.unsubscribedSpaces.filter(item => item.id !== space.id)
  apiStore.spaceNotificationResubscribe(space)
  globalStore.addNotification({ message: `Resubscribed to notifications from ${space.name}`, type: 'success' })
}
const resubscribeToGroup = (event, group) => {
  state.unsubscribedGroups = state.unsubscribedGroups.filter(item => item.id !== group.id)
  apiStore.groupNotificationResubscribe(group)
  globalStore.addNotification({ message: `Resubscribed to notifications from ${group.name}`, type: 'success' })
}
</script>

<template lang="pug">
dialog.narrow.notification-settings(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
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
