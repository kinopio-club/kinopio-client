<script setup>
import { reactive, computed, onMounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import consts from '@/consts.js'

const globalStore = useGlobalStore()
const spaceStore = useSpaceStore()

const dialog = ref(null)

const props = defineProps({
  visible: Boolean,
  card: Object,
  isReadOnly: Boolean
})

const spaceIsPrivate = computed(() => spaceStore.privacy === 'private')

// anon user

const canShare = computed(() => spaceStore.getSpaceIsRemote)
const triggerSignUpOrInIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSignUpOrInIsVisible()
}

// scroll into view

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    scrollIntoView()
  }
})
const scrollIntoView = async () => {
  await nextTick()
  globalStore.scrollElementIntoView({ element: dialog.value })
}

// copy url

const cardUrl = () => {
  const domain = consts.kinopioDomain()
  const url = `${domain}/${props.card.spaceId}/${props.card.id}`
  console.info('🍇 card url', url)
  return url
}
const copyUrl = async (event) => {
  globalStore.clearNotificationsWithPosition()
  const position = utils.cursorPositionInPage(event)
  const url = cardUrl()
  try {
    await navigator.clipboard.writeText(url)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

// web share

const webShareIsSupported = computed(() => navigator.share)
const webShare = () => {
  const data = {
    title: props.card.name,
    text: spaceStore.name,
    url: cardUrl()
  }
  navigator.share(data)
}
</script>

<template lang="pug">
dialog.narrow.share-card(v-if="visible" :open="visible" @click.left.stop ref="dialog" :class="{ 'read-only': props.isReadOnly }")
  section(v-if="canShare")
    p Share this card publically, or paste it in another space
    .row
      .segmented-buttons
        button(@click.left="copyUrl")
          img.icon.copy(src="@/assets/copy.svg")
          span Copy Card Link
        //- button(v-if="webShareIsSupported" @click="webShare")
        //-   img.icon.share(src="@/assets/share.svg")
    .row(v-if="canShare && spaceIsPrivate")
      .badge.danger
        img.icon.lock-icon(src="@/assets/lock.svg")
        span Cards in private spaces can only be viewed by space members

  section(v-if="!canShare")
    p For your cards and spaces to have URLs, you'll need to sign up or in
    .button-wrap
      button(@click.left="triggerSignUpOrInIsVisible")
        span Sign Up or In

</template>

<style lang="stylus">
.share-card
  left -100px
  &.read-only
    left 8px
</style>
