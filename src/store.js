import Vue from 'vue'
import Vuex from 'vuex'
import randomColor from 'randomcolor'
import nanoid from 'nanoid'
import _ from 'lodash'

import utils from '@/utils.js'
import cache from '@/cache.js'
import helloSpace from '@/spaces/hello.json'

Vue.use(Vuex)

const currentUser = {
  namespaced: true,
  state: {
    id: nanoid(),
    lastSpace: '',
    color: randomColor({ luminosity: 'light' }),
    name: undefined,
    defaultConnectionTypeId: ''
  },
  getters: {
    isCurrentUser: (state) => (userId) => {
      return Boolean(state.id === userId)
    }
    // isMember: (state, getters, rootState) => {
    //   const inCurrentSpace = rootState.currentSpace.users.find(user => {
    //     return user.id === state.id
    //   })
    //   return Boolean(inCurrentSpace)
    // }
  },
  mutations: {
    updateColor: (state, newColor) => {
      state.color = newColor
      cache.updateUser('color', newColor)
    },
    updateName: (state, newName) => {
      state.name = newName
      cache.updateUser('name', newName)
    },
    updateLastSpace: (state, spaceId) => {
      state.lastSpace = spaceId
      cache.updateUser('lastSpace', spaceId)
    },
    defaultConnectionTypeId: (state, typeId) => {
      state.defaultConnectionTypeId = typeId
      cache.updateUser('defaultConnectionTypeId', typeId)
    },
    restoreUser: (state, user) => {
      Object.keys(user).forEach(item => {
        state[item] = user[item]
      })
    },
    // Added aug 2019, can safely remove this in aug 2020
    updateBetaUserId: (state, newId) => {
      if (state.id === '1') {
        const newId = nanoid()
        state.id = newId
        cache.updateUser('id', newId)
      }
    }
  },
  actions: {
    restoreFromCache: (context) => {
      const cachedUser = cache.user()
      if (utils.objectHasKeys(cachedUser)) {
        context.commit('restoreUser', cachedUser)
        context.commit('updateBetaUserId')
      } else {
        context.dispatch('createNewUser')
      }
    },
    createNewUser: (context) => {
      cache.saveUser(context.state)
    }
  }
}

const currentSpace = {
  namespaced: true,
  state: helloSpace,
  mutations: {
    restoreSpace: (state, newSpace) => {
      const keys = Object.keys(state)
      keys.forEach(key => {
        state[key] = newSpace[key] || []
      })
      console.log('🚃 Restored Space from cache', newSpace)
    },
    // Added aug 2019, can safely remove this in aug 2020
    updateBetaSpace: (state) => {
      if (state.id === '1') {
        const newId = nanoid()
        state.id = newId
        state.name = 'hello-kinopio'
        cache.updateBetaSpaceId(newId)
        cache.updateSpace('name', state.name, state.id)
      }
    },
    updateSpaceId: (state, newId) => {
      state.id = newId
    },

    // users
    addUserToSpace: (state, newUser) => {
      utils.typeCheck(newUser, 'object')
      const userExists = state.users.find(user => {
        return user.id === newUser.id
      })
      if (!userExists) {
        state.users.push(newUser)
        cache.updateSpace('users', state.users, state.id)
      }
    },

    // space name
    updateName: (state, newName) => {
      newName = newName.replace(/([^a-z0-9-]+)/ig, '-') // same regex as glitch project names
      state.name = newName
      cache.updateSpace('name', state.name, state.id)
    },

    // cards
    incrementCardZ: (state, cardId) => {
      state.cards.map((card, index) => {
        card.z = index
        if (card.id === cardId) {
          card.z = state.cards.length + 1
        }
      })
      cache.updateSpace('cards', state.cards, state.id)
    },
    updateCardDetails: (state, { type, value, cardId }) => {
      utils.typeCheck(type, 'string')
      state.cards.map(card => {
        if (card.id === cardId) {
          card[type] = value
        }
      })
      cache.updateSpace('cards', state.cards, state.id)
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
      cache.updateSpace('cards', state.cards, state.id)
    },
    createCard: (state, card) => {
      state.cards.push(card)
      cache.updateSpace('cards', state.cards, state.id)
    },
    removeCard: (state, cardId) => {
      const cards = state.cards.filter(card => {
        return card.id !== cardId
      })
      state.cards = cards
      cache.updateSpace('cards', state.cards, state.id)
    },

    // connections
    updateCardConnections: (state, cardId) => {
      console.log('updateCardConnections')
      const connections = state.connections.filter(connection => {
        return (connection.startCardId === cardId || connection.endCardId === cardId)
      })
      connections.forEach(connection => {
        connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
      })
      cache.updateSpace('connections', state.connections, state.id)
    },
    addConnection: (state, { connection, connectionType }) => {
      connection.id = nanoid()
      connection.connectionTypeId = connectionType.id
      state.connections.push(connection)
      cache.updateSpace('connections', state.connections, state.id)
    },
    removeConnection: (state, connectionId) => {
      const connections = state.connections.filter(connection => {
        return connection.id !== connectionId
      })
      state.connections = connections
      cache.updateSpace('connections', state.connections, state.id)
    },
    removeConnectionsFromCard: (state, cardId) => {
      const connections = state.connections.filter(connection => {
        const isConnectedToCard = connection.startCardId === cardId || connection.endCardId === cardId
        return !isConnectedToCard
      })
      state.connections = connections
      cache.updateSpace('connections', state.connections, state.id)
    },

    // connection types
    addConnectionType: (state, { id, name, color }) => {
      const connectionType = {
        id: id || nanoid(),
        name: name || `Connection ${state.connectionTypes.length + 1}`,
        color: color || randomColor({ luminosity: 'light' })
      }
      state.connectionTypes.push(connectionType)
      cache.updateSpace('connectionTypes', state.connectionTypes, state.id)
    },
    removeUnusedConnectionTypes: (state) => {
      const connections = state.connections.map(connection => {
        return connection.connectionTypeId
      })
      const usedConnectionTypes = state.connectionTypes.filter(type => {
        return connections.includes(type.id)
      })
      state.connectionTypes = usedConnectionTypes
      cache.updateSpace('connectionTypes', state.connectionTypes, state.id)
    },
    updateConnectionTypeName: (state, { connectionTypeId, newName }) => {
      state.connectionTypes.map(type => {
        if (type.id === connectionTypeId) {
          type.name = newName
        }
      })
      cache.updateSpace('connectionTypes', state.connectionTypes, state.id)
    },
    updateConnectionTypeColor: (state, { connectionTypeId, newColor }) => {
      state.connectionTypes.map(type => {
        if (type.id === connectionTypeId) {
          type.color = newColor
        }
      })
      cache.updateSpace('connectionTypes', state.connectionTypes, state.id)
    },
    changeConnectionType: (state, { connectionId, connectionTypeId }) => {
      state.connections.map(connection => {
        if (connection.id === connectionId) {
          connection.connectionTypeId = connectionTypeId
        }
      })
      cache.updateSpace('connections', state.connections, state.id)
    }
  },

  actions: {
    restoreFromCache: (context) => {
      const user = context.rootState.currentUser
      let spaceToRestore = {}
      // betaSpace condition added aug 2019, can safely remove this in aug 2020
      const betaSpace = cache.space('1')
      if (user.lastSpace) {
        spaceToRestore = cache.space(user.lastSpace)
        context.commit('restoreSpace', spaceToRestore)
      } else if (utils.objectHasKeys(betaSpace)) {
        context.commit('updateBetaSpace')
        context.commit('addUserToSpace', user)
        spaceToRestore = cache.space(context.state.id)
        context.commit('restoreSpace', spaceToRestore)
      } else {
        context.dispatch('createNewSpace')
        context.commit('addUserToSpace', user)
      }
      context.commit('currentUser/updateLastSpace', context.state.id, { root: true })
    },

    // spaces
    createNewSpace: (context) => {
      console.log('createNewSpace')
      const newId = nanoid()
      context.commit('updateSpaceId', newId)
      const space = utils.clone(context.state)
      cache.saveSpace(space)
    },

    // cards
    addCard: (context, { position, contents }) => {
      utils.typeCheck(position, 'object')
      utils.typeCheck(contents, 'object', true)
      let card = {
        id: nanoid(),
        x: position.x,
        y: position.y,
        name: ''
      }
      if (utils.objectHasKeys(contents)) {
        card = utils.updateObject(card, contents)
      } else {
        context.commit('cardDetailsIsVisibleForCard', card.id, { root: true })
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
            context.commit('updateCardConnections', card.id)
          }
        })
      } else {
        context.commit('moveCard', { cardId: currentDraggingCardId, delta })
        context.commit('updateCardConnections', currentDraggingCardId)
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
