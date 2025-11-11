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
  item: Object,
  isReadOnly: Boolean,
  isCard: Boolean
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

const itemUrl = () => {
  const domain = consts.kinopioDomain()
  const url = `${domain}/${props.item.spaceId}/${props.item.id}`
  console.info('🍇 item url', url)
  return url
}
const copyUrl = async (event) => {
  globalStore.clearNotificationsWithPosition()
  const position = utils.cursorPositionInPage(event)
  const url = itemUrl()
  try {
    await navigator.clipboard.writeText(url)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
</script>

<template lang="pug">
dialog.narrow.share-item(v-if="visible" :open="visible" @click.left.stop ref="dialog" :class="{ 'read-only': props.isReadOnly }")
  template(v-if="canShare")
    section.title-section
      p Share Item
    section
      .row
        .segmented-buttons
          button(@click.left="copyUrl")
            img.icon.copy(src="@/assets/copy.svg")
            span Copy item Link
      p(v-if="props.isCard")
        span Share this card publically, or paste in another space
      p(v-else)
        span Share this item publically
      .row(v-if="spaceIsPrivate")
        .badge.danger
          img.icon.lock-icon(src="@/assets/lock.svg")
          span Private space item links can only be viewed by space members

  template(v-if="!canShare")
    section
      p For your items and spaces to have URLs, you'll need to sign up or in
      .button-wrap
        button(@click.left="triggerSignUpOrInIsVisible")
          span Sign Up or In

</template>

<style lang="stylus">
.share-item
  left -100px
  &.read-only
    left 8px
</style>
