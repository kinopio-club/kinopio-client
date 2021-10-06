import utils from '@/utils.js'
import cache from '@/cache.js'

import nanoid from 'nanoid'
import randomColor from 'randomcolor'

// import debounce from 'lodash-es/debounce'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

let currentSpaceId

export default {
  namespaced: true,
  state: {
    ids: [],
    connections: {},
    typeIds: [], // todo restoreTypes, called by currentSpace/restoreinchunks
    types: {}
  },
  mutations: {

    // init

    clear: (state) => {
      state.ids = []
      state.connections = {}
      state.typeIds = []
      state.types = {}
    },
    restore: (state, connections) => {
      let connectionIds = []
      connections.forEach(connection => {
        connectionIds.push(connection.id)
        state.connections[connection.id] = connection
      })
      state.ids = state.ids.concat(connectionIds)
      console.log('🍅', state.connections, state.ids)
    },

    // restoreTypes: (state, types) => {},

    create: (state, connection) => {
      state.ids.push(connection.id)
      state.connections[connection.id] = connection
      cache.updateSpace('connections', state.connections, currentSpaceId)
    },
    createType: (state, type) => {
      state.typeIds.push(type.id)
      state.types[type.id] = type
      cache.updateSpace('connectionTypes', state.types, currentSpaceId)
    },

    // update

    update: (state, connection) => {
      const keys = Object.keys(connection)
      keys.forEach(key => {
        state.connections[connection.id] = connection[key]
      })
      cache.updateSpace('connections', state.connections, currentSpaceId)
    },
    updateReadOnly: (state, connection) => {
      const keys = Object.keys(connection)
      keys.forEach(key => {
        state.connections[connection.id] = connection[key]
      })
    },
    updatePaths: (state, connections) => {
      connections.forEach(connection => {
        const path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
        state.connections[connection.id].path = path
        state.connections[connection.id].spaceId = currentSpaceId
      })
      cache.updateSpaceConnectionsDebounced(state.connections, currentSpaceId)
    },
    updatePathsBroadcast: (state, { connections }) => {
      connections.forEach(connection => {
        state.connections[connection.id].path = connection.path
      })
      cache.updateSpace('connections', state.connections, currentSpaceId)
    },
    updateType: (state, type) => {
      const keys = Object.keys(type)
      keys.forEach(key => {
        state.types[type.id] = type[key]
      })
      cache.updateSpace('connectionTypes', state.types, currentSpaceId)
    },
    reorderTypeToEnd: (state, type) => {
      delete state.types[type.id]
      state.types.push(type.id)
    },

    // remove

    remove: (state, connectionToRemove) => {
      const connection = state.connections[connectionToRemove.id]
      state.ids = state.ids.filter(id => id !== connection.id)
      delete state.connections[connection.id]
      cache.updateSpace('connections', state.connections, currentSpaceId)
    },
    removeType: (state, typeToRemove) => {
      const type = state.types[typeToRemove.id]
      state.typeIds = state.typeIds.filter(id => id !== type.id)
      delete state.types[type.id]
      cache.updateSpace('connectionTypes', state.types, currentSpaceId)
    }

  },
  actions: {

    // TODO port currentspace connection/type actions

    // init

    updateSpaceId: (context, spaceId) => {
      currentSpaceId = spaceId
    },

    // create

    add: (context, { connection, type }) => {
      const isExistingPath = context.getters.isExistingPath({
        startCardId: connection.startCardId,
        endCardId: connection.endCardId
      })
      if (isExistingPath) { return }
      connection.id = connection.id || nanoid()
      connection.spaceId = currentSpaceId
      connection.userId = context.rootState.currentUser.id
      connection.connectionTypeId = type.id
      context.dispatch('api/addToQueue', { name: 'createConnection', body: connection }, { root: true })
      context.dispatch('broadcast/update', { updates: connection, type: 'addConnection', mutation: 'currentConnections/create' }, { root: true })
      context.commit('create', connection)
    },
    addType: (context, options) => {
      let connectionType = {
        id: nanoid(),
        name: `Connection Type ${context.state.typeIds.length + 1}`,
        color: randomColor({ luminosity: 'light' }),
        spaceId: context.state.id
      }
      if (options) {
        const keys = Object.keys(options)
        keys.forEach(key => {
          connectionType[key] = options[key]
        })
      }
      context.commit('createType', connectionType)
      context.dispatch('broadcast/update', { updates: connectionType, type: 'addConnectionType', mutation: 'currentConnections/createType' }, { root: true })
      context.dispatch('api/addToQueue', { name: 'createConnectionType', body: connectionType }, { root: true })
    },

    // update

    update: (context, connection) => {
      context.commit('update', connection)
      const update = { name: 'updateConnection', body: connection }
      context.dispatch('api/addToQueue', update, { root: true })
      context.dispatch('broadcast/update', { updates: connection, type: 'updateConnectionTypeForConnection', mutation: 'currentConnections/update' }, { root: true })
    },
    updatePaths: (context, { cardId, shouldUpdateApi, connections }) => {
      connections = connections || context.getters.byCardId(cardId)
      connections.map(connection => {
        connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
        connection.spaceId = currentSpaceId
        if (shouldUpdateApi) {
          context.dispatch('api/addToQueue', { name: 'updateConnection', body: connection }, { root: true })
        }
        const userCanEdit = context.rootGetters['currentUser/canEditSpace']()
        if (userCanEdit) {
          context.dispatch('broadcast/update', { updates: connection, type: 'updateConnection', mutation: 'currentConnections/update' }, { root: true })
          context.commit('update', connection)
        } else {
          context.commit('updateReadOnly', connection)
        }
      })
    },
    correctPaths: (context, { shouldUpdateApi }) => {
      if (!context.rootState.webfontIsLoaded) { return }
      const cardIds = context.rootState.currentCards.ids

      let connections = []
      context.getters.all.forEach(connection => {
        const startCard = cardIds.includes(connection.startCardId)
        const endCard = cardIds.includes(connection.endCardId)
        const shouldRemove = !startCard || !endCard
        if (shouldRemove && shouldUpdateApi) {
          context.dispatch('remove', connection)
          return
        } else if (shouldRemove) {
          context.commit('remove', connection)
        }
        const path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
        if (!path) { return }
        if (path === connection.path) { return }
        connections.push(connection)
      })
      context.dispatch('updatePaths', { connections, shouldUpdateApi })
    },

    // remove

    removeFromCard: (context, card) => {
      context.getters.all.forEach(connection => {
        if (connection.startCardId === card.id || connection.endCardId === card.id) {
          context.dispatch('remove', connection)
        }
      })
    },
    removeFromSelectedCard: (context, cardId) => {
      const multipleCardsSelectedIds = context.rootState.multipleCardsSelectedIds
      const connections = context.state.connections
      connections.map(connection => {
        const { startCardId, endCardId } = connection
        const start = startCardId === cardId && multipleCardsSelectedIds.includes(endCardId)
        const end = endCardId === cardId && multipleCardsSelectedIds.includes(startCardId)
        const connectedToSelected = start || end
        if (connectedToSelected) {
          context.commit('removeFromMultipleConnectionsSelected', connection.id, { root: true })
          context.dispatch('remove', connection)
        }
      })
    },
    remove: (context, connection) => {
      context.commit('remove', connection)
      const update = { name: 'removeConnection', body: connection }
      context.dispatch('api/addToQueue', update, { root: true })
      context.dispatch('broadcast/update', { updates: connection, type: 'removeConnection', mutation: 'currentConnections/remove' }, { root: true })
    }

  },
  getters: {
    byId: (state) => (id) => {
      return state.connections[id]
    },
    all: (state) => {
      return state.ids.map(id => state.connections[id])
    },

    typeById: (state) => (id) => {
      return state.types[id]
    },
    allTypes: (state) => {
      return state.typeIds.map(id => state.types[id])
    },

    isExistingPath: (state, getters) => ({ startCardId, endCardId }) => {
      const connections = getters.all
      const existing = connections.filter(connection => {
        let start = connection.startCardId === startCardId
        let end = connection.endCardId === endCardId
        return start && end
      })
      return Boolean(existing.length)
    },

    byCardId: (state, getters) => (cardId) => {
      const connections = getters.all
      return connections.filter(connection => {
        let start = connection.startCardId === cardId
        let end = connection.endCardId === cardId
        return start || end
      })
    }
    // TODO port currentspace connection/type getters
  }
}
