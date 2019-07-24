import Vue from 'vue'
import Vuex from 'vuex'
import utils from '@/utils.js'
import randomColor from 'randomcolor'
import nanoid from 'nanoid'
import _ from 'lodash'

Vue.use(Vuex)

const currentUser = {
  namespaced: true,
  state: {
    id: 1,
    color: randomColor({ luminosity: 'light' }),
    name: undefined
  },
  getters: {
    isCurrentUser: (state) => (userId) => {
      return Boolean(state.id === userId)
    }
    // isMember (state, getters, rootState) {
    //   const inCurrentSpace = rootState.currentSpace.users.some(user => {
    //     return user.id === state.id
    //   })
    //   if (inCurrentSpace) {
    //     return true
    //   } else { return false }
    // }
  },
  mutations: {
    updateColor: (state, newColor) => {
      state.color = newColor
    },
    updateName: (state, newName) => {
      state.name = newName
    }
  }
}

const currentSpace = {
  namespaced: true,
  state: {
    // users: [
    //   {
    //     id: '1',
    //     color: 'cyan'
    //     name: undefined
    //   },
    //   {
    //     id: '2',
    //     color: 'pink'
    //     name: 'maya'
    //   }
    // ],
    cards: [
      {
        id: '1',
        x: 80,
        y: 80,
        z: 0,
        name: 'Kinopio is a Collaborative Thinking Tool',
        cardDetailsVisible: false,
        archived: false
      },
      {
        id: '2',
        x: 20,
        y: 250,
        z: 1,
        name: 'connect me!',
        cardDetailsVisible: false,
        archived: false
      },
      {
        id: '3',
        x: 550,
        y: 150,
        z: 2,
        name: 'click and drag me',
        cardDetailsVisible: false,
        archived: false
      },
      {
        id: '4',
        x: 300,
        y: 400,
        z: 3,
        name: 'eat your vegetables',
        cardDetailsVisible: false,
        archived: false
      },
      {
        id: '5',
        x: 280,
        y: 280,
        z: 4,
        name: 'hello space and time',
        cardDetailsVisible: false,
        archived: false
      }
    ],
    connections: [
      // {
      //   id: '1',
      //   connectionTypeId: '123',
      //   startCardId: '1',
      //   endCardId: '2',
      //   path: ''
      //   connectionDetailsVisible: false,
      // }
    ],
    connectionTypes: [
      // {
      //   id: '123',
      //   name: 'connection',
      //   color: 'pink'
      // }
    ]
  },

  mutations: {
    // cards
    incrementCardZ: (state, cardId) => {
      state.cards.map((card, index) => {
        card.z = index
        if (card.id === cardId) {
          card.z = state.cards.length + 1
        }
      })
    },
    cardDetailsVisible: (state, cardId) => {
      state.cards.map(card => {
        if (card.id === cardId) {
          card.cardDetailsVisible = true
        }
      })
    },
    updateCardDetails: (state, { type, value, cardId }) => {
      utils.typeCheck(type, 'string')
      state.cards.map(card => {
        if (card.id === cardId) {
          card[type] = value
        }
      })
    },
    moveCard: (state, { cardId, delta }) => {
      const maxOffset = 0
      state.cards.map(card => {
        if (card.id === cardId) {
          card.x += delta.x || 0
          card.y += delta.y || 0
          card.x = Math.max(card.x, maxOffset)
          card.y = Math.max(card.y, maxOffset)
        }
      })
      const connections = state.connections.filter(connection => {
        return (connection.startCardId === cardId || connection.endCardId === cardId)
      })
      connections.forEach(connection => {
        connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
      })
    },
    createCard: (state, card) => {
      state.cards.push(card)
    },
    removeCard: (state, cardId) => {
      const cards = state.cards.filter(card => {
        return card.id !== cardId
      })
      state.cards = cards
    },

    // connections
    addConnection: (state, { connection, connectionType }) => {
      connection.id = nanoid()
      connection.connectionTypeId = connectionType.id
      connection.connectionDetailsVisible = false
      state.connections.push(connection)
    },
    removeConnection: (state, connectionId) => {
      const connections = state.connections.filter(connection => {
        return connection.id !== connectionId
      })
      state.connections = connections
    },
    connectionDetailsVisible: (state, connectionId) => {
      state.connections.map(connection => {
        if (connection.id === connectionId) {
          connection.connectionDetailsVisible = true
        }
      })
    },
    removeConnectionsFromCard: (state, cardId) => {
      const connections = state.connections.filter(connection => {
        const isConnectedToCard = connection.startCardId === cardId || connection.endCardId === cardId
        return !isConnectedToCard
      })
      state.connections = connections
    },

    // connection types
    addConnectionType: (state, { id, name, color }) => {
      const connectionType = {
        id: id || nanoid(),
        name: name || `Connection ${state.connectionTypes.length + 1}`,
        color: color || randomColor({ luminosity: 'light' })
      }
      state.connectionTypes.push(connectionType)
    },
    removeUnusedConnectionTypes: (state) => {
      const connections = state.connections.map(connection => {
        return connection.connectionTypeId
      })
      const usedConnectionTypes = state.connectionTypes.filter(type => {
        return connections.includes(type.id)
      })
      state.connectionTypes = usedConnectionTypes
    },
    updateConnectionTypeName: (state, { connectionTypeId, newName }) => {
      state.connectionTypes.map(type => {
        if (type.id === connectionTypeId) {
          type.name = newName
        }
      })
    },
    updateConnectionTypeColor: (state, { connectionTypeId, newColor }) => {
      state.connectionTypes.map(type => {
        if (type.id === connectionTypeId) {
          type.color = newColor
        }
      })
    },
    changeConnectionType: (state, { connectionId, connectionTypeId }) => {
      state.connections.map(connection => {
        if (connection.id === connectionId) {
          connection.connectionTypeId = connectionTypeId
        }
      })
    }
  },

  actions: {
    // cards
    addCard: (context, { position, contents }) => {
      utils.typeCheck(position, 'object')
      utils.typeCheck(contents, 'object', true)
      let card = {
        id: nanoid(),
        x: position.x,
        y: position.y,
        name: '',
        cardDetailsVisible: false,
        archived: false
      }
      if (utils.objectHasKeys(contents)) {
        card = utils.updateObject(card, contents)
      } else {
        card.cardDetailsVisible = true
      }
      context.commit('createCard', card)
      context.commit('incrementCardZ', card.id)
    },
    removeCard: (context, cardId) => {
      context.commit('removeCard', cardId)
      context.commit('removeConnectionsFromCard', cardId)
      context.commit('generateCardMap', null, { root: true })
    },
    dragCards: (context, { endCursor, prevCursor, delta }) => {
      const multipleCardsSelected = context.rootState.multipleCardsSelected
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      const cards = context.rootState.currentSpace.cards
      delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      if (multipleCardsSelected.length) {
        cards.map(card => {
          if (multipleCardsSelected.includes(card.id)) {
            context.commit('moveCard', { cardId: card.id, delta })
          }
        })
      } else {
        context.commit('moveCard', { cardId: currentDraggingCardId, delta })
      }
    },
    incrementSelectedCardsZ: (context) => {
      const multipleCardsSelected = context.rootState.multipleCardsSelected
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      const cards = context.state.cards
      if (multipleCardsSelected.length) {
        cards.forEach(cardId => {
          context.commit('incrementCardZ', cardId)
        })
      } else {
        context.commit('incrementCardZ', currentDraggingCardId)
      }
    },

    // connection
    addConnection: (context, { connection, connectionType }) => {
      const connectionAlreadyExists = context.getters.connectionAlreadyExists({
        startCardId: connection.startCardId,
        endCardId: connection.endCardId
      })
      if (!connectionAlreadyExists) {
        context.commit('addConnection', { connection, connectionType })
        context.commit('removeUnusedConnectionTypes')
      }
    },
    removeSelectedConnectionsFromCard: (context, cardId) => {
      const multipleCardsSelected = context.rootState.multipleCardsSelected
      const connections = context.state.connections
      connections.map(connection => {
        const { startCardId, endCardId, id } = connection
        let connectedToSelected = (startCardId === cardId && multipleCardsSelected.includes(endCardId)) || (endCardId === cardId && multipleCardsSelected.includes(startCardId))
        if (connectedToSelected) {
          context.commit('removeConnection', id)
        }
      })
    }
  },

  getters: {
    // connection
    connectionAlreadyExists: (state) => ({ startCardId, endCardId }) => {
      const existing = state.connections.filter(connection => {
        let start = connection.startCardId === startCardId
        let end = connection.endCardId === endCardId
        return start && end
      })
      return Boolean(existing.length)
    },
    cardConnections: (state) => (cardId) => {
      return state.connections.filter(connection => {
        let start = connection.startCardId === cardId
        let end = connection.endCardId === cardId
        return start || end
      })
    },

    // connection types
    connectionTypeById: (state) => (id) => {
      return state.connectionTypes.find(type => type.id === id)
    },
    lastConnectionType: (state) => {
      return _.last(state.connectionTypes)
    },
    cardConnectionTypes: (state, getters) => (cardId) => {
      const connections = getters.cardConnections(cardId)
      const connectionTypeIds = connections.map(connection => connection.connectionTypeId)
      return state.connectionTypes.filter(type => {
        return connectionTypeIds.includes(type.id)
      })
    }
  }
}

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

    // add card
    shouldAddNewCard: false,

    // connecting
    currentConnection: {}, // startCardId, startConnectorRect
    currentConnectionSuccess: {},
    currentConnectionCursorStart: {},
    connectionDetailsIsVisible: false,
    connectionDetailsPosition: {}, // x, y

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
    closeAllDialogs: (state) => {
      state.currentSpace.cards.map(card => {
        card.cardDetailsVisible = false
      })
      state.currentSpace.connections.map(connection => {
        connection.connectionDetailsVisible = false
      })
      state.connectionDetailsIsVisible = false
      state.multipleCardActionsIsVisible = false
    },
    shouldAddNewCard: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.shouldAddNewCard = value
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
    connectionDetailsIsVisible: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.connectionDetailsIsVisible = value
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
