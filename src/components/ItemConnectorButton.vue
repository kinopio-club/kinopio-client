<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'

import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import last from 'lodash-es/last'

const globalStore = useGlobalStore()
const connectionStore = useConnectionStore()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

const emit = defineEmits(['shouldRenderParent'])

const props = defineProps({
  visible: Boolean,
  isHiddenByOpacity: Boolean,
  card: Object,
  box: Object,
  isConnectingTo: Boolean,
  isConnectingFrom: Boolean,
  isVisibleInViewport: Boolean,
  defaultBackgroundColor: String,
  currentBackgroundColor: String,
  parentDetailsIsVisible: Boolean,
  backgroundIsTransparent: Boolean
})

const item = computed(() => props.card || props.box)

// space

const canEditSpace = computed(() => userStore.getUserCanEditSpace)
const backgroundColorIsDark = computed(() => {
  const color = props.currentBackgroundColor || props.defaultBackgroundColor
  return utils.colorIsDark(color)
})

// user

const isThemeDark = computed(() => userStore.theme === 'dark')
const isDarkInLightTheme = computed(() => {
  if (props.box?.fill === 'empty') {
    return isThemeDark.value
  } else {
    return backgroundColorIsDark.value && !isThemeDark.value
  }
})
const isLightInDarkTheme = computed(() => {
  if (props.box?.fill === 'empty') {
    return !isThemeDark.value
  } else {
    return !backgroundColorIsDark.value && isThemeDark.value
  }
})

// connections

const connectedConnectionTypes = computed(() => connectionStore.getItemConnectionTypes(item.value.id))
const itemConnections = computed(() => connectionStore.getConnectionsByItemId(item.value.id))
const currentConnectionColor = computed(() => globalStore.currentConnectionColor)
const connectionFromAnotherItemConnectedToCurrentItem = (anotherItemId) => {
  return itemConnections.value.find(connection => {
    const isConnectedToStart = connection.startItemId === anotherItemId
    const isConnectedToEnd = connection.endItemId === anotherItemId
    return isConnectedToStart || isConnectedToEnd
  })
}
const connectionsFromMultipleItemsConnectedToCurrentItem = (otherItemIds) => {
  let currentItemConnection
  otherItemIds.find(anotherItemId => {
    return itemConnections.value.find(connection => {
      const isConnectedToStart = connection.startItemId === anotherItemId
      const isConnectedToEnd = connection.endItemId === anotherItemId
      if (isConnectedToStart || isConnectedToEnd) {
        currentItemConnection = connection
        return true
      }
    })
  })
  return currentItemConnection
}
const connectionTypeColorisDark = computed(() => {
  const type = last(connectedConnectionTypes.value)
  if (!type) { return }
  return utils.colorIsDark(type.color)
})
const hasConnections = computed(() => {
  const connections = itemConnections.value
  return Boolean(connections.length)
})
const createCurrentConnection = (event) => {
  const cursor = utils.cursorPositionInViewport(event)
  const multipleItemsSelectedIds = globalStore.multipleCardsSelectedIds.concat(globalStore.multipleBoxesSelectedIds)
  let itemIds = [item.value.id]
  if (multipleItemsSelectedIds.length) {
    itemIds = multipleItemsSelectedIds
  }
  globalStore.currentConnectionStartItemIds = itemIds
  globalStore.currentConnectionCursorStart = cursor
}
const addConnectionType = (event) => {
  const shouldUseLastConnectionType = userStore.shouldUseLastConnectionType
  const shiftKey = event.shiftKey
  const connectionType = connectionStore.getNewConnectionType
  if (!connectionType) {
    connectionStore.createConnectionType()
  }
  if (shouldUseLastConnectionType && shiftKey) {
    connectionStore.createConnectionType()
    return
  }
  if (shiftKey || shouldUseLastConnectionType) {
    return
  }
  connectionStore.createConnectionType()
}

// connector button

const isConnectorDarkInLightTheme = computed(() => {
  if (connectionTypeColorisDark.value) { return connectionTypeColorisDark.value }
  return isDarkInLightTheme.value
})
const isConnectorLightInDarkTheme = computed(() => {
  if (connectionTypeColorisDark.value) { return !connectionTypeColorisDark.value }
  return isLightInDarkTheme.value
})
const connectorButtonBackground = computed(() => {
  if (globalStore.currentUserIsDraggingCard) { return }
  if (hasConnections.value || props.isConnectingFrom || props.isConnectingTo) { return }
  if (props.backgroundIsTransparent) { return }
  return props.currentBackgroundColor
})
const connectorGlowStyle = computed(() => {
  if (!props.isVisibleInViewport) { return }
  if (!utils.arrayHasItems(connectedConnectionTypes.value) && !globalStore.currentUserIsDrawingConnection) { return } // cards with no connections
  const color = connectedToAnotherItemDetailsVisibleColor.value ||
    connectedToAnotherItemBeingDraggedColor.value ||
    connectedToConnectionDetailsIsVisibleColor.value ||
    currentUserIsHoveringOverConnectorColor.value ||
    currentUserIsHoveringOverConnectionColor.value ||
    currentUserIsMultipleSelectedConnectionColor.value ||
    currentUserIsHoveringOverConnectedItemColor.value ||
    currentUserIsMultipleSelectedItemColor.value ||
    currentUserIsCreatingConnectionColor.value
  return { background: color }
})
const connectionColor = (connection) => {
  if (!connection) { return }
  const connectionType = connectionStore.getConnectionType(connection.connectionTypeId)
  return connectionType?.color
}
// another item that is connected to this one is being edited
const connectedToAnotherItemDetailsVisibleColor = computed(() => {
  if (props.parentDetailsIsVisible) { return }
  const anotherItemId = globalStore.cardDetailsIsVisibleForCardId || globalStore.boxDetailsIsVisibleForBoxId
  if (!anotherItemId) { return }
  const connection = connectionFromAnotherItemConnectedToCurrentItem(anotherItemId)
  return connectionColor(connection)
})
// another item that is connected to this one is being dragged
const connectedToAnotherItemBeingDraggedColor = computed(() => {
  const isDraggingCard = globalStore.currentUserIsDraggingCard
  const isDraggingBox = globalStore.currentUserIsDraggingBox
  if (!isDraggingCard && !isDraggingBox) { return }
  const itemId = globalStore.currentDraggingCardId || globalStore.currentDraggingBoxId
  const connection = connectionFromAnotherItemConnectedToCurrentItem(itemId)
  const color = connectionColor(connection)
  if (color) {
    emit('shouldRenderParent', true)
  } else {
    emit('shouldRenderParent', false)
  }
  return color
})
// a connection that is connected to this item is being edited
const connectedToConnectionDetailsIsVisibleColor = computed(() => {
  const connectionDetailsVisibleId = globalStore.connectionDetailsIsVisibleForConnectionId
  if (!connectionDetailsVisibleId) { return }
  const connectionWithDetailsVisible = itemConnections.value.find(connection => connection.id === connectionDetailsVisibleId)
  if (!connectionWithDetailsVisible) { return }
  const connectionType = connectionStore.getConnectionType(connectionWithDetailsVisible.connectionTypeId)
  return connectionType?.color
})
// a connection that is connected to this item connector that is being hovered over
const currentUserIsHoveringOverConnectorColor = computed(() => {
  const itemId = globalStore.currentUserIsHoveringOverConnectorItemId

  const connection = itemConnections.value.find(connection => {
    const isStart = connection.startItemId === itemId
    const isEnd = connection.endItemId === itemId
    return isStart || isEnd
  })
  return connectionColor(connection)
})
// a connection that is connected to this item is being hovered over
const currentUserIsHoveringOverConnectionColor = computed(() => {
  const connectionId = globalStore.currentUserIsHoveringOverConnectionId || globalStore.currentUserIsDraggingConnectionIdLabel
  const connection = itemConnections.value.find(currentItemConnection => currentItemConnection.id === connectionId)
  return connectionColor(connection)
})
// a connection that is connected to this item, is paint selected
const currentUserIsMultipleSelectedConnectionColor = computed(() => {
  const connectionIds = globalStore.multipleConnectionsSelectedIds
  const connection = itemConnections.value.find(currentItemConnection => connectionIds.includes(currentItemConnection.id))
  return connectionColor(connection)
})
// this item, or another item connected to this item, is being hovered over
const currentUserIsHoveringOverConnectedItemColor = computed(() => {
  const itemId = globalStore.currentUserIsHoveringOverCardId || globalStore.currentUserIsHoveringOverBoxId
  const connection = connectionFromAnotherItemConnectedToCurrentItem(itemId)
  return connectionColor(connection)
})
// the color of this item, or another item connected to this item, that is paint selected
const currentUserIsMultipleSelectedItemColor = computed(() => {
  const itemIds = globalStore.multipleCardsSelectedIds
  const connection = connectionsFromMultipleItemsConnectedToCurrentItem(itemIds)
  return connectionColor(connection)
})
// a current connection is being made by dragging from this item's connector
const currentUserIsCreatingConnectionColor = computed(() => {
  if (!globalStore.currentUserIsDrawingConnection) { return }
  const itemIds = globalStore.currentConnectionStartItemIds
  const isCurrentlyConnecting = itemIds.includes(item.value.id)
  if (!isCurrentlyConnecting) { return }
  return globalStore.currentConnectionColor
})

// handle events

const startConnecting = (event) => {
  if (!canEditSpace.value) { return }
  if (utils.isMultiTouch(event)) { return }
  globalStore.closeAllDialogs()
  globalStore.preventDraggedCardFromShowingDetails = true
  globalStore.preventDraggedBoxFromShowingDetails = true
  if (!globalStore.currentUserIsDrawingConnection) {
    addConnectionType(event)
    createCurrentConnection(event)
  }
  globalStore.updateCurrentUserIsDrawingConnection(true)
}
const handleMouseEnterConnector = (event) => {
  globalStore.currentUserIsHoveringOverConnectorItemId = item.value.id
}
const handleMouseLeaveConnector = () => {
  globalStore.currentUserIsHoveringOverConnectorItemId = ''
}

</script>

<template lang="pug">
.connector(
  v-if="props.visible"
  :data-item-id="item.id"
  :key="item.id"
  @mousedown.left="startConnecting"
  @touchstart="startConnecting"
  @mouseenter="handleMouseEnterConnector"
  @mouseleave="handleMouseLeaveConnector"
  :class="{ 'is-hidden-by-opacity': props.isHiddenByOpacity }"
)
  .connector-glow(:style="connectorGlowStyle" tabindex="-1")
  .connected-colors
    template(v-if="props.isConnectingTo || props.isConnectingFrom")
      .color(:style="{ background: currentConnectionColor}")
    template(v-else-if="props.isRemoteConnecting")
      .color(:style="{ background: props.remoteConnectionColor }")
    template(v-else v-for="type in connectedConnectionTypes")
      .color(:style="{ background: type?.color}")

  button.inline-button.connector-button(
    :class="{ active: props.isConnectingTo || props.isConnectingFrom, 'is-light-in-dark-theme': isConnectorLightInDarkTheme, 'is-dark-in-light-theme': isConnectorDarkInLightTheme}"
    :style="{background: connectorButtonBackground }"
    tabindex="-1"
  )
    template(v-if="hasConnections || props.isConnectingFrom || props.isConnectingTo")
      img.connector-icon(src="@/assets/connector-closed-in-card.svg")
    //- template(v-else)
    //-   img.connector-icon(src="@/assets/connector-open-in-card.svg")

</template>

<style lang="stylus">
.connector
  position relative
  z-index 2
  padding 8px
  align-self right
  cursor cell
  button
    z-index 1

  // &.invisible
  //   height 32px
  //   width 36px
  //   padding 0
  //   position absolute
  //   left 0
  //   top 0
  //   background transparent
  //   pointer-events none
  //   button
  //     width 0
  //     height 0
  //     min-width 0
  //     padding 0
  //     border none
  //     border-color var(--primary-border)

  .connector-glow
    position absolute
    width 32px
    height 32px
    top 0px
    left -1px
    border-radius 100px
    pointer-events none
  .connector-button
    background-color transparent
    border-radius 100px
    width 14px
    height 14px
    padding 0
    border 1px solid var(--primary-border)

  .connector-icon
    position absolute
    left -1px
    top -1px
    width 9.5px
    user-drag none
    -webkit-user-drag none
    pointer-events none

  .is-light-in-dark-theme
    border-color var(--primary-on-light-background)
    .connector-icon
      filter none
  .is-dark-in-light-theme
    border-color var(--primary-on-dark-background)
    .connector-icon
      filter invert()

  .connected-colors
    position absolute
    display flex
    height 12px
    width 12px
    top 10px
    left 9px
    overflow hidden
    border-radius 100px
    .color
      width 100%

</style>
