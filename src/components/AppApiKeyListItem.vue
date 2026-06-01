<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import utils from '@/utils.js'
import apiKeyScopes from '@/data/apiKeyScopes.js'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

let unsubscribes

onMounted(() => {
  console.info('🐴 the component is now mounted.', spaceStore.getSpaceAllState)
  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'clearDraggingItems') {
        console.log('clearDraggingItems')
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  unsubscribes()
})

const emit = defineEmits(['rotateAppApiKey', 'removeAppApiKey'])

const props = defineProps({
  appApiKey: Object
})
const state = reactive({
  confirmRotateKeyIsVisible: false,
  confirmRemoveKeyIsVisible: false,
  isError: false,
  isLoading: false
})

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
const scope = (appApiKey) => {
  return apiKeyScopes.find(scope => scope.name === appApiKey.scope)
}
const scopeDescription = (appApiKey) => {
  const description = scope(appApiKey).description
  return `Scope: ${description}`
}
const truncate = (string) => {
  return utils.truncated(string, 18)
}

// confirmation

const clearConfirmations = () => {
  state.confirmRotateKeyIsVisible = false
  state.confirmRemoveKeyIsVisible = false
}
const toggleConfirmRotateKeyIsVisible = () => {
  const value = !state.confirmRotateKeyIsVisible
  clearConfirmations()
  state.confirmRotateKeyIsVisible = value
}
const toggleConfirmRemoveKeyIsVisible = () => {
  const value = !state.confirmRemoveKeyIsVisible
  clearConfirmations()
  state.confirmRemoveKeyIsVisible = value
}
</script>

<template lang="pug">
.app-api-key-list-item
  .row.title-row
    div
      .badge.circle-badge(:style="{ backgroundColor: appApiKey.color }")
      span(:title="appApiKey.name") {{ truncate(appApiKey.name) }}
      button.small-button.scope-button(:title="scopeDescription(appApiKey)")
        span {{ scope(appApiKey).friendlyName }}
  .row
    span.badge.secondary.api-key-string(:data-apikey="appApiKey.apiKey")
      img.icon.key(src="@/assets/key.svg")
      code {{ truncatedApiKey(appApiKey.apiKey, 6) }}
    .button-wrap
      button.small-button(@click.left="copy($event, appApiKey.apiKey)" title="Copy App API Key")
        img.icon.copy(src="@/assets/copy.svg")
      button.small-button.danger(title="Rotate Key" @click="toggleConfirmRotateKeyIsVisible")
        img.refresh.icon(src="@/assets/refresh.svg")
      button.small-button.danger(title="Remove Key" @click="toggleConfirmRemoveKeyIsVisible")
        img.icon.remove(src="@/assets/remove.svg")
</template>

<style lang="stylus">
.app-api-key-list-item
  padding-bottom 10px
  margin-bottom 10px
  border-bottom 1px solid var(--primary-border)
  .scope-button
    margin-left 5px
</style>
