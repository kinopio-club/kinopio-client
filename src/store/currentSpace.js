import Vue from 'vue'
import randomColor from 'randomcolor'
import nanoid from 'nanoid'
import _ from 'lodash'

import utils from '@/utils.js'
import cache from '@/cache.js'
import api from '@/api.js'
import queue from '@/queue.js'
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
      state.name = newName
      cache.updateSpace('name', state.name, state.id)
    },

    // cards
    incrementCardZ: (state, cardId) => {
      state.cards.map((card, index) => {
        card = utils.clone(card)
        card.z = index
        if (card.id === cardId) {
          card.z = state.cards.length + 1
        }
      })
      cache.updateSpace('cards', state.cards, state.id)
    },
    updateCard: (state, { key, value, cardId }) => {
      state.cards.map(card => {
        if (card.id === cardId) {
          // update properties differently depending on whether it's existing or new
          if (card[key]) {
            card[key] = value
          } else {
            Vue.set(card, key, value)
          }
        }
      })
      cache.updateSpace('cards', state.cards, state.id)
      const card = {
        id: cardId,
        spaceId: state.id
      }
      card[key] = value
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
      const index = state.cards.findIndex(card => card.id === cardId)
      const card = state.cards[index]
      if (!state.removedCards) {
        Vue.set(state, 'removedCards', [])
      }
      const cardHasContent = Boolean(card.name)
      if (cardHasContent) {
        state.removedCards.unshift(card) // prepend card to removedCards
        cache.updateSpace('removedCards', state.removedCards, state.id)
      }
      state.cards.splice(index, 1)
      cache.updateSpace('cards', state.cards, state.id)
    },
    removeCardPermanently: (state, cardId) => {
      const removedCards = state.removedCards.filter(card => {
        return card.id !== cardId
      })
      state.removedCards = removedCards
      cache.updateSpace('removedCards', state.removedCards, state.id)
      queue.add('removeCardPermanently', cardId)
    },
    restoreCard: (state, cardId) => {
      const index = state.removedCards.findIndex(card => card.id === cardId)
      const card = state.removedCards[index]
      state.cards.push(card)
      state.removedCards.splice(index, 1)
      cache.updateSpace('cards', state.cards, state.id)
      cache.updateSpace('removedCards', state.removedCards, state.id)
      queue.add('restoreCard', cardId)
    },

    // connections

    updateCardConnections: (state, connections) => {
      state.connections = connections
      cache.updateSpace('connections', connections, state.id)
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
    // removeConnectionsFromCard: (state, cardId) => {
    //   const connections = state.connections.filter(connection => {
    //     const isConnectedToCard = connection.startCardId === cardId || connection.endCardId === cardId
    //     return !isConnectedToCard
    //   })
    //   state.connections = connections
    //   cache.updateSpace('connections', state.connections, state.id)
    // },

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
    updateConnectionType: (state, connectionType) => {
      state.connectionTypes.map(type => {
        if (type.id === connectionType.id) {
          type[connectionType.key] = connectionType.value
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

    // Spaces

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
      queue.add('createSpace', space)
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
      queue.add('updateUser', { lastSpaceId: spaceId })
    },
    removeCurrentSpace: (context) => {
      const space = utils.clone(context.state)
      cache.removeSpace(space.id)
      queue.add('removeSpace', space.id)
    },
    removeSpacePermanently: (context, spaceId) => {
      cache.removeSpacePermanently(spaceId)
      queue.add('removeSpacePermanently', spaceId)
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
          context.dispatch('removeCard', cardId)
          context.dispatch('removeConnectionsFromCard', cardId)
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
      queue.add('createCard', card)
      context.dispatch('incrementCardZ', card.id)
    },
    updateCard: (context, options) => {
      context.commit('updateCard', options)
      let card = { id: options.cardId }
      card[options.key] = options.value
      queue.add('updateCard', card)
    },
    incrementCardZ: (context, cardId) => {
      const cards = context.rootState.currentSpace.cards
      const card = {
        id: cardId,
        z: cards.length + 1
      }
      context.commit('incrementCardZ', card.id)
      queue.add('updateCard', { id: card.id, z: card.z })
    },
    removeCard: (context, cardId) => {
      context.commit('removeCard', cardId)
      queue.add('removeCard', cardId)
      context.dispatch('removeConnectionsFromCard', cardId)
      context.commit('generateCardMap', null, { root: true })
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
            queue.add('updateCard', { id: card.id, x: endCursor.x, y: endCursor.y })
            context.dispatch('updateCardConnectionPaths', card.id)
          }
        })
      } else {
        context.commit('moveCard', { cardId: currentDraggingCardId, delta })
        queue.add('updateCard', { id: currentDraggingCardId, x: endCursor.x, y: endCursor.y })
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
        context.commit('addConnection', { connection, connectionType })
        context.commit('removeUnusedConnectionTypes')
      }
    },
    updateCardConnectionPaths: (context, cardId) => {
      let connections = utils.clone(context.state.connections)
      connections = connections.map(connection => {
        if (connection.startCardId === cardId || connection.endCardId === cardId) {
          connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
          queue.add('updateConnection', { id: connection.id, path: connection.path })
        }
        return connection
      })
      context.commit('updateCardConnections', connections)
    },
    // qa test this
    removeConnectionsFromCard: (context, cardId) => {
      context.state.connections.forEach(connection => {
        if (connection.startCardId === cardId || connection.endCardId === cardId) {
          context.commit('removeConnection', connection.id)
          queue.add('removeConnection', connection.id)
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
          queue.add('removeConnection', id)
        }
      })
    },

    // Connection Types

    // updateCard: (context, options) => {
    //   context.commit('updateCard', options)
    //   let card = { id: options.cardId }
    //   card[options.key] = options.value
    //   queue.add('updateCard', card)

    updateConnectionType: (context, connectionType) => {
      context.commit('updateConnectionType', connectionType)
      queue.add('updateConnectionType', connectionType)

      // context.state.connectionTypes.map(type => {
      //   if (type.id === connectionTypeId) {
      //     type.name = newName
      //   }
      // })
      // cache.updateSpace('connectionTypes', context.state.connectionTypes, context.state.id)
    }
    // updateConnectionTypeName: (context, { connectionTypeId, newName }) => {
    //   context.state.connectionTypes.map(type => {
    //     if (type.id === connectionTypeId) {
    //       type.name = newName
    //     }
    //   })
    //   cache.updateSpace('connectionTypes', context.state.connectionTypes, context.state.id)
    //   // context.commit('updateConnectionTypeName', {connectionTypeId, newName} )
    // },
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
