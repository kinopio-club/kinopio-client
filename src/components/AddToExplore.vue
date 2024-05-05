<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'currentSpace/restoreSpace') {
      clearErrors()
    }
  })
})

const emit = defineEmits(['updateLocalSpaces', 'updateAddToExplore'])

const props = defineProps({
  visible: Boolean,
  disabled: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    clearErrors()
  }
})

const state = reactive({
  error: {
    userNeedsToSignUpOrIn: false,
    spaceMustBeEdited: false,
    spaceCardsMinimum: false
  }
})

const spaceName = computed(() => store.state.currentSpace.name)
const currentSpace = computed(() => {
  const space = store.state.currentSpace
  return utils.clone(space)
})
const currentSpaceIsPrivate = computed(() => currentSpace.value.privacy === 'private')
const showInExplore = computed(() => currentSpace.value.showInExplore)
const isVisible = computed(() => {
  return props.visible || store.getters['currentUser/isSpaceMember']()
})

// errors

const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const spaceIsHelloKinopio = computed(() => store.getters['currentSpace/isHelloKinopio'])
const spaceCardsCount = computed(() => store.getters['currentCards/all'].length)

const checkIfShouldPrevent = (event) => {
  let shouldPrevent
  if (showInExplore.value) { return }
  if (!currentUserIsSignedIn.value) {
    state.error.userNeedsToSignUpOrIn = true
    shouldPrevent = true
  }
  if (spaceIsHelloKinopio.value) {
    state.error.spaceMustBeEdited = true
    shouldPrevent = true
  }
  if (spaceCardsCount.value < 10) {
    state.error.spaceCardsMinimum = true
    shouldPrevent = true
  }
  return shouldPrevent
}
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}
const clearErrors = () => {
  state.error.userNeedsToSignUpOrIn = false
  state.error.spaceMustBeEdited = false
  state.error.spaceCardsMinimum = false
}

// toggle show in explore

const toggleShowInExplore = (event) => {
  store.commit('clearNotificationsWithPosition')
  const shouldPrevent = checkIfShouldPrevent(event)
  if (shouldPrevent) { return }
  updateShowInExplore()
  store.dispatch('currentSpace/createSpacePreviewImage')
}
const updateShowInExplore = () => {
  updateSpacePrivacy()
  let space = currentSpace.value
  space.showInExplore = !space.showInExplore
  store.dispatch('currentSpace/updateSpace', { showInExplore: space.showInExplore })
  emit('updateAddToExplore', space)
}
const updateSpacePrivacy = () => {
  if (!showInExplore.value) { return }
  if (currentSpaceIsPrivate.value) {
    store.dispatch('currentSpace/updateSpace', { privacy: 'closed' })
  }
}

</script>

<template lang="pug">
.button-wrap.add-to-explore(@click.stop v-if="isVisible")
  button.small-button(:class="{active: showInExplore}" @click.left.prevent="toggleShowInExplore" @keydown.stop.enter="toggleShowInExplore" :disabled="disabled")
    img.icon.sunglasses(src="@/assets/sunglasses.svg")
    span(v-if="!showInExplore")
      span Add to Explore
    template(v-if="showInExplore")
      span In Explore
    //- privacy warning
    template(v-if="!showInExplore && currentSpaceIsPrivate")
      .label-badge.space-name-badge-wrap.public-space-warning-badge
        img.icon.lock-icon(src="@/assets/unlock.svg")
        span Will Make Public

  template(v-if="state.error.userNeedsToSignUpOrIn")
    .badge.info
      span Sign Up or In for your spaces to be accessible to others
    button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In

  template(v-else-if="state.error.spaceMustBeEdited")
    .badge.info
      span Edit and rename this space to add to Explore

  template(v-else-if="state.error.spaceCardsMinimum")
    .badge.info
      span Space needs more than 10 cards to add to Explore

</template>

<style lang="stylus">
.add-to-explore
  input
    vertical-align -1px !important
  .icon.add
    margin-right 4px
  .badge
    margin-top 10px
  button
    white-space initial !important
  .public-space-warning-badge
    min-width 100px
    background-color var(--danger-background)
    bottom -12px
    .lock-icon
      width 6px
      margin-left 2px
</style>
