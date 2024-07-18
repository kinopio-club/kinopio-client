<script setup>
import { reactive, computed, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, ref, nextTick } from 'vue'
import { useStore } from 'vuex'

import utils from '@/utils.js'

const store = useStore()

const emit = defineEmits(['shouldRenderParent'])

const props = defineProps({
  visible: Boolean,
  card: Object,
  currentItemConnections: Array,
  isConnectingTo: Boolean,
  isConnectingFrom: Boolean,
  isVisibleInViewport: Boolean,
  defaultBackgroundColor: String,
  currentBackgroundColor: String,
  parentDetailsIsVisible: Boolean
})

// space

const canEditSpace = computed(() => store.getters['currentUser/canEditSpace']())
const backgroundColorIsDark = computed(() => {
  const color = props.card.backgroundColor || props.defaultBackgroundColor
  return utils.colorIsDark(color)
})

// user

const isThemeDark = computed(() => store.state.currentUser.theme === 'dark')
const isDarkInLightTheme = computed(() => backgroundColorIsDark.value && !isThemeDark.value)
const isLightInDarkTheme = computed(() => !backgroundColorIsDark.value && isThemeDark.value)

// connections

const currentConnectionColor = computed(() => store.state.currentConnectionColor)
const connectionFromAnotherCardConnectedToCurrentCard = (anotherCardId) => {
  return props.currentItemConnections.find(connection => {
    const isConnectedToStart = connection.startCardId === anotherCardId
    const isConnectedToEnd = connection.endCardId === anotherCardId
    return isConnectedToStart || isConnectedToEnd
  })
}
const connectionsFromMultipleCardsConnectedToCurrentCard = (otherCardIds) => {
  let currentCardConnection
  otherCardIds.find(anotherCardId => {
    return props.currentItemConnections.find(connection => {
      const isConnectedToStart = connection.startCardId === anotherCardId
      const isConnectedToEnd = connection.endCardId === anotherCardId
      if (isConnectedToStart || isConnectedToEnd) {
        currentCardConnection = connection
        return true
      }
    })
  })
  return currentCardConnection
}
const connectedConnectionTypes = computed(() => store.getters['currentConnections/typesByCardId'](props.card.id))
const connectedConnectionTypeById = (typeId) => {
  return connectedConnectionTypes.value.find(type => type.id === typeId)
}
const connectionTypeColorisDark = computed(() => {
  const type = connectedConnectionTypes.value[connectedConnectionTypes.value.length - 1]
  if (!type) { return }
  return utils.colorIsDark(type.color)
})
const currentUserIsDraggingLabelConnectedToCard = computed(() => {
  const connectionId = store.state.currentUserIsDraggingConnectionIdLabel
  if (!connectionId) { return }
  const connection = store.getters['currentConnections/byId'](connectionId)
  if (!connection) { return }
  const isConnected = connection.startCardId === props.card.id || connection.endCardId === props.card.id
  return isConnected
})
const hasConnections = computed(() => {
  const connections = store.getters['currentConnections/byCardId'](props.card.id)
  return Boolean(connections.length)
})
const createCurrentConnection = (event) => {
  const cursor = utils.cursorPositionInViewport(event)
  const multipleCardsSelectedIds = store.state.multipleCardsSelectedIds
  let cardIds = [props.card.id]
  if (multipleCardsSelectedIds.length) {
    cardIds = multipleCardsSelectedIds
  }
  store.commit('currentConnectionStartCardIds', cardIds)
  store.commit('currentConnectionCursorStart', cursor)
}
const addConnectionType = (event) => {
  const shouldUseLastConnectionType = store.state.currentUser.shouldUseLastConnectionType
  const shiftKey = event.shiftKey
  const connectionType = store.getters['currentConnections/typeForNewConnections']
  if (!connectionType) {
    store.dispatch('currentConnections/addType')
  }
  if (shouldUseLastConnectionType && shiftKey) {
    store.dispatch('currentConnections/addType')
    return
  }
  if (shiftKey || shouldUseLastConnectionType) {
    return
  }
  store.dispatch('currentConnections/addType')
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
  if (store.state.currentUserIsDraggingCard) { return }
  if (hasConnections.value || props.isConnectingFrom || props.isConnectingTo) { return }
  return props.currentBackgroundColor
})
const connectorGlowStyle = computed(() => {
  if (!props.isVisibleInViewport) { return }
  if (!utils.arrayHasItems(connectedConnectionTypes.value) && !store.state.currentUserIsDrawingConnection) { return } // cards with no connections
  const color = connectedToAnotherCardDetailsVisibleColor.value ||
    connectedToAnotherCardBeingDraggedColor.value ||
    connectedToConnectionDetailsIsVisibleColor.value ||
    currentUserIsHoveringOverConnectionColor.value ||
    currentUserIsMultipleSelectedConnectionColor.value ||
    currentUserIsHoveringOverConnectedCardColor.value ||
    currentUserIsMultipleSelectedCardColor.value ||
    currentUserIsCreatingConnectionColor.value
  return { background: color }
})
const connectionColor = (connection) => {
  if (!connection) { return }
  const connectionType = connectedConnectionTypeById(connection.connectionTypeId)
  return connectionType?.color
}
// another card that is connected to this one is being edited
const connectedToAnotherCardDetailsVisibleColor = computed(() => {
  if (props.parentDetailsIsVisible) { return }
  const anotherCardId = store.state.cardDetailsIsVisibleForCardId
  if (!anotherCardId) { return }
  const connection = connectionFromAnotherCardConnectedToCurrentCard(anotherCardId)
  return connectionColor(connection)
})
// another card that is connected to this one is being dragged
const connectedToAnotherCardBeingDraggedColor = computed(() => {
  const isDraggingCard = store.state.currentUserIsDraggingCard
  if (!isDraggingCard) { return }
  const currentDraggingCardId = store.state.currentDraggingCardId
  const connection = connectionFromAnotherCardConnectedToCurrentCard(currentDraggingCardId)
  const color = connectionColor(connection)
  if (color) {
    emit('shouldRenderParent', true)
  } else {
    emit('shouldRenderParent', false)
  }
  return color
})
// a connection that is connected to this card is being edited
const connectedToConnectionDetailsIsVisibleColor = computed(() => {
  const connectionDetailsVisibleId = store.state.connectionDetailsIsVisibleForConnectionId
  if (!connectionDetailsVisibleId) { return }
  const connectionWithDetailsVisible = props.currentItemConnections.find(connection => connection.id === connectionDetailsVisibleId)
  if (!connectionWithDetailsVisible) { return }
  const connectionType = connectedConnectionTypeById(connectionWithDetailsVisible.connectionTypeId)
  return connectionType?.color
})
// a connection that is connected to this card is being hovered over
const currentUserIsHoveringOverConnectionColor = computed(() => {
  const connectionId = store.state.currentUserIsHoveringOverConnectionId || store.state.currentUserIsDraggingConnectionIdLabel
  const connection = props.currentItemConnections.find(currentCardConnection => currentCardConnection.id === connectionId)
  return connectionColor(connection)
})
// a connection that is connected to this card, is paint selected
const currentUserIsMultipleSelectedConnectionColor = computed(() => {
  const connectionIds = store.state.multipleConnectionsSelectedIds
  const connection = props.currentItemConnections.find(currentCardConnection => connectionIds.includes(currentCardConnection.id))
  return connectionColor(connection)
})
// this card, or another card connected to this card, is being hovered over
const currentUserIsHoveringOverConnectedCardColor = computed(() => {
  const cardId = store.state.currentUserIsHoveringOverCardId
  const connection = connectionFromAnotherCardConnectedToCurrentCard(cardId)
  return connectionColor(connection)
})
// this card, or another card connected to this card, is paint selected
const currentUserIsMultipleSelectedCardColor = computed(() => {
  const cardIds = store.state.multipleCardsSelectedIds
  const connection = connectionsFromMultipleCardsConnectedToCurrentCard(cardIds)
  return connectionColor(connection)
})
// a current connection is being made by dragging from this card's connector
const currentUserIsCreatingConnectionColor = computed(() => {
  if (!store.state.currentUserIsDrawingConnection) { return }
  const cardIds = store.state.currentConnectionStartCardIds
  const isCurrentlyConnecting = cardIds.includes(props.card.id)
  if (!isCurrentlyConnecting) { return }
  return store.state.currentConnectionColor
})

// handle events

const startConnecting = (event) => {
  if (!canEditSpace.value) { return }
  if (utils.isMultiTouch(event)) { return }
  store.dispatch('closeAllDialogs')
  store.commit('preventDraggedCardFromShowingDetails', true)
  if (!store.state.currentUserIsDrawingConnection) {
    addConnectionType(event)
    createCurrentConnection(event)
  }
  store.commit('currentUserIsDrawingConnection', true)
}
const handleMouseEnterConnector = (event) => {
  store.commit('currentUserIsHoveringOverConnectorCardId', props.card.id)
}
const handleMouseLeaveConnector = () => {
  store.commit('currentUserIsHoveringOverConnectorCardId', '')
}

</script>

<template lang="pug">
.connector(
  v-if="props.visible"
  :data-card-id="props.card.id"
  :key="props.card.id"
  @mousedown.left="startConnecting"
  @touchstart="startConnecting"
  @mouseenter="handleMouseEnterConnector"
  @mouseleave="handleMouseLeaveConnector"
)
  .connector-glow(:style="connectorGlowStyle" tabindex="-1")
  .connected-colors
    template(v-if="props.isConnectingTo || props.isConnectingFrom")
      .color(:style="{ background: currentConnectionColor}")
    template(v-else-if="props.isRemoteConnecting")
      .color(:style="{ background: props.remoteConnectionColor }")
    template(v-else v-for="type in connectedConnectionTypes")
      .color(:style="{ background: type.color}")

  button.inline-button.connector-button(
    :class="{ active: props.isConnectingTo || props.isConnectingFrom, 'is-light-in-dark-theme': isConnectorLightInDarkTheme, 'is-dark-in-light-theme': isConnectorDarkInLightTheme}"
    :style="{background: connectorButtonBackground }"
    tabindex="-1"
    @keyup.stop.enter="showCardDetails"
  )
    template(v-if="hasConnections || props.isConnectingFrom || props.isConnectingTo")
      img.connector-icon(src="@/assets/connector-closed-in-card.svg")
    //- template(v-else)
    //-   img.connector-icon(src="@/assets/connector-open-in-card.svg")

</template>

<style lang="stylus">
.connector
  position relative
  height 32px
  padding-top 9px !important
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
</style>
