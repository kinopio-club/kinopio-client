<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import Loader from '@/components/Loader.vue'
import OfflineBadge from '@/components/OfflineBadge.vue'
import utils from '@/utils.js'

import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
const store = useStore()

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
const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const updatePrevPosition = (event) => {
  if (!props.visible) { return }
  prevPosition = utils.cursorPositionInPage(event)
}
const clearOperations = () => {
  state.operations = []
}

// operations

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
const select = (operation) => {
  console.log(operation)
  if (isSelected(operation)) {
    state.selectedOperationIds[operation.id] = false
  } else {
    state.selectedOperationIds[operation.id] = true
  }
}
const isSelected = (operation) => {
  return Boolean(state.selectedOperationIds[operation.id])
}

// copy

const copyOperations = async (event) => {
  store.commit('clearNotificationsWithPosition')
  let position = utils.cursorPositionInPage(event)
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
  let position = utils.cursorPositionInPage(event)
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
section.debug(v-if="visible")
  .row.title-row
    div
      span.badge.info Beta
      span Space History Log
      Loader(:visible="state.isLoading" :isSmall="true")
    .button-wrap(v-if="!state.isLoading")
      button.small-button(@click="copyOperations")
        img.icon(src="@/assets/copy.svg")
    //-     span Inbox
  OfflineBadge

section.results-section.debug
  ul.results-list
    template(v-for="operation in state.operations" :key="operation.id")
      li(@click="select(operation)" :class="{active: isSelected(operation)}") {{operation.name}}
        template(v-if="isSelected(operation)")
          p(@click.stop) {{operation}}
          .button-wrap.copy-button
            button.small-button(@click.stop="copyOperation($event, operation)")
              img.icon(src="@/assets/copy.svg")

</template>

<style lang="stylus">
section.debug
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
</style>
