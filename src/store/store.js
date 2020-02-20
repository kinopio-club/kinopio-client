import Vue from 'vue'
import Vuex from 'vuex'
import utils from '@/utils.js'
import nanoid from 'nanoid'

// store modules
import api from '@/store/api.js'
import currentUser from '@/store/currentUser.js'
import currentSpace from '@/store/currentSpace.js'

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
    initialExtraSize: 160, // TODO apply extra size each time you change spaces

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

    // connecting
    currentConnection: {}, // startCardId, startConnectorRect
    currentConnectionSuccess: {},
    currentConnectionCursorStart: {},
    connectionDetailsPosition: {}, // x, y
    connectionDetailsIsVisibleForConnectionId: '',

    // dragging
    currentDraggingCardId: '',
    preventDraggedCardFromShowingDetails: false,
    currentCardsDragging: [],
    currentConnectionsDragging: [],

    // multiple selection
    multipleSelectedActionsIsVisible: false,
    multipleSelectedActionsPosition: {},
    multipleCardsSelectedIds: [],
    cardMap: [],
    multipleConnectionsSelectedIds: [],

    // loading
    isLoadingSpace: false,
    spaceUrlToLoad: '',
    isLoadingUserFavorites: false,

    // notifications
    notifications: [],
    notifyReadOnly: false,
    notifySpaceNotFound: false,
    notifyConnectionError: false,
    notifySpaceIsRemoved: false,
    notifyNewUser: false,

    // filters
    filteredConnectionTypeIds: [],
    filteredFrameIds: []
  },
  mutations: {
    updatePageSizes: (state) => {
      const body = document.body
      const html = document.documentElement
      state.pageWidth = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      state.pageHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
      state.pageHeight = state.pageHeight + state.initialExtraSize
      state.pageWidth = state.pageWidth + state.initialExtraSize
      state.initialExtraSize = 0
      if (window.visualViewport) {
        state.viewportWidth = window.visualViewport.width
        state.viewportHeight = window.visualViewport.height
      } else {
        // firefox fallback
        state.viewportWidth = document.documentElement.clientWidth
        state.viewportHeight = document.documentElement.clientHeight
      }
    },
    pageHeight: (state, height) => {
      utils.typeCheck(height, 'number')
      state.pageHeight = height
    },
    pageWidth: (state, width) => {
      utils.typeCheck(width, 'number')
      state.pageWidth = width
    },
    shouldAddCard: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.shouldAddCard = value
    },
    currentUserIsHoveringOverConnectionId: (state, connectionId) => {
      utils.typeCheck(connectionId, 'string')
      state.currentUserIsHoveringOverConnectionId = connectionId
    },
    cardDetailsIsVisibleForCardId: (state, cardId) => {
      utils.typeCheck(cardId, 'string')
      state.cardDetailsIsVisibleForCardId = cardId
    },
    parentCardId: (state, cardId) => {
      utils.typeCheck(cardId, 'string')
      state.parentCardId = cardId
    },
    closeAllDialogs: (state) => {
      state.multipleSelectedActionsIsVisible = false
      state.cardDetailsIsVisibleForCardId = ''
      state.connectionDetailsIsVisibleForConnectionId = ''
    },
    isOnline: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.isOnline = value
    },
    isBeta: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.isBeta = value
    },
    resetPasswordApiKey: (state, apiKey) => {
      utils.typeCheck(apiKey, 'string')
      state.resetPasswordApiKey = apiKey
    },
    passwordResetIsVisible: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.passwordResetIsVisible = value
    },
    importArenaChannelIsVisible: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.importArenaChannelIsVisible = value
    },
    isAuthenticatingWithArena: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.isAuthenticatingWithArena = value
    },
    triggerSpaceDetailsVisible: () => {},
    triggerSignUpOrInIsVisible: () => {},
    triggerArenaAuthenticationError: () => {},
    triggerKeyboardShortcutsIsVisible: () => {},
    notifyReadOnlyJiggle: () => {},

    // connecting
    currentUserIsDrawingConnection: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.currentUserIsDrawingConnection = value
    },
    currentConnectionSuccess: (state, object) => {
      utils.typeCheck(object, 'object', true)
      state.currentConnectionSuccess = object
    },
    currentConnectionCursorStart: (state, object) => {
      utils.typeCheck(object, 'object')
      state.currentConnectionCursorStart = object
    },
    currentConnection: (state, updates) => {
      let object = state.currentConnection
      object = utils.updateObject(object, updates)
      state.currentConnection = object
    },

    // painting
    currentUserIsPainting: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.currentUserIsPainting = value
    },
    currentUserIsPaintingLocked: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.currentUserIsPaintingLocked = value
    },

    // dragging
    currentUserIsDraggingCard: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.currentUserIsDraggingCard = value
    },
    preventDraggedCardFromShowingDetails: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.preventDraggedCardFromShowingDetails = value
    },
    currentDraggingCardId: (state, cardId) => {
      utils.typeCheck(cardId, 'string')
      state.currentDraggingCardId = cardId
      if (state.multipleCardsSelectedIds.length) { return }
      // ♨️ set up currentConnectionsDragging
      let connections = utils.clone(state.currentSpace.connections)
      connections = connections.filter(connection => {
        return (connection.startCardId === cardId || connection.endCardId === cardId)
      })
      state.currentConnectionsDragging = connections
    },

    // connection details
    connectionDetailsIsVisibleForConnectionId: (state, connectionId) => {
      utils.typeCheck(connectionId, 'string')
      state.connectionDetailsIsVisibleForConnectionId = connectionId
    },
    connectionDetailsPosition: (state, position) => {
      utils.typeCheck(position, 'object')
      state.connectionDetailsPosition = position
    },

    // multiple selection
    multipleSelectedActionsIsVisible: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.multipleSelectedActionsIsVisible = value
    },
    generateCardMap: (state) => {
      const cards = state.currentSpace.cards
      state.cardMap = []
      cards.forEach(card => {
        const element = document.querySelector(`article [data-card-id="${card.id}"]`)
        const rect = element.getBoundingClientRect()
        state.cardMap.push({
          cardId: card.id,
          x: card.x,
          y: card.y,
          width: rect.width,
          height: rect.height
        })
      })
    },
    multipleSelectedActionsPosition: (state, position) => {
      utils.typeCheck(position, 'object')
      state.multipleSelectedActionsPosition = position
    },
    addToMultipleCardsSelected: (state, cardId) => {
      utils.typeCheck(cardId, 'string')
      if (state.multipleCardsSelectedIds.includes(cardId)) { return }
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
      utils.typeCheck(connectionId, 'string')
      if (!state.multipleConnectionsSelectedIds.includes(connectionId)) {
        state.multipleConnectionsSelectedIds.push(connectionId)
      }
    },
    clearMultipleSelected: (state) => {
      state.multipleCardsSelectedIds = []
      state.multipleConnectionsSelectedIds = []
    },

    // loading
    isLoadingSpace: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.isLoadingSpace = value
    },
    spaceUrlToLoad: (state, spaceUrl) => {
      utils.typeCheck(spaceUrl, 'string')
      state.spaceUrlToLoad = spaceUrl
    },
    isLoadingUserFavorites: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.isLoadingUserFavorites = value
    },

    // notifications
    addNotification: (state, notification) => {
      notification.id = nanoid()
      state.notifications.push(notification)
    },
    removeNotification: (state) => {
      state.notifications.shift()
    },
    notifyReadOnly: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.notifyReadOnly = value
      if (state.notifySpaceNotFound) {
        state.notifyReadOnly = false
      }
    },
    notifySpaceNotFound: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.notifySpaceNotFound = value
    },
    notifyConnectionError: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.notifyConnectionError = value
    },
    notifySpaceIsRemoved: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.notifySpaceIsRemoved = value
    },
    notifyNewUser: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.notifyNewUser = value
    },

    // filters
    clearAllFilters: (state) => {
      state.filteredConnectionTypeIds = []
      state.filteredFrameIds = []
    },
    addToFilteredConnectionTypeId: (state, id) => {
      utils.typeCheck(id, 'string')
      state.filteredConnectionTypeIds.push(id)
    },
    removeFromFilteredConnectionTypeId: (state, id) => {
      utils.typeCheck(id, 'string')
      state.filteredConnectionTypeIds = state.filteredConnectionTypeIds.filter(typeId => typeId !== id)
    },
    addToFilteredFrameIds: (state, id) => {
      utils.typeCheck(id, 'number')
      state.filteredFrameIds.push(id)
    },
    removeFromFilteredFrameIds: (state, id) => {
      utils.typeCheck(id, 'number')
      state.filteredFrameIds = state.filteredFrameIds.filter(frameId => frameId !== id)
    }
  },

  getters: {
    shouldScrollAtEdges (state, getters) {
      const isPaintingLocked = state.currentUserIsPaintingLocked
      const isDrawingConnection = state.currentUserIsDrawingConnection
      const isDraggingCard = state.currentUserIsDraggingCard
      return isPaintingLocked || isDrawingConnection || isDraggingCard
    }
  },

  modules: {
    api,
    currentUser,
    currentSpace
  }
})
