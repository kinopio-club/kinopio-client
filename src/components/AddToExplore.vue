<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'
const store = useStore()

let unsubscribe

let prevPrivacy = ''

onMounted(() => {
  unsubscribe = store.subscribe((mutation, state) => {
    if (mutation.type === 'currentSpace/restoreSpace') {
      clearErrors()
    }
  })
})
onBeforeUnmount(() => {
  unsubscribe()
})

const emit = defineEmits(['updateLocalSpaces', 'updateAddToExplore'])

const props = defineProps({
  space: Object,
  visible: Boolean
})
const state = reactive({
  error: {
    userNeedsToSignUpOrIn: false,
    spaceMustBeEdited: false,
    spaceCardsMinimum: false
  }
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    clearErrors()
  }
})

const isVisible = computed(() => props.visible || store.getters['currentUser/isSpaceMember']())
const showInExplore = computed(() => {
  const space = props.space || store.state.currentSpace
  const showInExplore = space.showInExplore
  const isNotPrivate = space.privacy !== 'private'
  return showInExplore && isNotPrivate
})
const currentUserIsSignedIn = computed(() => store.getters['currentUser/isSignedIn'])
const spaceIsHelloKinopio = computed(() => store.getters['currentSpace/isHelloKinopio'])
const spaceCardsCount = computed(() => store.getters['currentCards/all'].length)

const checkIfShouldPrevent = (event) => {
  if (props.space) { return }
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
  // if (shouldPrevent) {
  //   const position = utils.cursorPositionInPage(event)
  //   store.commit('addNotificationWithPosition', { message: 'Could Not Add', position, type: 'danger', layer: 'app', icon: 'cancel' })
  // }
  return shouldPrevent
}
const toggleShowInExplore = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const shouldPrevent = checkIfShouldPrevent(event)
  if (shouldPrevent) { return }
  if (props.space) {
    emitUpdateShowInExplore()
  } else {
    await updateShowInExplore()
  }
  notifyShowInExplore(event)
  store.dispatch('currentSpace/createSpacePreviewImage')
}
const notifyShowInExplore = (event) => {
  const shouldShow = showInExplore.value
  const position = utils.cursorPositionInPage(event)
  if (shouldShow) {
    store.commit('addNotificationWithPosition', { message: 'Added to Explore', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } else {
    store.commit('addNotificationWithPosition', { message: 'Removed from Explore', position, type: 'success', layer: 'app', icon: 'checkmark' })
  }
}
const emitUpdateShowInExplore = () => {
  let space = props.space
  space.showInExplore = !space.showInExplore
  emit('updateAddToExplore', space)
}
const updateShowInExplore = async () => {
  await updateSpacePrivacy()
  const shouldShow = !showInExplore.value
  await store.dispatch('currentSpace/updateSpace', { showInExplore: shouldShow })
  emit('updateLocalSpaces')
}
const updateSpacePrivacy = async () => {
  const shouldShow = !showInExplore.value
  const currentPrivacy = store.state.currentSpace.privacy
  if (shouldShow) {
    prevPrivacy = currentPrivacy
    if (currentPrivacy === 'private') {
      await store.dispatch('currentSpace/updateSpace', { privacy: 'closed' })
    }
  } else {
    prevPrivacy = prevPrivacy || 'closed'
    await store.dispatch('currentSpace/updateSpace', { privacy: prevPrivacy })
  }
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
</script>

<template lang="pug">
.button-wrap.add-to-explore(@click.stop v-if="isVisible")
  button(:class="{active: showInExplore}" @click.left.prevent="toggleShowInExplore" @keydown.stop.enter="toggleShowInExplore")
    span(v-if="!showInExplore")
    img.icon.sunglasses(src="@/assets/sunglasses.svg")
    span(v-if="!showInExplore") Add to Explore
    span(v-if="showInExplore") In Explore

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
</style>
