<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useUserNotificationStore } from '@/stores/useUserNotificationStore'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const userNotificationStore = useUserNotificationStore()

const emit = defineEmits(['updateDialogHeight'])

const state = reactive({
  error: {
    userNeedsToSignUpOrIn: false
  },
  isAsked: false
})

const showInExplore = computed(() => userStore.showInExplore)
const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const isSpaceMember = computed(() => userStore.getUserIsSpaceMember)
const isVisible = computed(() => {
  return !isSpaceMember.value && !showInExplore.value
})

const askToAddToExplore = () => {
  if (state.isAsked) { return }
  if (!currentUserIsSignedIn.value) {
    state.error.userNeedsToSignUpOrIn = true
    return
  }
  userNotificationStore.addAskToAddToExplore()
  state.isAsked = true
  emit('updateDialogHeight')
}
const triggerSignUpOrInIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSignUpOrInIsVisible()
}
</script>

<template lang="pug">
.button-wrap.ask-to-add-to-explore(v-if="isVisible")
  template(v-if="!state.isAsked")
    button(@click.left.prevent="askToAddToExplore" @keydown.stop.enter="askToAddToExplore")
      img.icon.sunglasses(src="@/assets/sunglasses.svg")
      span Ask to Add to Explore
    template(v-if="state.error.userNeedsToSignUpOrIn")
      p
        span.badge.info Sign Up or In
        span to propose spaces to be added to explore
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

  template(v-else)
    .badge.success Space Creator Notified – Thank you for sharing the love
</template>

<style lang="stylus">
.ask-to-add-to-explore
  .icon.add
    margin-right 4px
  .badge
    display inline-block !important
</style>
