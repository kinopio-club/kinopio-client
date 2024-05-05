<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const emit = defineEmits(['updateDialogHeight'])

const state = reactive({
  error: {
    userNeedsToSignUpOrIn: false
  },
  isAsked: false
})

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const isVisible = computed(() => {
  return !isSpaceMember.value && !showInExplore.value
})

// sign up

const isSpaceMember = computed(() => store.getters['currentUser/isSpaceMember']())
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}

// button

const showInExplore = computed(() => store.state.currentSpace.showInExplore)
const askToAddToExplore = () => {
  if (state.isAsked) { return }
  if (!currentUserIsSignedIn.value) {
    state.error.userNeedsToSignUpOrIn = true
    return
  }
  store.dispatch('userNotifications/addAskToAddToExplore')
  state.isAsked = true
  emit('updateDialogHeight')
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
