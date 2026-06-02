<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'

import utils from '@/utils.js'
import OfflineBadge from '@/components/OfflineBadge.vue'
import Loader from '@/components/Loader.vue'
import AppApiKeyListItem from '@/components/AppApiKeyListItem.vue'
import AddAppApiKey from '@/components/dialogs/AddAppApiKey.vue'

const globalStore = useGlobalStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const apiStore = useApiStore()

const dialogElement = ref(null)

onMounted(() => {
  window.addEventListener('resize', updateDialogHeight)
  getAppApiKeys()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateDialogHeight)
})

const props = defineProps({
  visible: Boolean
})
const state = reactive({
  dialogHeight: null,
  isLoading: false,
  isError: false,
  appApiKeys: [],
  addAppApiKeyIsVisible: false
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
const closeDialogs = () => {
  state.addAppApiKeyIsVisible = false
}

const toggleAddAppApiKeyIsVisible = () => {
  const value = !state.addAppApiKeyIsVisible
  closeDialogs()
  state.addAppApiKeyIsVisible = value
}
const childDialogIsVisible = computed(() => {
  return state.addAppApiKeyIsVisible
})

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
const truncatedApiKey = (string, size) => {
  size = size || 10
  return `${string.substring(0, size)}…${string.substring(string.length - size, string.length)}`
}

// app api keys

const getAppApiKeys = async () => {
  try {
    state.isLoading = true
    state.isError = false
    state.appApiKeys = await apiStore.getAppApiKeys()
  } catch (error) {
    console.error('🚒 getAppApiKeys', error)
    state.isError = true
  }
  state.isLoading = false
}
const createAppApiKey = async (body) => {
  closeDialogs()
  try {
    state.isLoading = true
    state.isError = false
    state.appApiKeys.push(body)
    await apiStore.createAppApiKey(body)
  } catch (error) {
    console.error('🚒 updateAppApiKey', error)
    state.isError = true
  }
  state.isLoading = false
}
const rotateAppApiKey = async (appApiKey) => {
  try {
    state.isLoading = true
    state.isError = false
    const apiKey = self.crypto.randomUUID()
    const update = {
      id: appApiKey.id,
      userId: userId.value,
      apiKey
    }
    state.appApiKeys = state.appApiKeys.map(appApiKey => {
      if (appApiKey.id === update.id) {
        const keys = Object.keys(update)
        keys.forEach(key => {
          appApiKey[key] = update[key]
        })
      }
      return appApiKey
    })
    await apiStore.rotateAppApiKey(update)
  } catch (error) {
    console.error('🚒 rotateAppApiKey', error)
    state.isError = true
  }
  state.isLoading = false
}
const deleteAppApiKey = async (update) => {
  try {
    state.isLoading = true
    state.isError = false
    state.appApiKeys = state.appApiKeys.filter(appApiKey => appApiKey.id !== update.id)
    await apiStore.deleteAppApiKey(update)
  } catch (error) {
    console.error('🚒 deleteAppApiKey', error)
    state.isError = true
  }
  state.isLoading = false
}
</script>

<template lang="pug">
dialog.user-api-info(
  v-if="props.visible"
  :open="props.visible"
  @click.left.stop="closeDialogs"
  ref="dialogElement"
  :style="{'max-height': state.dialogHeight + 'px'}"
  :class="{ overflow: !childDialogIsVisible }"
)
  section.title-section
    .row.title-row
      span API
      .button-wrap
        a(href="https://help.kinopio.club/api")
          button.small-button
            span API Docs{{' '}}
            img.icon.visit(src="@/assets/visit.svg")
      AddAppApiKey(:visible="state.addAppApiKeyIsVisible" @createAppApiKey="createAppApiKey")

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
        button.small-button(@click.stop="toggleAddAppApiKeyIsVisible" :class="{active: state.addAppApiKeyIsVisible}")
          img.icon.add-icon(src="@/assets/add.svg")
          span New
    OfflineBadge

  //- app api keys
  section.app-api-keys
    .row.badge.danger(v-if="state.isError")
      span (シ_ _)シ Something went wrong, Please try again or contact support
    template(v-for="appApiKey in state.appApiKeys" :key="appApiKey.apiKey")
      AppApiKeyListItem(:appApiKey="appApiKey" @deleteAppApiKey="deleteAppApiKey" @rotateAppApiKey="rotateAppApiKey")

    //- user api key
    details
      summary User API Key
      section.subsection
        .row
          img.icon.key(src="@/assets/key.svg")
          code.badge.secondary.api-key-string(:data-apikey="userApiKey") {{ truncatedApiKey(userApiKey, 9) }}
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
  &.overflow
    overflow auto
  .loader
    vertical-align -1px
    margin-right 5px
  .app-api-keys
    code
      margin-right 0
</style>
