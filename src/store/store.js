import Vue from 'vue'
import Vuex from 'vuex'
import utils from '@/utils.js'
import nanoid from 'nanoid'

// store modules
import api from '@/store/api.js'
import history from '@/store/history.js'
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
    shouldHideConnectionOutline: false,
    newStuffIsUpdated: false,
    copiedCards: [],

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

    // connecting
    currentConnection: {}, // startCardId, startConnectorRect
    currentConnectionSuccess: {},
    currentConnectionCursorStart: {},
    connectionDetailsPosition: {}, // x, y
    connectionDetailsIsVisibleForConnectionId: '',
    currentConnectionColor: '',

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
    triggeredPaintFramePosition: {},

    // loading
    isLoadingSpace: false,
    spaceUrlToLoad: '',
    anonymousCollaboratorKey: '',

    // notifications
    notifications: [],
    notifyReadOnly: false,
    notifySpaceNotFound: false,
    notifyConnectionError: false,
    notifySpaceIsRemoved: false,
    notifyNewUser: false,
    notifySignUpToEditSpace: false,
    notifySpaceIsOpenAndEditable: false,
    notifyAccessFavorites: false,

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
      if (window.visualViewport) {
        state.viewportWidth = window.visualViewport.width
        state.viewportHeight = window.visualViewport.height
      } else {
        // firefox fallback
        state.viewportWidth = document.documentElement.clientWidth
        state.viewportHeight = document.documentElement.clientHeight
      }
    },
    updateSpacePageSize: (state, { maxX, maxY }) => {
      const extraScrollArea = 160
      state.pageWidth = maxX + extraScrollArea
      state.pageHeight = maxY + extraScrollArea
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
    childCardId: (state, cardId) => {
      utils.typeCheck(cardId, 'string')
      state.childCardId = cardId
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
    shouldHideConnectionOutline: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.shouldHideConnectionOutline = value
    },
    newStuffIsUpdated: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.newStuffIsUpdated = value
    },
    addToCopiedCards: (state, cards) => {
      utils.typeCheck(cards, 'array')
      cards = cards.map(card => {
        card = utils.clone(card)
        return card
      })
      state.copiedCards = cards
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
    triggerFavoritesIsVisible: () => {},
    triggerSignUpOrInIsVisible: () => {},
    triggerArenaAuthenticationError: () => {},
    triggerKeyboardShortcutsIsVisible: () => {},
    notifyReadOnlyJiggle: () => {},
    triggerSelectTemplateCategory: () => {},
    triggeredPaintFramePosition: (state, cursor) => {
      state.triggeredPaintFramePosition = cursor
    },

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
    currentConnectionColor: (state, color) => {
      utils.typeCheck(color, 'string')
      state.currentConnectionColor = color
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
    removeFromMultipleConnectionsSelected: (state, connectionId) => {
      utils.typeCheck(connectionId, 'string')
      state.multipleConnectionsSelectedIds = state.multipleConnectionsSelectedIds.filter(id => {
        return id !== connectionId
      })
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
    anonymousCollaboratorKey: (state, value) => {
      utils.typeCheck(value, 'string')
      state.anonymousCollaboratorKey = value
    },

    // notifications
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
      state.notifySignUpToEditSpace = false
      state.notifySpaceIsOpenAndEditable = false
      state.notifyAccessFavorites = false
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
    notifySignUpToEditSpace: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.notifySignUpToEditSpace = value
    },
    notifySpaceIsOpenAndEditable: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.notifySpaceIsOpenAndEditable = value
    },
    notifyAccessFavorites: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.notifyAccessFavorites = value
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

  actions: {
    updateSpacePageSize: (context) => {
      let maxX = 0
      let maxY = 0
      context.commit('generateCardMap')
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
    }
  },

  getters: {
    shouldScrollAtEdges (state, getters) {
      let isPainting
      if (utils.isMobile()) {
        isPainting = state.currentUserIsPaintingLocked
      } else {
        isPainting = state.currentUserIsPainting
      }
      const isDrawingConnection = state.currentUserIsDrawingConnection
      const isDraggingCard = state.currentUserIsDraggingCard
      return isPainting || isDrawingConnection || isDraggingCard
    }
  },

  modules: {
    api,
    history,
    currentUser,
    currentSpace
  }
})
