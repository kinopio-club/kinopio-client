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

const emit = defineEmits(['rotateAppApiKey', 'deleteAppApiKey'])

const props = defineProps({
  appApiKey: Object
})
const state = reactive({
  confirmRotateKeyIsVisible: false,
  confirmDeleteKeyIsVisible: false,
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
  if (!string) { return }
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
  state.confirmDeleteKeyIsVisible = false
}
const toggleConfirmRotateKeyIsVisible = () => {
  const value = !state.confirmRotateKeyIsVisible
  clearConfirmations()
  state.confirmRotateKeyIsVisible = value
}
const toggleConfirmDeleteKeyIsVisible = () => {
  const value = !state.confirmDeleteKeyIsVisible
  clearConfirmations()
  state.confirmDeleteKeyIsVisible = value
}
const rotateApiKey = () => {
  emit('rotateAppApiKey', props.appApiKey)
}
const deleteApiKey = () => {
  emit('deleteAppApiKey', props.appApiKey)
}
</script>

<template lang="pug">
.app-api-key-list-item(@click="clearConfirmations")
  .row.title-row
    div
      .badge.circle-badge(:style="{ backgroundColor: appApiKey.color }")
      span(:title="appApiKey.name") {{ truncate(appApiKey.name) }}
    div
      span.badge.secondary.scope-badge(:title="scopeDescription(appApiKey)")
        span {{ scope(appApiKey).friendlyName }}
  .row
    span.badge.secondary.api-key-string(:data-apikey="appApiKey.apiKey")
      img.icon.key(src="@/assets/key.svg")
      code {{ truncatedApiKey(appApiKey.apiKey, 6) }}
    .button-wrap
      button.small-button(@click.left="copy($event, appApiKey.apiKey)" title="Copy App API Key")
        img.icon.copy(src="@/assets/copy.svg")
      button.small-button.danger(title="Rotate Key" @click.stop="toggleConfirmRotateKeyIsVisible" :class="{ active: state.confirmRotateKeyIsVisible }")
        img.refresh.icon(src="@/assets/refresh.svg")
      button.small-button.danger(title="Delete Key" @click.stop="toggleConfirmDeleteKeyIsVisible" :class="{ active: state.confirmDeleteKeyIsVisible }")
        img.icon.remove(src="@/assets/remove.svg")
  //- rotate
  section.subsection(v-if="state.confirmRotateKeyIsVisible" @click.stop)
    .row
      button.small-button(@click="clearConfirmations")
        img.icon.cancel(src="@/assets/add.svg")
      button.small-button.danger(@click="rotateApiKey")
        img.refresh.icon(src="@/assets/refresh.svg")
        span Rotate API Key
  //- delete
  section.subsection(v-if="state.confirmDeleteKeyIsVisible" @click.stop)
    .row
      button.small-button(@click="clearConfirmations")
        img.icon.cancel(src="@/assets/add.svg")
      button.small-button.danger(@click="deleteApiKey" )
        img.icon.remove(src="@/assets/remove.svg")
        span Delete API Key
</template>

<style lang="stylus">
.app-api-key-list-item
  padding-bottom 10px
  margin-bottom 10px
  border-bottom 1px solid var(--primary-border)
  .scope-badge
    margin-left 5px
  .circle-badge
    border-radius 100px
    min-width initial
    min-height initial
    display inline-block
    width 12px
    height 12px
  section.subsection
    .row
      justify-content flex-end
</style>
