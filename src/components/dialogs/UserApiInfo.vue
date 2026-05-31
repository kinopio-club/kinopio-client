<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import apiKeyScopes from '@/data/apiKeyScopes.js'
import OfflineBadge from '@/components/OfflineBadge.vue'
import Loader from '@/components/Loader.vue'

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
  dialogHeight: null,
  isLoading: false,
  isError: false,
  appApiKeys: []
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
  position.x += -40
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

const updateAppApiKeys = async () => {
  if (!globalStore.isOnline) { return }
  try {
    state.isLoading = true
    state.isError = false
    // TODO should load from api onmount, state.error

    // state.appApiKeys =
  } catch (error) {
    state.isError = true
  }
  state.isLoading = false
}

// STUB : replace w state.appApiKeys
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
const scope = (appApiKey) => {
  return apiKeyScopes.find(scope => scope.name === appApiKey.name)
}

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
        Loader(:visible="state.isLoading" :isSmall="true")
        span API Keys
      .button-wrap
        button.small-button
          img.icon.add-icon(src="@/assets/add.svg")
          span App API Key
        //- AddAppApiKey
          //- name scope-picker
    OfflineBadge

  //- app api keys
  section
    //- (v-if="!state.loading && state.appApiKeys.length")

    //- results list ???
    //- list app api keys
    //- name, scope
    //- key [copy]
      [rotate] [remove] in AppApiKeyDetails
      //- ^ confirm for both

    .badge.danger(v-if="state.error")
      span (シ_ _)シ Something went wrong, Please try again or contact support

    //- user api key
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
          .badge.danger
            p
              span Your user API key has full root permissions to your account, so keep it private.
</template>

<style lang="stylus">
dialog.user-api-info
  left -18px
  overflow auto
  .loader
    vertical-align -1px
    margin-right 5px
</style>
