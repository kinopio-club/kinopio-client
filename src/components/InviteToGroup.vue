<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUserStore } from '@/stores/useUserStore'

import utils from '@/utils.js'
import User from '@/components/User.vue'

import randomColor from 'randomcolor'

const globalStore = useGlobalStore()
const groupStore = useGroupStore()
const userStore = useUserStore()

const emit = defineEmits(['closeDialogs'])

const props = defineProps({
  visible: Boolean,
  group: Object
})

const closeDialogs = () => {
  emit('closeDialogs')
}

const currentUser = computed(() => userStore.getUserAllState)
const randomUser = computed(() => {
  const luminosity = userStore.theme
  const color = randomColor({ luminosity })
  return { color }
})

// invite

const inviteUrl = computed(() => groupStore.getGroupInviteUrl(props.group))
const copyInviteUrl = async (event) => {
  globalStore.clearNotificationsWithPosition()
  const position = utils.cursorPositionInPage(event)
  console.info('🍇 group invite url', inviteUrl.value)
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyInviteUrl', error, inviteUrl.value)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
</script>

<template lang="pug">
section.invite-to-group(v-if="props.visible" @click.stop="closeDialogs" :data-group-collaboratorKey="props.group.collaboratorKey")
  .row
    span
      .users
        User(:user="currentUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")
        User(:user="randomUser" :isClickable="false" :key="currentUser.id" :isMedium="true" :hideYouLabel="true")
    span Invite to Group
  section.subsection
    button(@click.left="copyInviteUrl")
      img.icon.copy(src="@/assets/copy.svg")
      span Copy Group Invite URL
</template>

<style lang="stylus">
section.invite-to-group
  // same as InviteToSpace
  .users
    margin-right 5px
    .user
      vertical-align -3px
      &:first-child
        .user-avatar
          border-top-right-radius 0
          border-bottom-right-radius 0
      &:last-child
        .user-avatar
          border-top-left-radius 0
          border-bottom-left-radius 0

</style>
