import Vue from 'vue'
import randomColor from 'randomcolor'
import nanoid from 'nanoid'
import random from 'lodash-es/random'
import last from 'lodash-es/last'

import utils from '@/utils.js'
import cache from '@/cache.js'
import api from '@/api.js'
import apiQueue from '@/apiQueue.js'
import words from '@/words.js'

import helloSpace from '@/spaces/hello.json'
import newSpace from '@/spaces/new.json'

export default {
  namespaced: true,
  state: helloSpace,
  mutations: {

    restoreSpace: (state, space) => {
      Object.assign(state, space)
      utils.updatePageTitleWithName(space.name)
    },
    // Added aug 2019, can safely remove this in aug 2020
    updateBetaSpace: (state) => {
      if (state.id === '1') {
        const newId = nanoid()
        state.id = newId
        state.name = 'Hello Kinopio'
        cache.updateBetaSpaceId(newId)
        cache.updateSpace('name', state.name, state.id)
      }
    },

    // Users

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

    // Space

    updateSpace: (state, updatedSpace) => {
      const updates = Object.keys(updatedSpace)
      updates.forEach(key => {
        if (state[key] !== undefined) {
          state[key] = updatedSpace[key]
          cache.updateSpace(key, state[key], state.id)
        }
      })
      utils.updatePageTitleWithName(state.name)
    },

    // Cards

    incrementCardZ: (state, cardId) => {
      state.cards.map((card, index) => {
        card.z = index
        if (card.id === cardId) {
          card.z = state.cards.length + 1
        }
      })
      cache.updateSpace('cards', state.cards, state.id)
    },
    updateCard: (state, updatedCard) => {
      state.cards.map(card => {
        if (card.id === updatedCard.id) {
          const updates = Object.keys(updatedCard)
          updates.forEach(key => {
            // update properties differently depending on whether it's existing or new
            if (card[key]) {
              card[key] = updatedCard[key]
            } else {
              Vue.set(card, key, updatedCard[key])
            }
          })
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
    removeCard: (state, cardToRemove) => {
      if (!state.removedCards) {
        // migration oct 2019
        Vue.set(state, 'removedCards', [])
      }
      const card = state.cards.find(card => card.id === cardToRemove.id)
      state.cards = state.cards.filter(card => card.id !== cardToRemove.id)
      state.removedCards.unshift(card)
      cache.updateSpace('removedCards', state.removedCards, state.id)
      cache.updateSpace('cards', state.cards, state.id)
    },
    removeCardPermanent: (state, cardToRemove) => {
      state.cards = state.cards.filter(card => card.id !== cardToRemove.id)
      const fromRemovedCards = state.removedCards.find(card => card.id === cardToRemove.id)
      if (fromRemovedCards) {
        state.removedCards = state.removedCards.filter(card => card.id !== cardToRemove.id)
        cache.updateSpace('removedCards', state.removedCards, state.id)
      } else {
        cache.updateSpace('cards', state.cards, state.id)
      }
    },
    restoreCard: (state, cardToRestore) => {
      const index = state.removedCards.findIndex(card => card.id === cardToRestore.id)
      const card = state.removedCards[index]
      state.cards.push(card)
      state.removedCards.splice(index, 1)
      cache.updateSpace('cards', state.cards, state.id)
      cache.updateSpace('removedCards', state.removedCards, state.id)
    },

    // Connections

    updateCardConnections: (state, connections) => {
      state.connections = connections
      cache.updateSpace('connections', connections, state.id)
    },
    addConnection: (state, connection) => {
      state.connections.push(connection)
      cache.updateSpace('connections', state.connections, state.id)
    },
    removeConnection: (state, connectionToRemove) => {
      const connections = state.connections.filter(connection => {
        return connection.id !== connectionToRemove.id
      })
      state.connections = connections
      cache.updateSpace('connections', state.connections, state.id)
    },
    updateConnectionTypeForConnection: (state, { connectionId, connectionTypeId }) => {
      state.connections.map(connection => {
        if (connection.id === connectionId) {
          connection.connectionTypeId = connectionTypeId
        }
      })
      cache.updateSpace('connections', state.connections, state.id)
    },

    // Connection Types

    addConnectionType: (state, connectionType) => {
      state.connectionTypes.push(connectionType)
      cache.updateSpace('connectionTypes', state.connectionTypes, state.id)
    },
    removeConnectionType: (state, connectionType) => {
      state.connectionTypes = state.connectionTypes.filter(type => {
        return connectionType.id !== type.id
      })
      cache.updateSpace('connectionTypes', state.connectionTypes, state.id)
    },
    updateConnectionType: (state, updatedType) => {
      state.connectionTypes.map(type => {
        if (type.id === updatedType.id) {
          const updates = Object.keys(updatedType)
          updates.forEach(key => {
            if (type[key]) {
              type[key] = updatedType[key]
            }
          })
        }
      })
      cache.updateSpace('connectionTypes', state.connectionTypes, state.id)
    }
  },

  actions: {
    init: (context) => {
      const user = context.rootState.currentUser
      const betaSpace = cache.space('1')
      if (user.lastSpaceId) {
        console.log('🚃 Restore last space', user.lastSpaceId)
        let spaceToRestore = cache.space(user.lastSpaceId)
        if (!spaceToRestore.id) {
          spaceToRestore = { id: user.lastSpaceId }
        }
        console.log('🔮 spaceToRestore', spaceToRestore, user.lastSpaceId)
        context.dispatch('loadSpace', spaceToRestore)
      // migration condition (from lastSpace to lastSpaceId) added sept 2019
      } else if (user.lastSpace) {
        console.log('🚃 Migrate data from beta lastSpace key name', user.lastSpace)
        let spaceToRestore = cache.space(user.lastSpace)
        if (!spaceToRestore.id) {
          spaceToRestore = { id: user.lastSpace }
        }
        context.dispatch('loadSpace', spaceToRestore)
        cache.updateUser('lastSpace', null)
      // betaSpace migration condition added aug 2019
      } else if (utils.objectHasKeys(betaSpace)) {
        console.log('🚃 Migrate data from beta format', betaSpace)
        context.commit('updateBetaSpace')
        context.commit('addUserToSpace', user)
        let spaceToRestore = cache.space(context.state.id)
        if (!spaceToRestore.id) {
          spaceToRestore = { id: user.lastSpace }
        }
        context.dispatch('loadSpace', spaceToRestore)
      } else {
        console.log('🚃 Create new Hello Kinopio space')
        const isHelloSpace = true
        context.dispatch('addSpace', isHelloSpace)
      }
      context.dispatch('currentUser/lastSpaceId', context.state.id, { root: true })
    },

    // Space

    createNewHelloSpace: (context) => {
      let space = utils.clone(helloSpace)
      space.id = nanoid()
      space = cache.updateIdsInSpace(space)
      context.commit('restoreSpace', space)
    },
    createNewSpace: (context) => {
      let space = utils.clone(newSpace)
      space.name = words.randomUniqueName()
      space.id = nanoid()
      space.connectionTypes[0].color = randomColor({ luminosity: 'light' })
      space.cards[1].x = random(180, 200)
      space.cards[1].y = random(160, 180)
      const uniqueNewSpace = cache.updateIdsInSpace(space)
      context.commit('restoreSpace', uniqueNewSpace)
    },
    saveNewSpace: (context) => {
      const space = utils.clone(context.state)
      const user = context.rootState.currentUser
      cache.saveSpace(space)
      apiQueue.add('createSpace', space)
      context.commit('addUserToSpace', user)
    },
    addSpace: (context, isHelloSpace) => {
      if (isHelloSpace) {
        context.dispatch('createNewHelloSpace')
      } else {
        context.dispatch('createNewSpace')
        Vue.nextTick(() => {
          context.dispatch('updateCardConnectionPaths', { cardId: context.state.cards[1].id })
          context.dispatch('currentUser/lastSpaceId', context.state.id, { root: true })
          context.dispatch('saveNewSpace')
        })
      }
    },
    loadRemoteSpace: async (context, space) => {
      context.commit('isLoadingSpace', true, { root: true })
      let remoteSpace = await api.getSpace(space)
      context.commit('isLoadingSpace', false, { root: true })
      if (!remoteSpace) { return }
      if (remoteSpace.id !== context.state.id) { return }
      remoteSpace = utils.normalizeRemoteSpace(remoteSpace)
      // TODO (if !remoteSpace && !cachedSpace) handle 404 error, may occur for loading from url cases
      console.log('🚋 Restore space from remote space', remoteSpace)
      cache.saveSpace(remoteSpace)
      context.commit('restoreSpace', remoteSpace)
    },
    // TODO if store.spaceToLoad , load from there (replaces var 'space')
    // after requesting it (fail or success) , commit store.spaceToLoad = ''
    loadSpace: (context, space) => {
      const cachedSpace = cache.space(space.id)
      const emptySpace = { id: space.id, cards: [], connections: [] }
      context.commit('restoreSpace', emptySpace)
      context.commit('restoreSpace', cachedSpace)
      context.dispatch('loadRemoteSpace', space)
    },
    updateSpace: async (context, updates) => {
      updates.id = context.state.id
      context.commit('updateSpace', updates)
      apiQueue.add('updateSpace', updates)
    },
    changeSpace: (context, space) => {
      space = utils.clone(space)
      space = utils.migrationEnsureRemovedCards(space)
      context.dispatch('loadSpace', space)
      context.dispatch('currentUser/lastSpaceId', space.id, { root: true })
      apiQueue.add('updateSpace', {
        id: space.id,
        updatedAt: new Date()
      })
    },
    removeCurrentSpace: (context) => {
      const space = utils.clone(context.state)
      cache.removeSpace(space)
      apiQueue.add('removeSpace', { id: space.id })
    },
    removeSpacePermanent: (context, space) => {
      cache.removeSpacePermanent(space.id)
      apiQueue.add('removeSpacePermanent', space)
    },

    // Cards

    addCard: (context, position) => {
      utils.typeCheck(position, 'object')
      let cards = context.rootState.currentSpace.cards
      let card = {
        id: nanoid(),
        x: position.x,
        y: position.y,
        z: cards.length + 1,
        name: '',
        frameId: 0
      }
      context.commit('cardDetailsIsVisibleForCardId', card.id, { root: true })
      context.commit('createCard', card)
      card.spaceId = context.state.id
      card = utils.clone(card)
      apiQueue.add('createCard', card)
    },
    updateCard: (context, card) => {
      context.commit('updateCard', card)
      apiQueue.add('updateCard', card)
    },
    incrementCardZ: (context, cardId) => {
      let cards = context.rootState.currentSpace.cards
      cards = cards.map((card, index) => {
        card = utils.clone(card)
        card.z = index
        if (card.id === cardId) {
          card.z = cards.length + 1
          apiQueue.add('updateCard', { id: card.id, z: card.z })
        }
      })
      context.commit('incrementCardZ', cardId)
    },
    removeCard: (context, card) => {
      const cardHasContent = Boolean(card.name)
      if (cardHasContent) {
        context.commit('removeCard', card)
        apiQueue.add('removeCard', card)
      } else {
        context.dispatch('removeCardPermanent', card)
      }
      context.dispatch('removeConnectionsFromCard', card)
      context.commit('generateCardMap', null, { root: true })
    },
    removeCardPermanent: (context, card) => {
      context.commit('removeCardPermanent', card)
      apiQueue.add('removeCardPermanent', card)
    },
    restoreCard: (context, card) => {
      context.commit('restoreCard', card)
      apiQueue.add('restoreCard', card)
    },
    restoreSpace: (context, space) => {
      cache.restoreSpace(space)
      apiQueue.add('restoreSpace', { id: space.id })
      context.dispatch('changeSpace', space)
    },
    dragCards: (context, options) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const { delta, endCursor, prevCursor } = options
      options.delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      if (multipleCardsSelectedIds.length) {
        context.dispatch('dragMultipleCards', options)
      } else {
        context.dispatch('dragSingleCard', options)
      }
    },
    dragMultipleCards: (context, { endCursor, prevCursor, delta }) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const cards = context.rootState.currentSpace.cards.filter(card => multipleCardsSelectedIds.includes(card.id))
      cards.forEach(card => {
        context.commit('moveCard', { cardId: card.id, delta })
        context.dispatch('updateCardConnectionPaths', { cardId: card.id })
      })
    },
    dragSingleCard: (context, { endCursor, delta, shouldUpdateApi }) => {
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      context.commit('moveCard', { cardId: currentDraggingCardId, delta })
      context.dispatch('updateCardConnectionPaths', { cardId: currentDraggingCardId })
    },
    updatePositions: (context) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      if (multipleCardsSelectedIds.length) {
        const cards = context.rootState.currentSpace.cards.filter(card => multipleCardsSelectedIds.includes(card.id))
        cards.forEach(card => {
          card = utils.clone(card)
          apiQueue.add('updateCard', { id: card.id, x: card.x, y: card.y })
          context.dispatch('updateCardConnectionPaths', { cardId: card.id, shouldUpdateApi: true })
        })
      } else {
        const currentDraggingCardId = context.rootState.currentDraggingCardId
        let card = context.rootState.currentSpace.cards.find(card => currentDraggingCardId === card.id)
        if (!card) { return }
        card = utils.clone(card)
        apiQueue.add('updateCard', { id: card.id, x: card.x, y: card.y })
        context.dispatch('updateCardConnectionPaths', { cardId: card.id, shouldUpdateApi: true })
      }
    },
    incrementSelectedCardsZ: (context) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      if (multipleCardsSelectedIds.length) {
        multipleCardsSelectedIds.forEach(cardId => context.dispatch('incrementCardZ', cardId))
      } else {
        context.dispatch('incrementCardZ', currentDraggingCardId)
      }
    },

    // Connections

    addConnection: (context, { connection, connectionType }) => {
      const connectionAlreadyExists = context.getters.connectionAlreadyExists({
        startCardId: connection.startCardId,
        endCardId: connection.endCardId
      })
      if (!connectionAlreadyExists) {
        connection.id = nanoid()
        connection.spaceId = context.state.id
        connection.connectionTypeId = connectionType.id
        apiQueue.add('createConnection', connection)
        context.commit('addConnection', connection)
      }
    },
    updateCardConnectionPaths: (context, { cardId, shouldUpdateApi }) => {
      let connections = utils.clone(context.state.connections)
      connections = connections.map(connection => {
        if (connection.startCardId === cardId || connection.endCardId === cardId) {
          connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
          connection.spaceId = context.state.id
          if (shouldUpdateApi) {
            apiQueue.add('updateConnection', connection)
          }
        }
        return connection
      })
      context.commit('updateCardConnections', connections)
    },
    removeConnectionsFromCard: (context, card) => {
      context.state.connections.forEach(connection => {
        if (connection.startCardId === card.id || connection.endCardId === card.id) {
          context.dispatch('removeConnection', connection)
        }
      })
    },
    removeSelectedConnectionsFromCard: (context, cardId) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const connections = context.state.connections
      connections.map(connection => {
        const { startCardId, endCardId } = connection
        const startMatch = startCardId === cardId && multipleCardsSelectedIds.includes(endCardId)
        const endMatch = endCardId === cardId && multipleCardsSelectedIds.includes(startCardId)
        const connectedToSelected = startMatch || endMatch
        if (connectedToSelected) {
          context.dispatch('removeConnection', connection)
        }
      })
    },
    removeConnection: (context, connection) => {
      context.commit('removeConnection', connection)
      apiQueue.add('removeConnection', connection)
    },
    updateConnectionTypeForConnection: (context, { connectionId, connectionTypeId }) => {
      const connection = {
        id: connectionId,
        connectionTypeId
      }
      apiQueue.add('updateConnection', connection)
      context.commit('updateConnectionTypeForConnection', { connectionId, connectionTypeId })
    },

    // Connection Types

    addConnectionType: (context) => {
      const types = context.state.connectionTypes
      const connectionType = {
        id: nanoid(),
        name: `Connection ${types.length + 1}`,
        color: randomColor({ luminosity: 'light' }),
        spaceId: context.state.id
      }
      context.commit('addConnectionType', connectionType)
      apiQueue.add('createConnectionType', connectionType)
    },
    updateConnectionType: (context, connectionType) => {
      context.commit('updateConnectionType', connectionType)
      apiQueue.add('updateConnectionType', connectionType)
    },
    removeUnusedConnectionTypes: (context) => {
      const connectionTypes = context.state.connectionTypes
      const connections = context.state.connections
      const connectionTypeIds = connections.map(connection => connection.connectionTypeId)
      const removeConnectionTypes = connectionTypes.filter(type => !connectionTypeIds.includes(type.id))
      removeConnectionTypes.forEach(type => {
        apiQueue.add('removeConnectionType', type)
        context.commit('removeConnectionType', type)
      })
    }
  },

  getters: {
    // Cards
    cardById: (state) => (id) => {
      return state.cards.find(card => card.id === id)
    },

    // Connections
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
    connectionById: (state) => (id) => {
      return state.connections.find(connection => connection.id === id)
    },

    // Connection Types
    connectionTypeById: (state) => (id) => {
      return state.connectionTypes.find(type => type.id === id)
    },
    lastConnectionType: (state) => {
      return last(state.connectionTypes)
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
