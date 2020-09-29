import Vue from 'vue'
import Vuex from 'vuex'
import utils from '@/utils.js'
import nanoid from 'nanoid'

// store modules
import api from '@/store/api.js'
import broadcast from '@/store/broadcast.js'
import history from '@/store/history.js'
import currentUser from '@/store/currentUser.js'
import currentSpace from '@/store/currentSpace.js'
import upload from '@/store/upload.js'

// store plugins
import websocket from '@/store/plugins/websocket.js'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {
    pageHeight: 0,
    pageWidth: 0,
    viewportHeight: 0,
    viewportWidth: 0,
    isOnline: true,
    isBeta: false,
    shouldHideConnectionOutline: false,
    newStuffIsUpdated: false,
    copiedCards: [],
    stripeIsLoaded: false,
    shouldHideFooter: false,
    isTouchDevice: false,

    // reset password
    resetPasswordApiKey: '',
    passwordResetIsVisible: false,

    // services
    importArenaChannelIsVisible: false,
    isAuthenticatingWithArena: false,

    // current user state
    currentUserIsDrawingConnection: false,
    currentUserIsPainting: false,
    currentUserIsPaintingLocked: false,
    currentUserIsDraggingCard: false,
    currentUserIsHoveringOverConnectionId: '',

    // cards
    shouldAddCard: false,
    cardDetailsIsVisibleForCardId: '',
    parentCardId: '',
    childCardId: '',
    remoteCardDetailsVisible: [],

    // connecting
    currentConnection: {}, // startCardId, startConnectorRect
    currentConnectionSuccess: {},
    currentConnectionCursorStart: {},
    connectionDetailsPosition: {}, // x, y
    connectionDetailsIsVisibleForConnectionId: '',
    currentConnectionColor: '',
    triggeredDrawConnectionFrame: {},
    remoteConnectionDetailsVisible: [],
    remoteCurrentConnections: [],

    // tags
    tagDetailsIsVisible: false,
    tagDetailsPosition: {}, // x, y
    currentSelectedTag: {},
    remoteTagNameGroups: [], // {name: 'abc', cards: []}
    remoteTags: [],
    remoteTagsIsFetched: false,

    // dragging
    currentDraggingCardId: '',
    remoteCardsDragging: [],
    remoteUploadDraggedOverCards: [],
    preventDraggedCardFromShowingDetails: false,
    currentCardsDragging: [],
    currentConnectionsDragging: [],

    // multiple selection
    multipleSelectedActionsIsVisible: false,
    multipleSelectedActionsPosition: {},
    multipleCardsSelectedIds: [],
    remoteCardsSelected: [],
    remoteConnectionsSelected: [],
    multipleConnectionsSelectedIds: [],
    triggeredPaintFramePosition: {},

    // loading
    isLoadingSpace: false,
    isJoiningSpace: false, // broadcast
    spaceUrlToLoad: '',
    spaceCollaboratorKeys: [],
    remotePendingUploads: [],
    hasRestoredFavorites: false,
    loadSpaceShowDetailsForCardId: '',

    // notifications
    notifications: [],
    notifySpaceNotFound: false,
    notifyConnectionError: false,
    notifyServerCouldNotSave: false,
    notifySpaceIsRemoved: false,
    notifyNewUser: false,
    notifySignUpToEditSpace: false,
    notifySpaceIsOpenAndEditable: false,
    notifyCardsCreatedIsNearLimit: false,
    notifyCardsCreatedIsOverLimit: false,

    // notifications with position
    notificationsWithPosition: [],

    // filters
    filteredConnectionTypeIds: [],
    filteredFrameIds: [],
    filteredTagNames: []
  },
  mutations: {
    updatePageSizes: (state) => {
      const body = document.body
      const html = document.documentElement
      state.pageWidth = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      state.pageHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
      state.viewportWidth = utils.visualViewport().width
      state.viewportHeight = utils.visualViewport().height
    },
    updateSpacePageSize: (state, { maxX, maxY }) => {
      const extraScrollArea = 160
      state.pageWidth = maxX + extraScrollArea
      state.pageHeight = maxY + extraScrollArea
    },

    pageHeight: (state, height) => {
      utils.typeCheck({ value: height, type: 'number' })
      state.pageHeight = height
    },
    pageWidth: (state, width) => {
      utils.typeCheck({ value: width, type: 'number' })
      state.pageWidth = width
    },
    closeAllDialogs: (state) => {
      state.multipleSelectedActionsIsVisible = false
      state.cardDetailsIsVisibleForCardId = ''
      state.connectionDetailsIsVisibleForConnectionId = ''
      state.tagDetailsIsVisible = false
      state.currentSelectedTag = {}
    },
    isOnline: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isOnline = value
    },
    isBeta: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isBeta = value
    },
    shouldHideConnectionOutline: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldHideConnectionOutline = value
    },
    newStuffIsUpdated: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.newStuffIsUpdated = value
    },
    stripeIsLoaded: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.stripeIsLoaded = value
    },
    shouldHideFooter: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldHideFooter = value
    },
    isTouchDevice: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isTouchDevice = value
    },
    resetPasswordApiKey: (state, apiKey) => {
      utils.typeCheck({ value: apiKey, type: 'string' })
      state.resetPasswordApiKey = apiKey
    },
    passwordResetIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.passwordResetIsVisible = value
    },
    importArenaChannelIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.importArenaChannelIsVisible = value
    },
    isAuthenticatingWithArena: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isAuthenticatingWithArena = value
    },
    triggerSpaceDetailsVisible: () => {},
    triggerFocusSpaceDetailsFilter: () => {},
    triggerSignUpOrInIsVisible: () => {},
    triggerArenaAuthenticationError: () => {},
    triggerKeyboardShortcutsIsVisible: () => {},
    triggerReadOnlyJiggle: () => {},
    triggerSelectTemplateCategory: () => {},
    triggerUpdateMagicPaintPositionOffset: () => {},
    triggeredPaintFramePosition: (state, cursor) => {
      state.triggeredPaintFramePosition = cursor
    },
    triggerAddRemotePaintingCircle: () => {},
    triggerUpdateRemoteUserCursor: () => {},
    triggerUpdateRemoteDropGuideLine: () => {},
    triggerUpdateStopRemoteUserDropGuideLine: () => {},
    triggerUpdatePositionInVisualViewport: () => {},
    triggerUpgradeUserIsVisible: () => {},
    triggerUploadComplete: () => {},
    triggerPauseAllAudio: () => {},
    triggerScrollCardIntoView: (state, cardId) => {},
    triggerPickerNavigationKey: (state, key) => {},
    triggerPickerSelect: () => {},

    // Cards

    shouldAddCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.shouldAddCard = value
    },
    currentUserIsHoveringOverConnectionId: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string' })
      state.currentUserIsHoveringOverConnectionId = connectionId
    },
    cardDetailsIsVisibleForCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.cardDetailsIsVisibleForCardId = cardId
    },
    parentCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.parentCardId = cardId
    },
    childCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.childCardId = cardId
    },
    addToCopiedCards: (state, cards) => {
      utils.typeCheck({ value: cards, type: 'array' })
      cards = cards.map(card => {
        card = utils.clone(card)
        return card
      })
      state.copiedCards = cards
    },
    updateRemoteCardDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let cardDetailsVisible = utils.clone(state.remoteCardDetailsVisible)
      cardDetailsVisible = cardDetailsVisible.filter(card => card.id !== update.cardId) || []
      cardDetailsVisible.push(update)
      state.remoteCardDetailsVisible = cardDetailsVisible
    },
    clearRemoteCardDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      state.remoteCardDetailsVisible = state.remoteCardDetailsVisible.filter(card => card.userId !== update.userId) || []
    },

    // Connecting

    currentUserIsDrawingConnection: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsDrawingConnection = value
    },
    currentConnectionSuccess: (state, object) => {
      utils.typeCheck({ value: object, type: 'object', allowUndefined: true })
      state.currentConnectionSuccess = object
    },
    currentConnectionCursorStart: (state, object) => {
      utils.typeCheck({ value: object, type: 'object' })
      state.currentConnectionCursorStart = object
    },
    currentConnection: (state, updates) => {
      let object = state.currentConnection
      object = utils.updateObject(object, updates)
      state.currentConnection = object
    },
    updateRemoteCurrentConnection: (state, updates) => {
      const keys = Object.keys(updates)
      const id = updates.id
      let connection = state.remoteCurrentConnections.find(remoteConnection => remoteConnection.id === id) || {}
      state.remoteCurrentConnections = state.remoteCurrentConnections.filter(remoteConnection => remoteConnection.id !== id)
      keys.forEach(key => {
        connection[key] = updates[key]
      })
      state.remoteCurrentConnections.push(connection)
    },
    removeRemoteCurrentConnection: (state, updates) => {
      const id = updates.id
      state.remoteCurrentConnections = state.remoteCurrentConnections.filter(remoteConnection => remoteConnection.id !== id)
    },

    // Painting

    currentUserIsPainting: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsPainting = value
    },
    currentUserIsPaintingLocked: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsPaintingLocked = value
    },

    // Dragging

    currentUserIsDraggingCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.currentUserIsDraggingCard = value
    },
    preventDraggedCardFromShowingDetails: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.preventDraggedCardFromShowingDetails = value
    },
    currentDraggingCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.currentDraggingCardId = cardId
      if (state.multipleCardsSelectedIds.length) { return }
      // ♨️ set up currentConnectionsDragging
      let connections = utils.clone(state.currentSpace.connections)
      connections = connections.filter(connection => {
        return (connection.startCardId === cardId || connection.endCardId === cardId)
      })
      state.currentConnectionsDragging = connections
    },
    addToRemoteCardsDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let cards = utils.clone(state.remoteCardsDragging)
      cards = cards.filter(card => card.userId !== update.userId) || []
      cards.push(update)
      state.remoteCardsDragging = cards
    },
    clearRemoteCardsDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      state.remoteCardsDragging = state.remoteCardsDragging.filter(card => card.userId !== update.userId)
    },
    addToRemoteUploadDraggedOverCards: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let cards = utils.clone(state.remoteUploadDraggedOverCards)
      cards = cards.filter(card => card.userId !== update.userId) || []
      cards.push(update)
      state.remoteUploadDraggedOverCards = cards
    },
    clearRemoteUploadDraggedOverCards: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      state.remoteUploadDraggedOverCards = state.remoteUploadDraggedOverCards.filter(card => card.userId !== update.userId)
    },

    // Tag Details

    tagDetailsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.tagDetailsIsVisible = value
    },
    tagDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object' })
      state.tagDetailsPosition = position
    },
    currentSelectedTag: (state, tag) => {
      utils.typeCheck({ value: tag, type: 'object' })
      state.currentSelectedTag = tag
    },
    addToRemoteTagNameGroups: (state, group) => {
      utils.typeCheck({ value: group, type: 'object' })
      let groups = state.remoteTagNameGroups
      groups.push(group)
      state.remoteTagNameGroups = groups
    },
    remoteTags: (state, tags) => {
      console.log('store remoteTags', tags)
      utils.typeCheck({ value: tags, type: 'array' })
      state.remoteTags = tags
    },
    remoteTagsIsFetched: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.remoteTagsIsFetched = value
    },

    // Connection Details

    connectionDetailsIsVisibleForConnectionId: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string' })
      state.connectionDetailsIsVisibleForConnectionId = connectionId
    },
    currentConnectionColor: (state, color) => {
      utils.typeCheck({ value: color, type: 'string' })
      state.currentConnectionColor = color
    },
    connectionDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object' })
      state.connectionDetailsPosition = position
    },
    triggeredDrawConnectionFrame: (state, cursor) => {
      state.triggeredDrawConnectionFrame = cursor
    },
    addToRemoteConnectionDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      let connections = utils.clone(state.remoteConnectionDetailsVisible)
      connections = connections.filter(connection => connection.userId !== update.userId) || []
      connections.push(update)
      state.remoteConnectionDetailsVisible = connections
    },
    clearRemoteConnectionDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      state.remoteConnectionDetailsVisible = state.remoteConnectionDetailsVisible.filter(connection => connection.userId !== update.userId)
    },

    // Multiple Selection

    multipleSelectedActionsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.multipleSelectedActionsIsVisible = value
    },
    multipleSelectedActionsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object' })
      state.multipleSelectedActionsPosition = position
    },
    addToMultipleCardsSelected: (state, cardId) => {
      state.multipleCardsSelectedIds.push(cardId)
      // ♨️ set up currentConnectionsDragging
      let connections = utils.clone(state.currentSpace.connections)
      connections = connections.filter(connection => {
        const isStartCard = connection.startCardId === cardId
        const isEndCard = connection.endCardId === cardId
        return isStartCard || isEndCard
      })
      connections.forEach(connection => {
        state.currentConnectionsDragging.push(connection)
      })
      // ♨️ set up currentCardsDragging
      let currentCard = state.currentSpace.cards.filter(card => card.id === cardId)
      state.currentCardsDragging.push(currentCard)
    },
    addToMultipleConnectionsSelected: (state, connectionId) => {
      state.multipleConnectionsSelectedIds.push(connectionId)
    },
    removeFromMultipleConnectionsSelected: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string' })
      state.multipleConnectionsSelectedIds = state.multipleConnectionsSelectedIds.filter(id => {
        return id !== connectionId
      })
    },
    clearMultipleSelected: (state) => {
      state.multipleCardsSelectedIds = []
      state.multipleConnectionsSelectedIds = []
    },
    multipleCardsSelectedIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array' })
      state.multipleCardsSelectedIds = cardIds
    },
    multipleConnectionsSelectedIds: (state, connectionIds) => {
      utils.typeCheck({ value: connectionIds, type: 'array' })
      state.multipleConnectionsSelectedIds = connectionIds
    },
    addToRemoteCardsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      const isSelected = state.remoteCardsSelected.find(card => {
        const cardIsSelected = card.cardId === update.cardId
        const selectedByUser = card.userId === update.userId
        return cardIsSelected && selectedByUser
      })
      if (isSelected) { return }
      state.remoteCardsSelected.push(update)
    },
    addToRemoteConnectionsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      const isSelected = state.remoteConnectionsSelected.find(connection => {
        const connectionIsSelected = connection.connectionId === update.connectionId
        const selectedByUser = connection.userId === update.userId
        return connectionIsSelected && selectedByUser
      })
      if (isSelected) { return }
      state.remoteConnectionsSelected.push(update)
    },
    clearRemoteMultipleSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      const user = update.user || update.updates.user
      state.remoteCardsSelected = state.remoteCardsSelected.filter(card => card.userId !== user.id)
      state.remoteConnectionsSelected = state.remoteConnectionsSelected.filter(connection => connection.userId !== user.id)
    },

    // Loading

    isLoadingSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isLoadingSpace = value
    },
    isJoiningSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isJoiningSpace = value
    },
    spaceUrlToLoad: (state, spaceUrl) => {
      utils.typeCheck({ value: spaceUrl, type: 'string' })
      state.spaceUrlToLoad = spaceUrl
    },
    addToSpaceCollaboratorKeys: (state, spaceCollaboratorKey) => {
      utils.typeCheck({ value: spaceCollaboratorKey, type: 'object' })
      state.spaceCollaboratorKeys.push(spaceCollaboratorKey) // { spaceId, collaboratorKey }
    },
    updateRemotePendingUploads: (state, update) => {
      utils.typeCheck({ value: update, type: 'object' })
      delete update.type
      const existingUpload = state.remotePendingUploads.find(item => {
        const card = item.cardId === update.cardId
        const space = item.spaceId === update.spaceId
        return card || space
      })
      if (existingUpload) {
        state.remotePendingUploads = state.remotePendingUploads.map(item => {
          console.log('item', item, item.id, existingUpload.id, item.id === existingUpload.id)
          if (item.id === existingUpload.id) {
            item.percentComplete = update.percentComplete
          }
          return item
        })
      } else {
        state.remotePendingUploads.push(update)
      }
      state.remotePendingUploads = state.remotePendingUploads.filter(item => item.percentComplete !== 100)
    },
    hasRestoredFavorites: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.hasRestoredFavorites = value
    },
    loadSpaceShowDetailsForCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      state.loadSpaceShowDetailsForCardId = cardId
    },

    // Notifications

    addNotification: (state, notification) => {
      notification.id = nanoid()
      state.notifications.push(notification)
    },
    removeNotification: (state) => {
      state.notifications.shift()
    },
    clearAllNotifications: (state) => {
      state.notifySpaceNotFound = false
      state.notifyConnectionError = false
      state.notifyServerCouldNotSave = false
      state.notifySignUpToEditSpace = false
      state.notifySpaceIsOpenAndEditable = false
      state.notifyCardsCreatedIsNearLimit = false
      state.notifyCardsCreatedIsOverLimit = false
      state.notificationsWithPosition = []
    },
    notifySpaceNotFound: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifySpaceNotFound = value
    },
    notifyConnectionError: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyConnectionError = value
    },
    notifyServerCouldNotSave: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyServerCouldNotSave = value
    },
    notifySpaceIsRemoved: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifySpaceIsRemoved = value
    },
    notifyNewUser: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyNewUser = value
    },
    notifySignUpToEditSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifySignUpToEditSpace = value
    },
    notifySpaceIsOpenAndEditable: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifySpaceIsOpenAndEditable = value
    },
    notifyCardsCreatedIsNearLimit: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyCardsCreatedIsNearLimit = value
    },
    notifyCardsCreatedIsOverLimit: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.notifyCardsCreatedIsOverLimit = value
    },

    // Notifications with Position

    addNotificationWithPosition: (state, notification) => {
      notification.id = nanoid()
      state.notificationsWithPosition.push(notification)
    },
    removeNotificationWithPosition: (state) => {
      state.notificationsWithPosition.shift()
    },

    // Filters

    clearSpaceFilters: (state) => {
      state.filteredConnectionTypeIds = []
      state.filteredFrameIds = []
      state.filteredTagNames = []
    },
    addToFilteredConnectionTypeId: (state, id) => {
      utils.typeCheck({ value: id, type: 'string' })
      state.filteredConnectionTypeIds.push(id)
    },
    removeFromFilteredConnectionTypeId: (state, id) => {
      utils.typeCheck({ value: id, type: 'string' })
      state.filteredConnectionTypeIds = state.filteredConnectionTypeIds.filter(typeId => typeId !== id)
    },
    addToFilteredFrameIds: (state, id) => {
      utils.typeCheck({ value: id, type: 'number' })
      state.filteredFrameIds.push(id)
    },
    removeFromFilteredFrameIds: (state, id) => {
      utils.typeCheck({ value: id, type: 'number' })
      state.filteredFrameIds = state.filteredFrameIds.filter(frameId => frameId !== id)
    },
    addToFilteredTagNames: (state, name) => {
      utils.typeCheck({ value: name, type: 'string' })
      state.filteredTagNames.push(name)
    },
    removeFromFilteredTagNames: (state, name) => {
      utils.typeCheck({ value: name, type: 'string' })
      state.filteredTagNames = state.filteredTagNames.filter(tagName => tagName !== name)
    }
  },

  actions: {
    clearAllFilters: (context) => {
      context.commit('clearSpaceFilters')
      context.dispatch('currentUser/clearUserFilters')
    },
    clearSpaceFilters: (context) => {
      context.commit('clearSpaceFilters')
    },
    closeAllDialogs: (context, value) => {
      const logging = value || 'Store.closeAllDialogs'
      context.commit('closeAllDialogs', logging)
      const space = utils.clone(context.rootState.currentSpace)
      const user = utils.clone(context.rootState.currentUser)
      context.commit('broadcast/updateUser', { user: utils.userMeta(user, space), type: 'addSpectatorToSpace' }, { root: true })
      context.commit('broadcast/updateStore', { updates: { userId: user.id }, type: 'clearRemoteCardDetailsVisible' })
      context.commit('broadcast/updateStore', { updates: { userId: user.id }, type: 'clearRemoteConnectionDetailsVisible' })
    },
    updateSpacePageSize: (context) => {
      let maxX = 0
      let maxY = 0
      const cardMap = utils.cardMap()
      cardMap.forEach(card => {
        const cardX = card.x + card.width
        const cardY = card.y + card.height
        if (cardX > maxX) {
          maxX = cardX
        }
        if (cardY > maxY) {
          maxY = cardY
        }
      })
      context.commit('updateSpacePageSize', { maxX, maxY })
    },
    addToMultipleCardsSelected: (context, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string' })
      if (context.state.multipleCardsSelectedIds.includes(cardId)) { return }
      context.commit('addToMultipleCardsSelected', cardId)
      const updates = {
        userId: context.rootState.currentUser.id,
        cardId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteCardsSelected' }, { root: true })
    },
    clearMultipleSelected: (context) => {
      context.commit('clearMultipleSelected')
      const space = utils.clone(context.rootState.currentSpace)
      const user = utils.clone(context.rootState.currentUser)
      context.commit('broadcast/updateStore', { user: utils.userMeta(user, space), type: 'clearRemoteMultipleSelected' }, { root: true })
    },
    addToMultipleConnectionsSelected: (context, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string' })
      if (context.state.multipleConnectionsSelectedIds.includes(connectionId)) { return }
      context.commit('addToMultipleConnectionsSelected', connectionId)
      const updates = {
        userId: context.rootState.currentUser.id,
        connectionId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteConnectionsSelected' }, { root: true })
    },
    connectionDetailsIsVisibleForConnectionId: (context, connectionId) => {
      context.commit('connectionDetailsIsVisibleForConnectionId', connectionId)
      const updates = {
        userId: context.rootState.currentUser.id,
        connectionId
      }
      context.commit('broadcast/updateStore', { updates, type: 'addToRemoteConnectionDetailsVisible' }, { root: true })
    }
  },

  getters: {
    shouldScrollAtEdges: (state, getters) => (event) => {
      let isPainting
      if (event.touches) {
        isPainting = state.currentUserIsPaintingLocked
      } else {
        isPainting = state.currentUserIsPainting
      }
      const isDrawingConnection = state.currentUserIsDrawingConnection
      const isDraggingCard = state.currentUserIsDraggingCard
      return isPainting || isDrawingConnection || isDraggingCard
    },
    remoteTagNameGroupByName: (state) => (name) => {
      return state.remoteTagNameGroups.find(group => group.name === name)
    }
  },

  modules: {
    api,
    broadcast,
    history,
    currentUser,
    currentSpace,
    upload
  },
  plugins: [websocket()]
})
