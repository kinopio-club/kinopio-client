<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
//   unsubscribe()
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null
})

watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateDialogHeight()
  }
})

const updateDialogHeight = async () => {
  if (!props.visible) { return }
  await nextTick()
  const element = dialogElement.value
  state.dialogHeight = utils.elementHeight(element)
}

const userId = computed(() => userStore.id)
const copy = async (event, text) => {
  globalStore.clearNotificationsWithPosition()
  const position = utils.cursorPositionInPage(event)
  position.x += -60
  try {
    await navigator.clipboard.writeText(text)
    globalStore.addNotificationWithPosition({ message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
    console.info('🍇 copied', text)
  } catch (error) {
    console.warn('🚑 copyText', error)
    globalStore.addNotificationWithPosition({ message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

// delete = can edit and delete
// edit
// read
// user

// output keys

const censor = (value) => {
  const uncensoredCharacters = 5
  const uncensored = value.slice(-uncensoredCharacters)
  const toСensor = value.slice(0, -uncensoredCharacters)
  const censored = toСensor.replace(/[^-]/g, 'x') // replace every character that isn't `-`
  return censored + uncensored
}
const censoredApiKey = computed(() => censor(userStore.apiKey))
const apiKey = computed(() => userStore.apiKey)
const truncatedCensoredApiKey = computed(() => {
  const string = userStore.apiKey
  const censored = string.replace(/[^-]/g, 'x') // replace every character that isn't `-`
  return `${censored.substring(0, 10)}…${string.substring(string.length - 10, string.length)}`
})
</script>

<template lang="pug">
dialog.narrow.user-api-info(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
  section.title-section
    .row.title-row
      span API
      .button-wrap
        a(href="https://help.kinopio.club/api")
          button.small-button
            span API Docs{{' '}}
            img.icon.visit(src="@/assets/visit.svg")

  //- user id
  section
    p User Id
    .row
      code.badge.secondary {{ userId }}
      .button-wrap
        button.small-button(@click.left="copy($event, userId)" title="Copy UserId")
          img.icon.copy(src="@/assets/copy.svg")
  //- api key
  section.title-section
    p
      span API Keys

  section
    .row
      p
        span User API Key
    .row
      code.badge.secondary.api-key-string(:data-original="apiKey") {{ truncatedCensoredApiKey }}
      .button-wrap
        button.small-button(@click.left="copy($event, apiKey)" title="Copy User API Key")
          img.icon.copy(src="@/assets/copy.svg")

    .row
      .badge.danger.copy-api-keys
        p
          img.icon.key(src="@/assets/key.svg")
          span Your user API key has root permissions to your account, so keep it private.
</template>

<style lang="stylus">
dialog.user-api-info
  overflow auto
  .copy-api-keys
    padding-top 4px
    padding-bottom 4px
</style>
