<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick } from 'vue'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import utils from '@/utils.js'

import { nanoid } from 'nanoid'

const globalStore = useGlobalStore()
const cardStore = useCardStore()
const connectionStore = useConnectionStore()
const boxStore = useBoxStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()
const broadcastStore = useBroadcastStore()

let prevType
let unsubscribes

onMounted(() => {
  window.addEventListener('mousemove', interact)
  window.addEventListener('touchmove', interact)
  window.addEventListener('mouseup', stopInteractions)
  window.addEventListener('touchend', stopInteractions)

  const globalActionUnsubscribe = globalStore.$onAction(
    ({ name, args }) => {
      if (name === 'triggerDrawConnectionFrame') {
        const event = args[0]
        drawCurrentConnection(event)
      } else if (name === 'closeAllDialogs') {
        if (isDrawingConnection.value) {
          globalStore.updateCurrentUserIsDrawingConnection(false)
          connectionStore.removeAllUnusedConnectionTypes()
        }
      }
    }
  )
  unsubscribes = () => {
    globalActionUnsubscribe()
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', interact)
  window.removeEventListener('touchmove', interact)
  window.removeEventListener('mouseup', stopInteractions)
  window.removeEventListener('touchend', stopInteractions)
  unsubscribes()
})

const props = defineProps({
  startItemId: String
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
const isDrawingConnection = computed(() => globalStore.currentUserIsDrawingConnection)
const drawCurrentConnection = (event) => {
  const end = utils.cursorPositionInSpace(event)
  let start = utils.connectorCoords(props.startItemId)
  start = utils.cursorPositionInSpace(null, start)
  const controlPoint = userStore.defaultConnectionControlPoint
  const path = connectionStore.getConnectionPathBetweenCoords(start, end, controlPoint)
  const endItemId = checkCurrentConnectionSuccess(event)
  state.currentConnectionPath = path
  const connectionType = connectionStore.getNewConnectionType
  prevType = connectionType
  state.currentConnectionColor = connectionType.color
  globalStore.currentConnectionColor = connectionType.color
  const updates = {
    userId: userStore.id,
    connectionTypeId: connectionType.id,
    color: connectionType.color,
    startItemId: props.startItemId,
    endItemId,
    path
  }
  broadcastStore.update({ updates, action: 'updateRemoteCurrentConnection' })
}

// connect to item

const checkCurrentConnectionSuccess = (event) => {
  if (!event) { return }
  const position = utils.cursorPositionInViewport(event)
  const cardElement = utils.cardElementFromPosition(position.x, position.y)
  const boxElement = utils.boxElementFromConnectorPosition(position.x, position.y)
  const updates = { userId: userStore.id }
  let isCurrentConnectionConnected
  if (cardElement) {
    isCurrentConnectionConnected = props.startItemId !== cardElement.dataset.cardId
  }
  if (boxElement) {
    isCurrentConnectionConnected = props.startItemId !== boxElement.dataset.boxId
  }
  // not connected
  if (!cardElement && !boxElement) {
    globalStore.currentConnectionSuccess = {}
    updates.endItemId = null
  // connected to card
  } else if (isCurrentConnectionConnected && cardElement) {
    const card = cardStore.getCard(cardElement.dataset.cardId)
    if (card.isLocked) {
      globalStore.currentConnectionSuccess = {}
      return
    }
    globalStore.currentConnectionSuccess = card
    updates.endItemId = card.id
  // connected to box
  } else if (isCurrentConnectionConnected && boxElement) {
    const box = boxStore.getBox(boxElement.dataset.boxId)
    if (box.isLocked) {
      globalStore.currentConnectionSuccess = {}
      return
    }
    globalStore.currentConnectionSuccess = box
    updates.endItemId = box.id
  } else {
    globalStore.currentConnectionSuccess = {}
  }
  return updates.endItemId
}
const addConnections = async (event) => {
  const currentConnectionSuccess = globalStore.currentConnectionSuccess
  const startItemIds = globalStore.currentConnectionStartItemIds
  let endItemId, estimatedEndItemConnectorPosition
  let position = utils.cursorPositionInSpace(event)
  const shouldPreventCreate = utils.isPositionOutsideOfSpace(position)
  if (shouldPreventCreate) {
    position = utils.cursorPositionInPage(event)
    globalStore.addNotificationWithPosition({ message: 'Outside Space', position, type: 'info', icon: 'cancel', layer: 'app' })
    return
  }
  if (currentConnectionSuccess.id) {
    endItemId = currentConnectionSuccess.id
  } else {
    // create new card
    const startItem = spaceStore.getSpaceItemById(startItemIds[0])
    const color = startItem.color || startItem.backgroundColor
    endItemId = nanoid()
    const newCard = { position, id: endItemId, isParentCard: true, backgroundColor: color }
    cardStore.createCard(newCard)
    globalStore.childCardId = ''
    estimatedEndItemConnectorPosition = utils.estimatedNewCardConnectorPosition(position)
  }
  // create connections to endItemId
  await nextTick()
  cardStore.updateCardsDimensions(startItemIds)
  startItemIds.forEach(startItemId => {
    const controlPoint = userStore.defaultConnectionControlPoint
    const path = connectionStore.getConnectionPathBetweenItems({
      startItemId,
      endItemId,
      controlPoint,
      estimatedEndItemConnectorPosition
    })
    const connection = { startItemId, endItemId, path, controlPoint, connectionTypeId: prevType }
    connectionStore.createConnection(connection)
  })
}

// stop drawing

const stopInteractions = (event) => {
  if (isDrawingConnection.value) {
    globalStore.clearMultipleSelected()
    addConnections(event)
  }
  globalStore.currentConnectionSuccess = {}
  const isCurrentConnection = globalStore.currentConnectionStartItemIds.length
  if (isCurrentConnection) {
    globalStore.currentConnectionStartItemIds = []
    const updates = { userId: userStore.id }
    broadcastStore.update({ updates, action: 'removeRemoteCurrentConnection' })
  }
  globalStore.updateCurrentUserIsDrawingConnection(false)
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
  const styles = {
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px'
  }
  if (globalStore.currentUserIsDraggingCard) {
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
    stroke-linecap="round"
    :d="state.currentConnectionPath"
    :style="connectionPathStyles"
  )
</template>

<style lang="stylus">
svg.current-connection
  position absolute
  min-width 5px
  min-height 5px
  path.current-connection-path
    pointer-events none
</style>
