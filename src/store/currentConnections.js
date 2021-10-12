import utils from '@/utils.js'
import cache from '@/cache.js'

import nanoid from 'nanoid'
import randomColor from 'randomcolor'
import last from 'lodash-es/last'
import uniq from 'lodash-es/uniq'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

let currentSpaceId

export default {
  namespaced: true,
  state: {
    ids: [],
    connections: {},
    typeIds: [],
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
    },
    restoreMatchingTypes: (state, { connections, types }) => {
      const typesToRestore = connections.map(connection => connection.connectionTypeId)
      let typeIds = []
      typesToRestore.forEach(id => {
        if (typeIds.includes(id)) { return }
        typeIds.push(id)
        state.types[id] = types[id]
      })
      state.typeIds = state.typeIds.concat(typeIds)
    },

    // create

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
        state.connections[connection.id][key] = connection[key]
      })
      cache.updateSpace('connections', state.connections, currentSpaceId)
    },
    updateReadOnly: (state, connection) => {
      const keys = Object.keys(connection)
      keys.forEach(key => {
        state.connections[connection.id][key] = connection[key]
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
        state.types[type.id][key] = type[key]
      })
      cache.updateSpace('connectionTypes', state.types, currentSpaceId)
    },
    reorderTypeToEnd: (state, type) => {
      state.typeIds.filter(id => id !== type.id)
      state.typeIds.push(type.id)
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

    // init

    updateSpaceId: (context, spaceId) => {
      currentSpaceId = spaceId
    },
    mergeUnique: (context, { newItems, itemType }) => {
      newItems.forEach(newItem => {
        let shouldUpdate
        let prevItem
        if (itemType === 'connection') {
          prevItem = context.getters.byId(newItem.id)
        } else {
          prevItem = context.getters.typeByTypeId(newItem.id)
        }
        let item = { id: newItem.id }
        let keys = Object.keys(newItem)
        keys = keys.filter(key => key !== 'id')
        keys.forEach(key => {
          if (prevItem[key] !== newItem[key]) {
            item[key] = newItem[key]
            shouldUpdate = true
          }
        })
        if (!shouldUpdate) { return }
        if (itemType === 'connection') {
          context.commit('update', item)
        } else {
          context.commit('updateType', item)
        }
      })
    },
    mergeRemove: (context, { removeItems, itemType }) => {
      removeItems.forEach(item => {
        if (itemType === 'connection') {
          context.commit('remove', item)
        } else {
          context.commit('removeType', item)
        }
      })
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
      context.dispatch('broadcast/update', { updates: connection, type: 'addConnection', action: 'currentConnections/add' }, { root: true })
      context.commit('create', connection)
    },
    addType: (context, type) => {
      let connectionType = {
        id: nanoid(),
        name: `Connection Type ${context.state.typeIds.length + 1}`,
        color: randomColor({ luminosity: 'light' }),
        spaceId: context.state.id
      }
      if (type) {
        const keys = Object.keys(type)
        keys.forEach(key => {
          connectionType[key] = type[key]
        })
      }
      context.commit('createType', connectionType)
      context.dispatch('broadcast/update', { updates: connectionType, type: 'addConnectionType', action: 'currentConnections/addType' }, { root: true })
      context.dispatch('api/addToQueue', { name: 'createConnectionType', body: connectionType }, { root: true })
    },

    // update

    update: (context, connection) => {
      context.commit('update', connection)
      const update = { name: 'updateConnection', body: connection }
      context.dispatch('api/addToQueue', update, { root: true })
      context.dispatch('broadcast/update', { updates: connection, type: 'updateConnectionTypeForConnection', action: 'currentConnections/update' }, { root: true })
    },
    updatePaths: (context, { cardId, shouldUpdateApi, connections }) => {
      connections = utils.clone(connections || context.getters.byCardId(cardId))
      connections.map(connection => {
        connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
        connection.spaceId = currentSpaceId
        if (shouldUpdateApi) {
          context.dispatch('api/addToQueue', { name: 'updateConnection', body: connection }, { root: true })
        }
        const userCanEdit = context.rootGetters['currentUser/canEditSpace']()
        if (userCanEdit) {
          context.dispatch('broadcast/update', { updates: connection, type: 'updateConnection', action: 'currentConnections/updatePaths' }, { root: true })
          context.commit('update', connection)
        } else {
          context.commit('updateReadOnly', connection)
        }
      })
    },
    correctPaths: (context, { shouldUpdateApi }) => {
      if (!context.rootState.webfontIsLoaded) { return }
      if (!context.getters.all.length) { return }
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
    updateType: (context, type) => {
      context.commit('updateType', type)
      context.dispatch('broadcast/update', { updates: type, type: 'updateConnectionType', action: 'currentConnections/updateType' }, { root: true })
      const update = { name: 'updateConnectionType', body: type }
      context.dispatch('api/addToQueue', update, { root: true })
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
      const connections = context.getters.all
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
      context.dispatch('broadcast/update', { updates: connection, type: 'removeConnection', action: 'currentConnections/remove' }, { root: true })
    },
    removeType: (context, type) => {
      const update = { name: 'removeConnectionType', body: type }
      context.dispatch('api/addToQueue', update, { root: true })
      context.commit('removeType', type)
      context.dispatch('broadcast/update', { updates: type, type: 'removeConnectionType', action: 'currentConnections/removeType' }, { root: true })
    },
    removeUnusedTypes: (context) => {
      const types = context.getters.allTypes
      const typesToRemove = types.filter(type => !context.state.typeIds.includes(type.id))
      typesToRemove.forEach(type => {
        context.dispatch('removeType', type)
      })
    }
  },
  getters: {
    byId: (state) => (id) => {
      return state.connections[id]
    },
    all: (state) => {
      return state.ids.map(id => state.connections[id])
    },
    typeByTypeId: (state) => (id) => {
      let type = state.types[id]
      return type
    },
    allTypes: (state) => {
      const typeIds = uniq(state.typeIds)
      return typeIds.map(id => state.types[id])
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
    },
    typesByCardId: (state, getters) => (cardId) => {
      const connections = getters.byCardId(cardId)
      const types = getters.allTypes
      const typeIds = connections.map(connection => connection.connectionTypeId)
      return types.filter(type => {
        return typeIds.includes(type.id)
      })
    },
    typeForNewConnections: (state, getters, rootState) => {
      const typeId = last(state.typeIds)
      return state.types[typeId]
    },
    typeByConnection: (state, getters) => (connection) => {
      return getters.typeByTypeId(connection.connectionTypeId)
    }
  }
}
