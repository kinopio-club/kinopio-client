<script setup>
import utils from '@/utils.js'

import { reactive, computed, onMounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
const store = useStore()

const dialog = ref(null)

const props = defineProps({
  visible: Boolean,
  card: Object
})

// anon user

const canShare = computed(() => {
  const currentSpaceUserId = store.state.currentSpace.users[0].id
  const currentUserId = store.state.currentUser.id
  if (currentSpaceUserId !== currentUserId) {
    return true
  } else if (store.getters['currentUser/isSignedIn']) {
    return true
  } else {
    return false
  }
})
const triggerSignUpOrInIsVisible = () => {
  store.dispatch('closeAllDialogs')
  store.commit('triggerSignUpOrInIsVisible')
}

// scroll into view

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    scrollIntoView()
  }
})
const scrollIntoView = async () => {
  await nextTick()
  utils.scrollIntoView(dialog.value)
}

// copy url

const cardUrl = () => {
  const domain = utils.kinopioDomain()
  const url = `${domain}/${props.card.spaceId}/${props.card.id}`
  console.log('🍇 card url', url)
  return url
}
const copyUrl = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  const url = cardUrl()
  try {
    await navigator.clipboard.writeText(url)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

// web share

const webShareIsSupported = computed(() => navigator.share)
const webShare = () => {
  const data = {
    title: props.card.name,
    text: store.state.currentSpace.name,
    url: cardUrl()
  }
  navigator.share(data)
}
</script>

<template lang="pug">
dialog.narrow.share-card(v-if="visible" :open="visible" @click.left.stop ref="dialog")
  section(v-if="canShare")
    section.subsection
      .row
        p Share With the World, or Paste in Another Space
      .row
        .segmented-buttons
          button(@click.left="copyUrl")
            img.icon.copy(src="@/assets/copy.svg")
            span Copy Card URL
          button(v-if="webShareIsSupported" @click="webShare")
            img.icon.share(src="@/assets/share.svg")
  section(v-if="!canShare")
    p For your cards and spaces to have URLs, you'll need to sign up or in
    .button-wrap
      button(@click.left="triggerSignUpOrInIsVisible")
        span Sign Up or In

</template>

<style lang="stylus">
.share-card
  left -100px
</style>
