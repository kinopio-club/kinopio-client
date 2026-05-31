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

// data

const userId = computed(() => userStore.id)
const userApiKey = computed(() => userStore.apiKey)

// output keys

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
const truncatedCensoredApiKey = (string, size) => {
  size = size || 10
  // const string = userStore.apiKey
  const censored = string.replace(/[^-]/g, 'x') // replace every character that isn't `-`
  return `${censored.substring(0, size)}…${string.substring(string.length - size, string.length)}`
}

// app api keys

const appApiKeys = computed(() => {
  return [
    {
      name: 'cool app',
      scope: 'read',
      apiKey: '1209-3102938asl-dkfjlsa-kdjf'
    },
    {
      name: 'whoa test',
      scope: 'edit',
      apiKey: 'ab2C-alsdkjfa23-dkfjlsa-123z'
    }
  ]
})

// delete = can edit and delete
// edit
// read
// user

</script>

<template lang="pug">
dialog.user-api-info(v-if="props.visible" :open="props.visible" @click.left.stop ref="dialogElement" :style="{'max-height': state.dialogHeight + 'px'}")
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

  //- api keys
  section.title-section
    .row.title-row
      span
        span API Keys
      .button-wrap
        button.small-button
          img.icon.add-icon(src="@/assets/add.svg")
          span App Key
        //- AddAppApiKey
          //- name scope-picker

  //- results list ???
  //- list app api keys
  //- name, scope
  //- key [copy]
    [rotate] [remove] in AppApiKeyDetails
    //- ^ confirm for both

  //- show user api key
  section
    details
      summary User API Key
      section.subsection
        .row
          img.icon.key(src="@/assets/key.svg")
          code.badge.secondary.api-key-string(:data-apikey="userApiKey") {{ truncatedCensoredApiKey(userApiKey, 9) }}
          .button-wrap
            button.small-button(@click.left="copy($event, userApiKey)" title="Copy User API Key")
              img.icon.copy(src="@/assets/copy.svg")
        .row
          .badge.danger.copy-api-keys
            p
              span Your user API key has full root permissions to your account, so keep it private.
</template>

<style lang="stylus">
dialog.user-api-info
  left -18px
  overflow auto
  .copy-api-keys
    padding-top 4px
    padding-bottom 4px
</style>
