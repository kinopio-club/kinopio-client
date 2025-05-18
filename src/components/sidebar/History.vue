<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useUserStore } from '@/stores/useUserStore'

import Loader from '@/components/Loader.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'
import User from '@/components/User.vue'
import utils from '@/utils.js'

const store = useStore()
const userStore = useUserStore()

let prevPosition

let unsubscribe

onMounted(() => {
  updateOperations()
  window.addEventListener('pointerdown', updatePrevPosition)
  unsubscribe = store.subscribe(mutation => {
    if (mutation.type === 'currentSpace/changeSpace') {
      clearOperations()
    }
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', updatePrevPosition)
  unsubscribe()
})

const props = defineProps({
  visible: Boolean
})
watch(() => props.visible, (value, prevValue) => {
  if (value) {
    updateOperations()
  }
})

const state = reactive({
  operations: [],
  selectedOperationIds: {},
  isLoading: false,
  unknownServerError: false
})

const isOnline = computed(() => store.state.isOnline)
const canEditSpace = computed(() => userStore.getUserCanEditSpace())
const updatePrevPosition = (event) => {
  if (!props.visible) { return }
  prevPosition = utils.cursorPositionInPage(event)
}

// operations

const clearOperations = () => {
  state.operations = []
}
const updateOperations = async () => {
  state.unknownServerError = false
  if (state.isLoading) { return }
  try {
    state.isLoading = true
    state.operations = await store.dispatch('api/getSpaceHistory')
    // api/
  } catch (error) {
    console.error('🚒 updateOperations', error)
    state.unknownServerError = true
  }
  state.isLoading = false
}
const refreshOperations = async () => {
  clearOperations()
  await updateOperations()
}
const select = (operation) => {
  console.info(operation)
  if (isSelected(operation)) {
    state.selectedOperationIds[operation.id] = false
  } else {
    state.selectedOperationIds[operation.id] = true
  }
}
const isSelected = (operation) => {
  return Boolean(state.selectedOperationIds[operation.id])
}

// meta

const user = (operation) => {
  const user = store.getters['currentSpace/userById'](operation.userId)
  return user
}
const relativeDate = (operation) => {
  const date = operation.receivedAt
  return utils.shortRelativeTime(date)
}

// copy

const copyOperations = async (event) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  position.x = position.x - 60
  try {
    let text = utils.clone(state.operations)
    text = JSON.stringify(text)
    await navigator.clipboard.writeText(text)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}
const copyOperation = async (event, operation) => {
  store.commit('clearNotificationsWithPosition')
  const position = utils.cursorPositionInPage(event)
  position.x = position.x - 60
  try {
    operation = JSON.stringify(operation)
    await navigator.clipboard.writeText(operation)
    store.commit('addNotificationWithPosition', { message: 'Copied', position, type: 'success', layer: 'app', icon: 'checkmark' })
  } catch (error) {
    console.warn('🚑 copyText', error)
    store.commit('addNotificationWithPosition', { message: 'Copy Error', position, type: 'danger', layer: 'app', icon: 'cancel' })
  }
}

</script>

<template lang="pug">
template(v-if="props.visible")
  section.history
    .row.title-row
      div
        span Space History
        Loader(:visible="state.isLoading" :isSmall="true")
      div
        .button-wrap(v-if="!state.isLoading")
          button.small-button(@click="refreshOperations")
            img.icon(src="@/assets/refresh.svg")
        .button-wrap(v-if="!state.isLoading")
          button.small-button(@click="copyOperations")
            img.icon(src="@/assets/copy.svg")
    .row
      .badge.info While History is in Beta, it is mainly for debugging sync issues
    OfflineBadge

  section.results-section.history
    ul.results-list
      template(v-for="operation in state.operations" :key="operation.id")
        li(@click="select(operation)" :class="{active: isSelected(operation)}")
          //- time
          template(v-if="relativeDate(operation)")
            span.badge.status.inline-badge
              img.icon.time(src="@/assets/time.svg")
              span {{ relativeDate(operation) }}
          //- user
          template(v-if="user(operation)")
            User(:user="user(operation)" :isClickable="false" :isSmall="true" :hideYouLabel="true")
          //- operation
          span {{operation.name}}
          template(v-if="isSelected(operation)")
            p(@click.stop) {{operation}}
            .button-wrap.copy-button
              button.small-button(@click.stop="copyOperation($event, operation)")
                img.icon(src="@/assets/copy.svg")
</template>

<style lang="stylus">
section.history
  .loader
    margin-left 6px
    vertical-align -2px
  li
    display block
    .copy-button
      position absolute
      top 0
      left initial
      right 4px
    .user
      vertical-align -4px
      margin-right 5px
</style>
