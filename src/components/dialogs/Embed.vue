<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import Slider from '@/components/Slider.vue'
import utils from '@/utils.js'
import consts from '@/consts.js'
import privacy from '@/data/privacy.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

// let unsubscribes

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
//   unsubscribes()
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  iframeIsVisible: true,
  min: 40,
  max: 100,
  dialogHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  globalStore.clearNotificationsWithPosition()
  if (value) {
    toggleIframeIsVisible()
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const currentUserIsSignedIn = computed(() => userStore.getUserIsSignedIn)
const spacePrivacy = computed(() => spaceStore.privacy)
const spaceIsPublic = computed(() => {
  return spacePrivacy.value !== 'private'
})
const isEmbedable = computed(() => {
  return currentUserIsSignedIn.value && spaceIsPublic.value
})
const spaceZoomPercent = computed(() => globalStore.spaceZoomPercent)
const url = computed(() => {
  const spaceId = spaceStore.id
  const zoom = spaceZoomPercent.value
  return `${consts.kinopioDomain()}/embed/?spaceId=${spaceId}&zoom=${zoom}`
})
const iframe = computed(() => {
  return `<div class="kinopio-embed" style="height: 420px; width: 100%;">
  <iframe src="${url.value}" style="height: 100%; width: 100%; border: 0; border-radius: 6px;">
  </iframe>
</div>`
})

const updateZoom = (percent) => {
  percent = percent / 100
  percent = Math.round(state.min + (state.max - state.min) * percent)
  globalStore.spaceZoomPercent = percent
}
const toggleIframeIsVisible = (event) => {
  state.iframeIsVisible = true
  globalStore.clearNotificationsWithPosition()
}
const toggleUrlIsVisible = () => {
  state.iframeIsVisible = false
  globalStore.clearNotificationsWithPosition()
}
const copy = async (event) => {
  globalStore.clearNotificationsWithPosition()
  let value
  if (state.iframeIsVisible) {
    value = iframe.value
  } else {
    value = url.value
  }
  const position = utils.cursorPositionInPage(event)
  try {
    await navigator.clipboard.writeText(value)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copy', error)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
const triggerSignUpOrInIsVisible = () => {
  globalStore.closeAllDialogs()
  globalStore.triggerSignUpOrInIsVisible()
}
const privacyName = (number) => {
  const state = privacy.states()[number]
  const name = state.friendlyName || state.name
  return utils.capitalizeFirstLetter(name)
}
</script>

<template lang="pug">
dialog.narrow.embed(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': dialogHeight + 'px'}")
  section
    p Embed
  section

    template(v-if="!currentUserIsSignedIn")
      p
        span Sign Up or In to embed this space anywhere
      button(@click.left="triggerSignUpOrInIsVisible") Sign Up or In
    template(v-else-if="!spaceIsPublic")
      p To embed this space, set the privacy to
      p
        span.badge.info
          img.icon.closed(src="@/assets/unlock.svg")
          span {{privacyName(1)}}
        span or
        span.badge.success.last-child
          img.icon.open(src="@/assets/open.svg")
          span {{privacyName(0)}}

    // if not signed in

    // else if space is private

    template(v-if="isEmbedable")
      .row
        .segmented-buttons
          button(@click="toggleIframeIsVisible" :class="{ active: state.iframeIsVisible }")
            span iFrame
          button(@click="toggleUrlIsVisible" :class="{ active: !state.iframeIsVisible }")
            span URL

      //- iFrame
      template(v-if="state.iframeIsVisible")
        .row
          .url-textarea {{iframe}}
      //- Url
      template(v-if="!state.iframeIsVisible")
        .row
          .url-textarea {{url}}
      //- Zoom
      .row
        img.icon.icon-zoom(src="@/assets/search.svg")
        Slider(
          @updatePlayhead="updateZoom"
          :minValue="40"
          :value="spaceZoomPercent"
          :maxValue="100"
        )

      .row
        button(@click.left="copy")
          img.icon.copy(src="@/assets/copy.svg")
          span(v-if="state.iframeIsVisible") Copy Embed Code
          span(v-else) Copy Embed URL

</template>

<style lang="stylus">
.embed
  left initial
  right -8px
  overflow scroll
  @media(max-width 350px)
    right -50px
  .success-message
    margin-top 10px
  .slider
    margin-top -10px
  .icon-zoom
    margin-right 4px
    margin-top -4px
  .url-textarea
    max-height 80px
</style>
