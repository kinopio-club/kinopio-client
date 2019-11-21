import Vue from 'vue'
import Vuex from 'vuex'
import utils from '@/utils.js'
import nanoid from 'nanoid'

// store modules
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
    notifications: [],

    // current user state
    currentUserIsDrawingConnection: false,
    currentUserIsPainting: false,
    currentUserIsPaintingLocked: false,
    currentUserIsDraggingCard: false,

    // cards
    shouldAddNewCard: false,
    cardDetailsIsVisibleForCardId: '',

    // connecting
    currentConnection: {}, // startCardId, startConnectorRect
    currentConnectionSuccess: {},
    currentConnectionCursorStart: {},
    connectionDetailsPosition: {}, // x, y
    connectionDetailsIsVisibleForConnectionId: '',

    // dragging
    currentDraggingCardId: '',
    preventDraggedCardFromShowingDetails: false,

    // multiple selection
    multipleSelectedActionsIsVisible: false,
    multipleSelectedActionsPosition: {},
    multipleCardsSelectedIds: [],
    cardMap: [],
    multipleConnectionsSelectedIds: [],

    // loading
    isLoadingSpace: false
  },

  mutations: {
    updatePageSizes: (state) => {
      const body = document.body
      const html = document.documentElement
      state.pageWidth = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)
      state.pageHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
      state.viewportWidth = document.documentElement.clientWidth
      state.viewportHeight = document.documentElement.clientHeight
    },
    pageHeight: (state, height) => {
      utils.typeCheck(height, 'number')
      state.pageHeight = height
    },
    pageWidth: (state, width) => {
      utils.typeCheck(width, 'number')
      state.pageWidth = width
    },
    shouldAddNewCard: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.shouldAddNewCard = value
    },
    cardDetailsIsVisibleForCardId: (state, cardId) => {
      utils.typeCheck(cardId, 'string')
      state.cardDetailsIsVisibleForCardId = cardId
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
    triggerSpaceDetailsVisible: () => {},
    addNotification: (state, notification) => {
      notification.id = nanoid()
      state.notifications.push(notification)
    },
    removeNotification: (state) => {
      state.notifications.shift()
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
      if (!state.multipleCardsSelectedIds.includes(cardId)) {
        state.multipleCardsSelectedIds.push(cardId)
      }
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
    currentUser,
    currentSpace
  }
})
