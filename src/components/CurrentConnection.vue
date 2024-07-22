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
  let start = utils.connectorCoords(props.startCardId)
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
  const startCardIds = store.state.currentConnectionStartItemIds
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
    store.dispatch('currentCards/updateDimensions', { cards: [{ id: startCardId }] })
    const controlPoint = store.state.currentUser.defaultConnectionControlPoint
    const path = store.getters['currentConnections/connectionPathBetweenCards']({
      startCardId,
      endCardId,
      controlPoint,
      estimatedEndCardConnectorPosition
    })
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
  const isCurrentConnection = store.state.currentConnectionStartItemIds.length
  if (isCurrentConnection) {
    store.commit('currentConnectionStartItemIds', [])
    const updates = { userId: store.state.currentUser.id }
    store.commit('broadcast/updateStore', { updates, type: 'removeRemoteCurrentConnection' })
  }
  store.commit('currentUserIsDrawingConnection', false)
  state.currentConnectionPath = undefined
}

// styles and position

const normalizedConnectionPathRect = () => {
  const path = state.currentConnectionPath
  if (!path) { return }
  const rect = utils.rectFromConnectionPath(path)
  return rect
}
const connectionStyles = computed(() => {
  const rect = normalizedConnectionPathRect()
  if (!rect) { return }
  let styles = {
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px'
  }
  if (store.state.currentUserIsDraggingCard) {
    styles.pointerEvents = 'none'
  }
  return styles
})
const connectionPathStyles = computed(() => {
  const rect = normalizedConnectionPathRect()
  if (!rect) { return }
  const styles = {
    transform: `translate(${-rect.x}px,${-rect.y}px)`
  }
  return styles
})

</script>

<template lang="pug">
svg.current-connection(:style="connectionStyles")
  path.current-connection-path(
    v-if="isDrawingConnection"
    fill="none"
    stroke-width="5"
    :stroke="state.currentConnectionColor"
    :d="state.currentConnectionPath"
    :style="connectionPathStyles"
  )
</template>

<style lang="stylus">
svg.current-connection
  position absolute
  path.current-connection-path
    pointer-events none
</style>
