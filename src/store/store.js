import utils from '@/utils.js'
import cache from '@/cache.js'
// store modules
import api from '@/store/api.js'
import broadcast from '@/store/broadcast.js'
import history from '@/store/history.js'
import currentUser from '@/store/currentUser.js'
import currentSpace from '@/store/currentSpace.js'
import upload from '@/store/upload.js'
// store plugins
import websocket from '@/store/plugins/websocket.js'

import Vue from 'vue'
import Vuex from 'vuex'
import nanoid from 'nanoid'
import uniqBy from 'lodash-es/uniqBy'

Vue.use(Vuex)

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {
    pageHeight: 0,
    pageWidth: 0,
    maxPageSizeHeight: 0,
    maxPageSizeWidth: 0,
    viewportHeight: 0,
    viewportWidth: 0,
    isOnline: true,
    isReconnectingToBroadcast: false,
    isBeta: false,
    shouldHideConnectionOutline: false,
    newStuffIsUpdated: false,
    copiedCards: [],
    stripeIsLoaded: false,
    shouldHideFooter: false,
    shouldExplicitlyHideFooter: false,
    isTouchDevice: false,
    cardMap: {},
    cardsCreatedLimit: 100,

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
    currentCardConnections: [],

    // tags
    tagDetailsIsVisible: false,
    tagDetailsIsVisibleFromTagList: false,
    tagDetailsPosition: {}, // x, y
    currentSelectedTag: {},
    remoteTags: [],
    remoteTagsIsFetched: false,

    // links
    linkDetailsIsVisible: false,
    linkDetailsPosition: {}, // x, y
    currentSelectedLink: {},

    // dragging
    currentDraggingCardId: '',
    remoteCardsDragging: [],
    remoteUploadDraggedOverCards: [],
    preventDraggedCardFromShowingDetails: false,

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
    loadJournalSpace: false,

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
    notifyKinopioUpdatesAreAvailable: false,

    // notifications with position
    notificationsWithPosition: [],

    // filters
    filteredConnectionTypeIds: [],
    filteredFrameIds: [],
    filteredTagNames: [],

    // session data
    otherUsers: [], // { id, name color }
    otherSpaces: [], // { {user}, name, id }
    otherTags: []
  },
  mutations: {
    updatePageSizes: (state) => {
      const body = document.body
      const html = document.documentElement
      state.pageWidth = Math.max(state.maxPageSizeWidth, body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      state.pageHeight = Math.max(state.maxPageSizeHeight, body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
      state.viewportWidth = utils.visualViewport().width
      state.viewportHeight = utils.visualViewport().height
    },
    updateMaxPageSizes: (state, { width, height }) => {
      state.maxPageSizeWidth = width
      state.maxPageSizeHeight = height
    },
    updateSpacePageSize: (state, { maxX, maxY }) => {
      const extraScrollArea = 160
      state.pageWidth = maxX + extraScrollArea
      state.pageHeight = maxY + extraScrollArea
    },

    pageHeight: (state, height) => {
      utils.typeCheck({ value: height, type: 'number', origin: 'pageHeight' })
      state.pageHeight = height
    },
    pageWidth: (state, width) => {
      utils.typeCheck({ value: width, type: 'number', origin: 'pageWidth' })
      state.pageWidth = width
    },
    closeAllDialogs: (state) => {
      state.multipleSelectedActionsIsVisible = false
      state.cardDetailsIsVisibleForCardId = ''
      state.connectionDetailsIsVisibleForConnectionId = ''
      state.tagDetailsIsVisible = false
      state.tagDetailsIsVisibleFromTagList = false
      state.currentSelectedTag = {}
      state.linkDetailsIsVisible = false
      state.currentSelectedLink = {}
    },
    isOnline: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isOnline' })
      state.isOnline = value
    },
    isReconnectingToBroadcast: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isReconnectingToBroadcast' })
      state.isReconnectingToBroadcast = value
    },
    isBeta: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isBeta' })
      state.isBeta = value
    },
    loadJournalSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'loadJournalSpace' })
      state.loadJournalSpace = value
    },
    shouldHideConnectionOutline: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldHideConnectionOutline' })
      state.shouldHideConnectionOutline = value
    },
    newStuffIsUpdated: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'newStuffIsUpdated' })
      state.newStuffIsUpdated = value
    },
    stripeIsLoaded: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'stripeIsLoaded' })
      state.stripeIsLoaded = value
    },
    shouldHideFooter: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldHideFooter' })
      state.shouldHideFooter = value
    },
    shouldExplicitlyHideFooter: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldExplicitlyHideFooter' })
      state.shouldExplicitlyHideFooter = value
    },
    isTouchDevice: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isTouchDevice' })
      state.isTouchDevice = value
    },
    updateCardMap: (state) => {
      state.cardMap = utils.cardMap()
    },
    resetPasswordApiKey: (state, apiKey) => {
      utils.typeCheck({ value: apiKey, type: 'string', origin: 'resetPasswordApiKey' })
      state.resetPasswordApiKey = apiKey
    },
    passwordResetIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'passwordResetIsVisible' })
      state.passwordResetIsVisible = value
    },
    importArenaChannelIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'importArenaChannelIsVisible' })
      state.importArenaChannelIsVisible = value
    },
    isAuthenticatingWithArena: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isAuthenticatingWithArena' })
      state.isAuthenticatingWithArena = value
    },
    triggerSpaceDetailsVisible: () => {},
    triggerFocusSpaceDetailsFilter: () => {},
    triggerFocusSpaceDetailsName: () => {},
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
    triggerUpdateNotifications: () => {},

    // Cards

    shouldAddCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldAddCard' })
      state.shouldAddCard = value
    },
    currentUserIsHoveringOverConnectionId: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'currentUserIsHoveringOverConnectionId' })
      state.currentUserIsHoveringOverConnectionId = connectionId
    },
    cardDetailsIsVisibleForCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'cardDetailsIsVisibleForCardId' })
      state.cardDetailsIsVisibleForCardId = cardId
    },
    parentCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'parentCardId' })
      state.parentCardId = cardId
    },
    childCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'childCardId' })
      state.childCardId = cardId
    },
    addToCopiedCards: (state, cards) => {
      utils.typeCheck({ value: cards, type: 'array', origin: 'addToCopiedCards' })
      cards = cards.map(card => {
        card = utils.clone(card)
        return card
      })
      state.copiedCards = cards
    },
    updateRemoteCardDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'updateRemoteCardDetailsVisible' })
      delete update.type
      let cardDetailsVisible = utils.clone(state.remoteCardDetailsVisible)
      cardDetailsVisible = cardDetailsVisible.filter(card => card.id !== update.cardId) || []
      cardDetailsVisible.push(update)
      state.remoteCardDetailsVisible = cardDetailsVisible
    },
    clearRemoteCardDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteCardDetailsVisible' })
      state.remoteCardDetailsVisible = state.remoteCardDetailsVisible.filter(card => card.userId !== update.userId) || []
    },

    // Connecting

    currentUserIsDrawingConnection: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsDrawingConnection' })
      state.currentUserIsDrawingConnection = value
    },
    currentConnectionSuccess: (state, object) => {
      utils.typeCheck({ value: object, type: 'object', allowUndefined: true, origin: 'currentConnectionSuccess' })
      state.currentConnectionSuccess = object
    },
    currentConnectionCursorStart: (state, object) => {
      utils.typeCheck({ value: object, type: 'object', origin: 'currentConnectionCursorStart' })
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
    updateCurrentCardConnections: (state, connections) => {
      connections = connections || []
      connections = connections.map(connection => connection.id)
      state.currentCardConnections = connections
    },

    // Painting

    currentUserIsPainting: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsPainting' })
      state.currentUserIsPainting = value
    },
    currentUserIsPaintingLocked: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsPaintingLocked' })
      state.currentUserIsPaintingLocked = value
    },

    // Dragging

    currentUserIsDraggingCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'currentUserIsDraggingCard' })
      state.currentUserIsDraggingCard = value
    },
    preventDraggedCardFromShowingDetails: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'preventDraggedCardFromShowingDetails' })
      state.preventDraggedCardFromShowingDetails = value
    },
    currentDraggingCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'currentDraggingCardId' })
      state.currentDraggingCardId = cardId
    },
    addToRemoteCardsDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteCardsDragging' })
      delete update.type
      let cards = utils.clone(state.remoteCardsDragging)
      cards = cards.filter(card => card.userId !== update.userId) || []
      cards.push(update)
      state.remoteCardsDragging = cards
    },
    clearRemoteCardsDragging: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteCardsDragging' })
      state.remoteCardsDragging = state.remoteCardsDragging.filter(card => card.userId !== update.userId)
    },
    addToRemoteUploadDraggedOverCards: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteUploadDraggedOverCards' })
      delete update.type
      let cards = utils.clone(state.remoteUploadDraggedOverCards)
      cards = cards.filter(card => card.userId !== update.userId) || []
      cards.push(update)
      state.remoteUploadDraggedOverCards = cards
    },
    clearRemoteUploadDraggedOverCards: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteUploadDraggedOverCards' })
      state.remoteUploadDraggedOverCards = state.remoteUploadDraggedOverCards.filter(card => card.userId !== update.userId)
    },

    // Tag Details

    tagDetailsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'tagDetailsIsVisible' })
      state.tagDetailsIsVisible = value
    },
    tagDetailsIsVisibleFromTagList: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'tagDetailsIsVisibleFromTagList' })
      state.tagDetailsIsVisibleFromTagList = value
    },
    tagDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'tagDetailsPosition' })
      state.tagDetailsPosition = position
    },
    currentSelectedTag: (state, tag) => {
      utils.typeCheck({ value: tag, type: 'object', origin: 'currentSelectedTag' })
      state.currentSelectedTag = tag
    },
    remoteTags: (state, tags) => {
      utils.typeCheck({ value: tags, type: 'array', origin: 'remoteTags' })
      state.remoteTags = tags
    },
    remoteTagsIsFetched: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'remoteTagsIsFetched' })
      state.remoteTagsIsFetched = value
    },

    // Link Details

    linkDetailsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'linkDetailsIsVisible' })
      state.linkDetailsIsVisible = value
    },
    linkDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'linkDetailsPosition' })
      state.linkDetailsPosition = position
    },
    currentSelectedLink: (state, link) => {
      utils.typeCheck({ value: link, type: 'object', origin: 'currentSelectedLink' })
      state.currentSelectedLink = link
    },

    // Connection Details

    connectionDetailsIsVisibleForConnectionId: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'connectionDetailsIsVisibleForConnectionId' })
      state.connectionDetailsIsVisibleForConnectionId = connectionId
    },
    currentConnectionColor: (state, color) => {
      utils.typeCheck({ value: color, type: 'string', origin: 'currentConnectionColor' })
      state.currentConnectionColor = color
    },
    connectionDetailsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'connectionDetailsPosition' })
      state.connectionDetailsPosition = position
    },
    triggeredDrawConnectionFrame: (state, cursor) => {
      state.triggeredDrawConnectionFrame = cursor
    },
    addToRemoteConnectionDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteConnectionDetailsVisible' })
      delete update.type
      let connections = utils.clone(state.remoteConnectionDetailsVisible)
      connections = connections.filter(connection => connection.userId !== update.userId) || []
      connections.push(update)
      state.remoteConnectionDetailsVisible = connections
    },
    clearRemoteConnectionDetailsVisible: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteConnectionDetailsVisible' })
      state.remoteConnectionDetailsVisible = state.remoteConnectionDetailsVisible.filter(connection => connection.userId !== update.userId)
    },

    // Multiple Selection

    multipleSelectedActionsIsVisible: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'multipleSelectedActionsIsVisible' })
      state.multipleSelectedActionsIsVisible = value
    },
    multipleSelectedActionsPosition: (state, position) => {
      utils.typeCheck({ value: position, type: 'object', origin: 'multipleSelectedActionsPosition' })
      state.multipleSelectedActionsPosition = position
    },
    addToMultipleCardsSelected: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'addToMultipleCardsSelected' })
      state.multipleCardsSelectedIds.push(cardId)
    },
    addToMultipleConnectionsSelected: (state, connectionId) => {
      state.multipleConnectionsSelectedIds.push(connectionId)
    },
    removeFromMultipleConnectionsSelected: (state, connectionId) => {
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'removeFromMultipleConnectionsSelected' })
      state.multipleConnectionsSelectedIds = state.multipleConnectionsSelectedIds.filter(id => {
        return id !== connectionId
      })
    },
    clearMultipleSelected: (state) => {
      state.multipleCardsSelectedIds = []
      state.multipleConnectionsSelectedIds = []
    },
    multipleCardsSelectedIds: (state, cardIds) => {
      utils.typeCheck({ value: cardIds, type: 'array', origin: 'multipleCardsSelectedIds' })
      state.multipleCardsSelectedIds = cardIds
    },
    multipleConnectionsSelectedIds: (state, connectionIds) => {
      utils.typeCheck({ value: connectionIds, type: 'array', origin: 'multipleConnectionsSelectedIds' })
      state.multipleConnectionsSelectedIds = connectionIds
    },
    addToRemoteCardsSelected: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteCardsSelected' })
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
      utils.typeCheck({ value: update, type: 'object', origin: 'addToRemoteConnectionsSelected' })
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
      utils.typeCheck({ value: update, type: 'object', origin: 'clearRemoteMultipleSelected' })
      const user = update.user || update.updates.user
      state.remoteCardsSelected = state.remoteCardsSelected.filter(card => card.userId !== user.id)
      state.remoteConnectionsSelected = state.remoteConnectionsSelected.filter(connection => connection.userId !== user.id)
    },

    // Loading

    isLoadingSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isLoadingSpace' })
      state.isLoadingSpace = value
    },
    isJoiningSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isJoiningSpace' })
      state.isJoiningSpace = value
    },
    addToSpaceCollaboratorKeys: (state, spaceCollaboratorKey) => {
      utils.typeCheck({ value: spaceCollaboratorKey, type: 'object', origin: 'addToSpaceCollaboratorKeys' })
      state.spaceCollaboratorKeys.push(spaceCollaboratorKey) // { spaceId, collaboratorKey }
    },
    updateRemotePendingUploads: (state, update) => {
      utils.typeCheck({ value: update, type: 'object', origin: 'updateRemotePendingUploads' })
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
      utils.typeCheck({ value, type: 'boolean', origin: 'hasRestoredFavorites' })
      state.hasRestoredFavorites = value
    },
    loadSpaceShowDetailsForCardId: (state, cardId) => {
      utils.typeCheck({ value: cardId, type: 'string', origin: 'loadSpaceShowDetailsForCardId' })
      state.loadSpaceShowDetailsForCardId = cardId
    },
    spaceUrlToLoad: (state, spaceUrl) => {
      utils.typeCheck({ value: spaceUrl, type: 'string', origin: 'spaceUrlToLoad' })
      state.spaceUrlToLoad = spaceUrl
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
      state.notifyConnectionError = false
      state.notifyServerCouldNotSave = false
      state.notifySignUpToEditSpace = false
      state.notifySpaceIsOpenAndEditable = false
      state.notifyCardsCreatedIsNearLimit = false
      state.notifyCardsCreatedIsOverLimit = false
      state.notificationsWithPosition = []
    },
    notifySpaceNotFound: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifySpaceNotFound' })
      state.notifySpaceNotFound = value
    },
    notifyConnectionError: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyConnectionError' })
      state.notifyConnectionError = value
    },
    notifyServerCouldNotSave: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyServerCouldNotSave' })
      state.notifyServerCouldNotSave = value
    },
    notifySpaceIsRemoved: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifySpaceIsRemoved' })
      state.notifySpaceIsRemoved = value
    },
    notifyNewUser: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyNewUser' })
      state.notifyNewUser = value
    },
    notifySignUpToEditSpace: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifySignUpToEditSpace' })
      state.notifySignUpToEditSpace = value
    },
    notifySpaceIsOpenAndEditable: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifySpaceIsOpenAndEditable' })
      state.notifySpaceIsOpenAndEditable = value
    },
    notifyCardsCreatedIsNearLimit: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyCardsCreatedIsNearLimit' })
      state.notifyCardsCreatedIsNearLimit = value
    },
    notifyCardsCreatedIsOverLimit: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyCardsCreatedIsOverLimit' })
      state.notifyCardsCreatedIsOverLimit = value
      if (value === true) {
        state.notifyCardsCreatedIsNearLimit = false
      }
    },
    notifyKinopioUpdatesAreAvailable: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'notifyKinopioUpdatesAreAvailable' })
      state.notifyKinopioUpdatesAreAvailable = value
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
      utils.typeCheck({ value: id, type: 'string', origin: 'addToFilteredConnectionTypeId' })
      state.filteredConnectionTypeIds.push(id)
    },
    removeFromFilteredConnectionTypeId: (state, id) => {
      utils.typeCheck({ value: id, type: 'string', origin: 'addToFilteredConnectionTypeId' })
      state.filteredConnectionTypeIds = state.filteredConnectionTypeIds.filter(typeId => typeId !== id)
    },
    addToFilteredFrameIds: (state, id) => {
      utils.typeCheck({ value: id, type: 'number', origin: 'addToFilteredFrameIds' })
      state.filteredFrameIds.push(id)
    },
    removeFromFilteredFrameIds: (state, id) => {
      utils.typeCheck({ value: id, type: 'number', origin: 'removeFromFilteredFrameIds' })
      state.filteredFrameIds = state.filteredFrameIds.filter(frameId => frameId !== id)
    },
    addToFilteredTagNames: (state, name) => {
      utils.typeCheck({ value: name, type: 'string', origin: 'addToFilteredTagNames' })
      state.filteredTagNames.push(name)
    },
    removeFromFilteredTagNames: (state, name) => {
      utils.typeCheck({ value: name, type: 'string', origin: 'removeFromFilteredTagNames' })
      state.filteredTagNames = state.filteredTagNames.filter(tagName => tagName !== name)
    },

    // Session Data

    updateOtherUsers: (state, updatedUser) => {
      if (!updatedUser) { return }
      utils.typeCheck({ value: updatedUser, type: 'object', origin: 'updateOtherUsers' })
      let users = utils.clone(state.otherUsers)
      users = users.filter(Boolean)
      users = users.filter(user => {
        if (user.id !== updatedUser.id) {
          return user
        }
      })
      users.push(updatedUser)
      state.otherUsers = users
    },
    updateOtherSpaces: (state, updatedSpace) => {
      utils.typeCheck({ value: updatedSpace, type: 'object', origin: 'updateOtherSpaces' })
      let spaces = utils.clone(state.otherSpaces)
      spaces = spaces.filter(space => {
        if (space.id !== updatedSpace.id) {
          return space
        }
      })
      spaces.push(updatedSpace)
      state.otherSpaces = spaces
    },
    otherTags: (state, remoteTags) => {
      remoteTags = uniqBy(remoteTags, 'name')
      state.otherTags = remoteTags
    }
  },

  actions: {
    updateSpaceAndCardUrlToLoad: (context, path) => {
      const matches = utils.spaceAndCardIdFromUrl(path)
      if (matches.cardId) {
        context.commit('loadSpaceShowDetailsForCardId', matches.cardId)
      }
      context.commit('spaceUrlToLoad', matches.spaceUrl)
    },

    updatePageSizes: (context) => {
      const paddingX = Math.min(400, (utils.visualViewport().width / 4) * 3) + 100
      const paddingY = Math.min(400, (utils.visualViewport().height / 4) * 3)
      const cards = utils.clone(context.rootState.currentSpace.cards)
      if (cards.length) {
        const xPositions = Array.from(cards, card => card.x)
        const yPositions = Array.from(cards, card => card.y)
        const x = Math.max(...xPositions)
        const y = Math.max(...yPositions)
        context.commit('updateMaxPageSizes', {
          width: x + paddingX,
          height: y + paddingY
        })
      }
      context.commit('updatePageSizes')
    },
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
      context.commit('broadcast/updateUser', { user: utils.userMeta(user, space), type: 'updateUserPresence' }, { root: true })
      context.commit('broadcast/updateStore', { updates: { userId: user.id }, type: 'clearRemoteCardDetailsVisible' })
      context.commit('broadcast/updateStore', { updates: { userId: user.id }, type: 'clearRemoteConnectionDetailsVisible' })
    },
    updateSpacePageSize: (context) => {
      let maxX = 0
      let maxY = 0
      context.commit('updateCardMap')
      context.state.cardMap.forEach(card => {
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
      utils.typeCheck({ value: cardId, type: 'string', origin: 'addToMultipleCardsSelected' })
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
      utils.typeCheck({ value: connectionId, type: 'string', origin: 'addToMultipleConnectionsSelected' })
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
    otherUserById: (state, getters) => (userId) => {
      const otherUsers = state.otherUsers.filter(Boolean)
      const user = otherUsers.find(otherUser => otherUser.id === userId)
      return user
    },
    otherSpaceById: (state, getters) => (spaceId) => {
      const otherSpaces = state.otherSpaces.filter(Boolean)
      const space = otherSpaces.find(otherSpace => otherSpace.id === spaceId)
      return space
    },
    cachedOrOtherSpaceById: (state, getters) => (spaceId) => {
      const cachedSpace = cache.space(spaceId)
      if (utils.objectHasKeys(cachedSpace)) {
        return cachedSpace
      } else {
        return getters.otherSpaceById(spaceId)
      }
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
