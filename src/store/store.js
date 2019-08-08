import Vue from 'vue'
import Vuex from 'vuex'
import utils from '@/utils.js'

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

    // current user state
    currentUserIsDrawingConnection: false,
    currentUserIsPainting: false,
    currentUserIsPaintingLocked: false,
    currentUserIsDraggingCard: false,

    // cards
    shouldAddNewCard: false,
    cardDetailsIsVisibleForCard: '', // id

    // connecting
    currentConnection: {}, // startCardId, startConnectorRect
    currentConnectionSuccess: {},
    currentConnectionCursorStart: {},
    connectionDetailsPosition: {}, // x, y
    connectionDetailsIsVisibleForConnection: '', // id

    // dragging
    currentDraggingCardId: '', // id
    preventDraggedCardFromShowingDetails: false,

    // multiple cards
    multipleCardsSelected: [], // ids
    multipleCardActionsIsVisible: false,
    multipleCardActionsPosition: {},
    cardMap: []
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
    cardDetailsIsVisibleForCard: (state, cardId) => {
      utils.typeCheck(cardId, 'string')
      state.cardDetailsIsVisibleForCard = cardId
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
    connectionDetailsIsVisibleForConnection: (state, connectionId) => {
      utils.typeCheck(connectionId, 'string')
      state.connectionDetailsIsVisibleForConnection = connectionId
    },
    connectionDetailsPosition: (state, position) => {
      utils.typeCheck(position, 'object')
      state.connectionDetailsPosition = position
    },

    // multiple cards
    multipleCardsSelected: (state, cards) => {
      utils.typeCheck(cards, 'array')
      state.multipleCardsSelected = cards
    },
    addToMultipleCardsSelected: (state, cardId) => {
      utils.typeCheck(cardId, 'string')
      if (!state.multipleCardsSelected.includes(cardId)) {
        state.multipleCardsSelected.push(cardId)
      }
    },
    multipleCardActionsIsVisible: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.multipleCardActionsIsVisible = value
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
    multipleCardActionsPosition: (state, position) => {
      utils.typeCheck(position, 'object')
      state.multipleCardActionsPosition = position
    },
    closeAllDialogs: (state) => {
      state.multipleCardActionsIsVisible = false
      state.cardDetailsIsVisibleForCard = ''
      state.connectionDetailsIsVisibleForConnection = ''
    }
  },

  actions: {
    updateUserColor: (context, { userId, newColor }) => {
      const isCurrentUser = context.getters['currentUser/isCurrentUser'](userId)
      if (isCurrentUser) {
        context.commit('currentUser/updateColor', newColor)
      }
    },
    updateUserName: (context, { userId, newName }) => {
      const isCurrentUser = context.getters['currentUser/isCurrentUser'](userId)
      if (isCurrentUser) {
        context.commit('currentUser/updateName', newName)
      }
    }
  },

  getters: {
    viewportIsLocked (state, getters) {
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
