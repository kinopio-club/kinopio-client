import Vue from 'vue'
import randomColor from 'randomcolor'
import nanoid from 'nanoid'
import _ from 'lodash'

import utils from '@/utils.js'
import cache from '@/cache.js'
import words from '@/words.js'

import helloSpace from '@/spaces/hello.json'
import newSpace from '@/spaces/new.json'

export default {
  namespaced: true,
  state: helloSpace,
  mutations: {
    restoreSpace: (state, space) => {
      Object.assign(state, space)
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
    createNewHelloSpace: (state, newId) => {
      state = helloSpace
      state.id = newId
    },
    createNewSpace: (state, newId) => {
      Object.assign(state, newSpace)
      state.name = words.randomUniqueName()
      state.id = newId
      state.connectionTypes[0].color = randomColor({ luminosity: 'light' })
      state.cards[1].x = _.random(180, 200)
      state.cards[1].y = _.random(160, 180)
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
      newName = utils.normalizeString(newName)
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
          // update properties differently depending on whether it's existing or new
          if (card[type]) {
            card[type] = value
          } else {
            Vue.set(card, type, value)
          }
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
    copyCardToRemovedCards: (state, cardId) => {
      const card = state.cards.find(card => {
        return card.id === cardId
      })
      if (!state.removedCards) {
        Vue.set(state, 'removedCards', [])
      }
      // card is empty based on name (should match cardIsEmpty() in CardDetails)
      if (card.name) {
        state.removedCards.unshift(card)
        cache.updateSpace('removedCards', state.removedCards, state.id)
      }
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
    init: (context) => {
      const user = context.rootState.currentUser
      let spaceToRestore = {}
      // betaSpace condition added aug 2019, can safely remove this in aug 2020
      const betaSpace = cache.space('1')
      if (user.lastSpace) {
        console.log('🚃 Restore last space from cache', user.lastSpace)
        spaceToRestore = cache.space(user.lastSpace)
        context.commit('restoreSpace', spaceToRestore)
      } else if (utils.objectHasKeys(betaSpace)) {
        console.log('🚃 Migrate data from beta format cache', betaSpace)
        context.commit('updateBetaSpace')
        context.commit('addUserToSpace', user)
        spaceToRestore = cache.space(context.state.id)
        context.commit('restoreSpace', spaceToRestore)
      } else {
        console.log('🚃 Create new hello-kinopio space')
        const isHelloSpace = true
        context.dispatch('createNewSpace', isHelloSpace)
      }
      context.commit('currentUser/updateLastSpace', context.state.id, { root: true })
    },

    // spaces
    createNewSpace: (context, isHelloSpace) => {
      const newId = nanoid()
      const user = context.rootState.currentUser
      if (isHelloSpace) {
        context.commit('createNewHelloSpace', newId)
      } else {
        context.commit('createNewSpace', newId)
        Vue.nextTick(() => {
          context.commit('updateCardConnections', context.state.cards[1].id)
          context.commit('currentUser/updateLastSpace', context.state.id, { root: true })
        })
      }
      const space = utils.clone(context.state)
      cache.saveSpace(space)
      context.commit('addUserToSpace', user)
    },
    changeSpace: (context, space) => {
      space = utils.migrateSpaceProperties(space)
      context.commit('restoreSpace', space)
      context.commit('currentUser/updateLastSpace', context.state.id, { root: true })
    },

    // cards
    addCard: (context, { position, contents }) => {
      utils.typeCheck(position, 'object')
      utils.typeCheck(contents, 'object', true)
      let card = {
        id: nanoid(),
        x: position.x,
        y: position.y,
        z: 0,
        name: ''
        // frameId: 0
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
      context.commit('copyCardToRemovedCards', cardId)
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
    // cards
    cardById: (state) => (id) => {
      return state.cards.find(card => card.id === id)
    },

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
