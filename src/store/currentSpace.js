import Vue from 'vue'
import randomColor from 'randomcolor'
import nanoid from 'nanoid'
import _ from 'lodash'

import utils from '@/utils.js'
import cache from '@/cache.js'
import api from '@/api.js'
import apiQueue from '@/apiQueue.js'
import words from '@/words.js'

import helloSpace from '@/spaces/hello.json'
import newSpace from '@/spaces/new.json'

// - todo: remove 'update' (remove or replace w more specificity (eg 'migrate'))

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

    updateName: (state, newName) => {
      state.name = newName
      cache.updateSpace('name', state.name, state.id)
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
    removeCardPermanently: (state, cardToRemove) => {
      state.cards = state.cards.filter(card => card.id !== cardToRemove.id)
      state.removedCards = state.removedCards.filter(card => card.id !== cardToRemove.id)
      cache.updateSpace('removedCards', state.removedCards, state.id)
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
    removeConnection: (state, connectionId) => {
      const connections = state.connections.filter(connection => {
        return connection.id !== connectionId
      })
      state.connections = connections
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
      const betaSpace = cache.space('1')
      if (user.lastSpaceId) {
        console.log('🚃 Restore last space from cache', user.lastSpaceId)
        spaceToRestore = cache.space(user.lastSpaceId)
        context.dispatch('loadSpace', spaceToRestore)
      // migration condition (from lastSpace to lastSpaceId) added sept 2019
      } else if (user.lastSpace) {
        console.log('🚃 Restore last space from cache', user.lastSpace)
        spaceToRestore = cache.space(user.lastSpace)
        context.dispatch('loadSpace', spaceToRestore)
        cache.updateUser('lastSpace', null)
      // betaSpace migration condition added aug 2019
      } else if (utils.objectHasKeys(betaSpace)) {
        console.log('🚃 Migrate data from beta format cache', betaSpace)
        context.commit('updateBetaSpace')
        context.commit('addUserToSpace', user)
        spaceToRestore = cache.space(context.state.id)
        context.dispatch('loadSpace', spaceToRestore)
      } else {
        console.log('🚃 Create new hello-kinopio space')
        const isHelloSpace = true
        context.dispatch('addSpace', isHelloSpace)
      }
      context.commit('currentUser/lastSpaceId', context.state.id, { root: true })
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
      space.cards[1].x = _.random(180, 200)
      space.cards[1].y = _.random(160, 180)
      const uniqueNewSpace = cache.updateIdsInSpace(space)
      context.commit('restoreSpace', uniqueNewSpace)
    },
    addSpace: (context, isHelloSpace) => {
      if (isHelloSpace) {
        context.dispatch('createNewHelloSpace')
      } else {
        context.dispatch('createNewSpace')
        Vue.nextTick(() => {
          context.dispatch('updateCardConnectionPaths', context.state.cards[1].id)
          context.dispatch('currentUser/lastSpaceId', context.state.id, { root: true })
        })
      }
      const space = utils.clone(context.state)
      const user = context.rootState.currentUser
      cache.saveSpace(space)
      apiQueue.add('createSpace', space)
      context.commit('addUserToSpace', user)
    },
    loadSpace: async (context, space) => {
      context.commit('restoreSpace', space)
      space = utils.clone(space)
      context.commit('loadingSpace', true, { root: true })
      const remoteSpace = await api.getSpace(space.id)
      context.commit('loadingSpace', false, { root: true })
      if (!remoteSpace) { return }
      const remoteDate = utils.normalizeToUnixTime(remoteSpace.updatedAt)
      if (remoteDate > space.cacheDate) {
        console.log('🚋 Restore from remote space', remoteSpace)
        context.commit('restoreSpace', remoteSpace)
        cache.saveSpace(remoteSpace)
      }
    },
    changeSpace: (context, space) => {
      space = utils.migrateSpaceProperties(space)
      context.dispatch('loadSpace', space)
      const spaceId = context.state.id
      context.dispatch('currentUser/lastSpaceId', spaceId, { root: true })
      apiQueue.add('updateUser', { lastSpaceId: spaceId })
    },
    removeCurrentSpace: (context) => {
      const space = utils.clone(context.state)
      cache.removeSpace(space.id)
      apiQueue.add('removeSpace', space.id)
    },
    removeSpacePermanently: (context, space) => {
      cache.removeSpacePermanently(space.id)
      apiQueue.add('removeSpacePermanently', space.id)
    },
    toAnotherSpace: (context, { spaceId, shouldRemoveOriginals }) => {
      const space = utils.clone(context.state)
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const cards = space.cards.filter(card => multipleCardsSelectedIds.includes(card.id))
      const connections = space.connections.filter(connection => {
        const isStartCardMatch = multipleCardsSelectedIds.includes(connection.startCardId)
        const isEndCardMatch = multipleCardsSelectedIds.includes(connection.endCardId)
        return isStartCardMatch && isEndCardMatch
      })
      const connectionTypeIds = connections.map(connection => connection.connectionTypeId)
      const connectionTypes = space.connectionTypes.filter(type => {
        return connectionTypeIds.includes(type.id)
      })
      const items = {
        cards,
        connectionTypes,
        connections
      }
      // const uniqueItems = utils.uniqueSpaceItems(items)
      console.log(spaceId)
      cache.addToSpace(items, spaceId)
      if (shouldRemoveOriginals) {
        const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
        multipleCardsSelectedIds.forEach(cardId => {
          context.dispatch('removeCard', { id: cardId })
          context.dispatch('removeConnectionsFromCard', { id: cardId })
        })
      }
    },

    // Cards

    addCard: (context, { position, contents }) => {
      utils.typeCheck(position, 'object')
      utils.typeCheck(contents, 'object', true)
      let card = {
        id: nanoid(),
        x: position.x,
        y: position.y,
        z: 0,
        name: '',
        frameId: 0
      }
      if (utils.objectHasKeys(contents)) {
        card = utils.updateObject(card, contents)
      } else {
        context.commit('cardDetailsIsVisibleForCardId', card.id, { root: true })
      }
      context.commit('createCard', card)
      card.spaceId = context.state.id
      apiQueue.add('createCard', card)
      context.dispatch('incrementCardZ', card.id)
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
        }
        apiQueue.add('updateCard', { id: card.id, z: card.z })
      })
      context.commit('incrementCardZ', cardId)
    },
    removeCard: (context, card) => {
      const cardHasContent = Boolean(card.name)
      if (cardHasContent) {
        context.commit('removeCard', card)
        apiQueue.add('removeCard', card)
      } else {
        context.dispatch('removeCardPermanently', card)
      }
      context.dispatch('removeConnectionsFromCard', card)
      context.commit('generateCardMap', null, { root: true })
    },
    removeCardPermanently: (context, card) => {
      context.commit('removeCardPermanently', card)
      apiQueue.add('removeCardPermanently', card)
    },
    restoreCard: (context, card) => {
      context.commit('restoreCard', card)
      apiQueue.add('restoreCard', card)
    },
    dragCards: (context, { endCursor, prevCursor, delta }) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      const cards = context.rootState.currentSpace.cards
      delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      if (multipleCardsSelectedIds.length) {
        cards.map(card => {
          if (multipleCardsSelectedIds.includes(card.id)) {
            context.commit('moveCard', { cardId: card.id, delta })
            apiQueue.add('updateCard', { id: card.id, x: endCursor.x, y: endCursor.y })
            context.dispatch('updateCardConnectionPaths', card.id)
          }
        })
      } else {
        context.commit('moveCard', { cardId: currentDraggingCardId, delta })
        apiQueue.add('updateCard', { id: currentDraggingCardId, x: endCursor.x, y: endCursor.y })
        context.dispatch('updateCardConnectionPaths', currentDraggingCardId)
      }
    },
    incrementSelectedCardsZ: (context) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const currentDraggingCardId = context.rootState.currentDraggingCardId
      const cards = context.state.cards
      if (multipleCardsSelectedIds.length) {
        cards.forEach(card => context.dispatch('incrementCardZ', card.id))
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
        connection.connectionTypeId = connectionType.id
        connection.spaceId = context.state.id
        apiQueue.add('createConnection', connection)
        context.commit('addConnection', connection)
      }
    },
    updateCardConnectionPaths: (context, cardId) => {
      let connections = utils.clone(context.state.connections)
      connections = connections.map(connection => {
        if (connection.startCardId === cardId || connection.endCardId === cardId) {
          connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
          apiQueue.add('updateConnection', { id: connection.id, path: connection.path, SpaceId: context.state.id })
        }
        return connection
      })
      context.commit('updateCardConnections', connections)
    },
    removeConnectionsFromCard: (context, card) => {
      context.state.connections.forEach(connection => {
        if (connection.startCardId === card.id || connection.endCardId === card.id) {
          context.commit('removeConnection', connection.id)
          apiQueue.add('removeConnection', { id: connection.id })
        }
      })
    },
    removeSelectedConnectionsFromCard: (context, cardId) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const connections = context.state.connections
      connections.map(connection => {
        const { startCardId, endCardId, id } = connection
        const startMatch = startCardId === cardId && multipleCardsSelectedIds.includes(endCardId)
        const endMatch = endCardId === cardId && multipleCardsSelectedIds.includes(startCardId)
        const connectedToSelected = startMatch || endMatch
        if (connectedToSelected) {
          context.commit('removeConnection', id)
          apiQueue.add('removeConnection', id)
        }
      })
    },
    removeConnection: (context, connectionId) => {
      context.commit('removeConnection', connectionId)
      apiQueue.add('removeConnection', { id: connectionId })
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
      console.log('removeConnectionType', removeConnectionTypes, removeConnectionTypes.length)
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

    // Connection Types
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
