<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

import { nanoid } from 'nanoid'
const store = useStore()

let prevType

onMounted(() => {
  store.subscribe((mutation, state) => {
    if (mutation.type === 'triggerDrawConnectionFrame') {
      const event = mutation.payload
      drawCurrentConnection(event)
    } else if (mutation.type === 'closeAllDialogs') {
      if (isDrawingConnection.value) {
        store.commit('currentUserIsDrawingConnection', false)
        store.dispatch('currentConnections/removeUnusedTypes')
      }
    }
  })
  window.addEventListener('mousemove', interact)
  window.addEventListener('touchmove', interact)
  window.addEventListener('mouseup', stopInteractions)
  window.addEventListener('touchend', stopInteractions)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', interact)
  window.removeEventListener('touchmove', interact)
  window.removeEventListener('mouseup', stopInteractions)
  window.removeEventListener('touchend', stopInteractions)
})

const props = defineProps({
  startCardId: String
})
const state = reactive({
  currentConnectionPath: undefined,
  currentConnectionColor: undefined
})

// drawing

const interact = (event) => {
  if (isDrawingConnection.value) {
    drawCurrentConnection(event)
  }
}
const isDrawingConnection = computed(() => store.state.currentUserIsDrawingConnection)
const drawCurrentConnection = (event) => {
  let end = utils.cursorPositionInSpace(event)
  let start = utils.connectorCoords(props.startCardId) // TODO get real pos
  start = utils.cursorPositionInSpace(null, start)
  const controlPoint = store.state.currentUser.defaultConnectionControlPoint
  const path = store.getters['currentConnections/connectionPathBetweenCoords'](start, end, controlPoint)
  checkCurrentConnectionSuccess(event)
  state.currentConnectionPath = path
  const connectionType = store.getters['currentConnections/typeForNewConnections']
  prevType = connectionType
  state.currentConnectionColor = connectionType.color
  store.commit('currentConnectionColor', connectionType.color)
  const updates = {
    userId: store.state.currentUser.id,
    connectionTypeId: connectionType.id,
    color: connectionType.color,
    startCardId: props.startCardId,
    path
  }
  store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCurrentConnection' })
}

// connect to card

const checkCurrentConnectionSuccess = (event) => {
  if (!event) { return }
  const position = utils.cursorPositionInViewport(event)
  const cardElement = utils.cardElementFromPosition(position.x, position.y)
  let updates = { userId: store.state.currentUser.id }
  let isCurrentConnectionConnected
  if (cardElement) {
    isCurrentConnectionConnected = props.startCardId !== cardElement.dataset.cardId
  }
  if (!cardElement) {
    store.commit('currentConnectionSuccess', {})
    updates.endCardId = null
    store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCurrentConnection' })
  } else if (isCurrentConnectionConnected) {
    const card = store.getters['currentCards/byId'](cardElement.dataset.cardId)
    if (card.isLocked) {
      store.commit('currentConnectionSuccess', {})
      return
    }
    store.commit('currentConnectionSuccess', card)
    updates.endCardId = card.id
    store.commit('broadcast/updateStore', { updates, type: 'updateRemoteCurrentConnection' })
  } else {
    store.commit('currentConnectionSuccess', {})
  }
}
const addConnections = async (event) => {
  const currentConnectionSuccess = store.state.currentConnectionSuccess
  const startCardIds = store.state.currentConnectionStartCardIds
  let endCardId, estimatedEndCardConnectorPosition
  let position = utils.cursorPositionInSpace(event)
  const shouldPreventCreate = utils.isPositionOutsideOfSpace(position)
  if (shouldPreventCreate) {
    position = utils.cursorPositionInPage(event)
    store.commit('addNotificationWithPosition', { message: 'Outside Space', position, type: 'info', icon: 'cancel', layer: 'app' })
    return
  }
  if (currentConnectionSuccess.id) {
    endCardId = currentConnectionSuccess.id
  } else {
    // create new card
    const startCard = store.getters['currentCards/byId'](startCardIds[0])
    endCardId = nanoid()
    store.dispatch('currentCards/add', { position, id: endCardId, isParentCard: true, backgroundColor: startCard.backgroundColor })
    store.commit('childCardId', '')
    estimatedEndCardConnectorPosition = utils.estimatedNewCardConnectorPosition(position)
  }
  // create connections to endCardId
  await nextTick()
  startCardIds.forEach(startCardId => {
    const controlPoint = store.state.currentUser.defaultConnectionControlPoint
    const path = store.getters['currentConnections/connectionPathBetweenCards'](startCardId, endCardId, controlPoint, estimatedEndCardConnectorPosition)
    const connection = { startCardId, endCardId, path, controlPoint }
    store.dispatch('currentConnections/add', { connection, type: prevType })
  })
}

// stop drawing

const stopInteractions = (event) => {
  if (isDrawingConnection.value) {
    store.dispatch('clearMultipleSelected')
    addConnections(event)
  }
  store.commit('currentConnectionSuccess', {})
  const isCurrentConnection = store.state.currentConnectionStartCardIds.length
  if (isCurrentConnection) {
    store.commit('currentConnectionStartCardIds', [])
    const updates = { userId: store.state.currentUser.id }
    store.commit('broadcast/updateStore', { updates, type: 'removeRemoteCurrentConnection' })
  }
  store.commit('currentUserIsDrawingConnection', false)
  state.currentConnectionPath = undefined
}

</script>

<template lang="pug">
path.current-connection(
  v-if="isDrawingConnection"
  fill="none"
  stroke-width="5"
  :stroke="state.currentConnectionColor"
  :d="state.currentConnectionPath"
)
</template>

<style lang="stylus">
.current-connection
  pointer-events none
</style>
