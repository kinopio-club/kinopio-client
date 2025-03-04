<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
import GroupLabel from '@/components/GroupLabel.vue'

const store = useStore()

const emit = defineEmits(['closeDialogs'])

const props = defineProps({
  visible: Boolean,
  group: Object
})

const closeDialogs = () => {
  emit('closeDialogs')
}

// invite

const inviteUrl = computed(() => {
  if (!props.group.collaboratorKey) { return }
  const url = utils.groupInviteUrl({
    groupId: props.group.id,
    groupName: props.group.name,
    collaboratorKey: props.group.collaboratorKey
  })
  return url
})
const copyInviteUrl = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  console.info('🍇 group invite url', inviteUrl.value)
  try {
    await navigator.clipboard.writeText(inviteUrl.value)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyInviteUrl', error, inviteUrl.value)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
</script>

<template lang="pug">
section.invite-to-group(v-if="props.visible" @click.stop="closeDialogs" :data-group-collaboratorKey="props.group.collaboratorKey")
  .row
    GroupLabel(:group="props.group")
    span Invite to Group
  section.subsection
    button(@click.left="copyInviteUrl")
      img.icon.copy(src="@/assets/copy.svg")
      span Copy Group Invite URL
</template>

<style lang="stylus">
// section.invite-to-group
</style>
