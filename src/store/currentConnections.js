import utils from '@/utils.js'
import cache from '@/cache.js'

import { nanoid } from 'nanoid'
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
      let ids = []
      connections.forEach(connection => {
        ids.push(connection.id)
        state.connections[connection.id] = connection
      })
      state.ids = state.ids.concat(ids)
    },
    restoreTypes: (state, types) => {
      let typeIds = []
      types.forEach(type => {
        typeIds.push(type.id)
        state.types[type.id] = type
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
    updatePath: (state, { connection, path }) => {
      state.connections[connection.id].path = path
      state.connections[connection.id].spaceId = currentSpaceId
      cache.updateSpaceConnectionsDebounced(state.connections, currentSpaceId)
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

    // broadcast

    updatePathsWhileDraggingBroadcast: (state, { connections, paths }) => {
      if (!paths) { return }
      connections.forEach(connection => {
        const path = paths.find(path => path.id === connection.id).path
        state.connections[connection.id].path = path
      })
    },
    updatePathsBroadcast: (state, { connections }) => {
      connections.forEach(connection => {
        state.connections[connection.id].path = connection.path
      })
      cache.updateSpaceConnectionsDebounced(state.connections, currentSpaceId)
    },

    // remove

    remove: (state, connectionToRemove) => {
      if (!connectionToRemove) { return }
      const connection = state.connections[connectionToRemove.id]
      if (!connection) { return }
      let ids = utils.clone(state.ids)
      ids = ids.filter(id => id !== connection.id)
      state.ids = ids
      delete state.connections[connectionToRemove.id]
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

    add: (context, { connection, type, shouldNotRecordHistory }) => {
      const isExistingPath = context.getters.isExistingPath({
        startCardId: connection.startCardId,
        endCardId: connection.endCardId
      })
      if (isExistingPath) { return }
      if (connection.startCardId === connection.endCardId) { return }
      type = type || context.getters.typeForNewConnections
      connection.id = connection.id || nanoid()
      connection.spaceId = currentSpaceId
      connection.userId = context.rootState.currentUser.id
      connection.connectionTypeId = type.id
      context.dispatch('api/addToQueue', { name: 'createConnection', body: connection }, { root: true })
      context.dispatch('broadcast/update', { updates: connection, type: 'addConnection', handler: 'currentConnections/create' }, { root: true })
      if (!shouldNotRecordHistory) {
        context.dispatch('history/add', { connections: [connection] }, { root: true })
      }
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
      context.dispatch('broadcast/update', { updates: connectionType, type: 'addConnectionType', handler: 'currentConnections/createType' }, { root: true })
      context.dispatch('api/addToQueue', { name: 'createConnectionType', body: connectionType }, { root: true })
    },

    // update

    update: (context, connection) => {
      context.dispatch('history/add', { connections: [connection] }, { root: true })
      context.commit('update', connection)
      context.dispatch('api/addToQueue', { name: 'updateConnection', body: connection }, { root: true })
      context.dispatch('broadcast/update', { updates: connection, type: 'updateConnectionTypeForConnection', handler: 'currentConnections/update' }, { root: true })
    },
    updatePaths: (context, { cardId, shouldUpdateApi, connections }) => {
      connections = utils.clone(connections || context.getters.byCardId(cardId))
      connections.map(connection => {
        connection.path = context.getters.connectionBetweenCards(connection.startCardId, connection.endCardId, connection.controlPoint)
        connection.spaceId = currentSpaceId
        if (shouldUpdateApi) {
          context.dispatch('api/addToQueue', { name: 'updateConnection', body: connection }, { root: true })
        }
        const userCanEdit = context.rootGetters['currentUser/canEditSpace']()
        if (userCanEdit) {
          context.dispatch('broadcast/update', { updates: connection, type: 'updateConnection', handler: 'currentConnections/update' }, { root: true })
          context.commit('update', connection)
        } else {
          context.commit('updateReadOnly', connection)
        }
      })
    },
    updatePathsWhileDragging: (context, { connections }) => {
      const paths = connections.map(connection => {
        const path = context.getters.connectionBetweenCards(connection.startCardId, connection.endCardId, connection.controlPoint)
        const element = document.querySelector(`svg .connection-path[data-id='${connection.id}']`)
        element.setAttribute('d', path)
        return {
          id: connection.id,
          path
        }
      })
      context.dispatch('broadcast/update', { updates: { connections, paths }, type: 'updateConnection', handler: 'currentConnections/updatePathsWhileDraggingBroadcast' }, { root: true })
    },
    correctPaths: (context, { shouldUpdateApi }) => {
      if (!context.rootState.webfontIsLoaded) { return }
      if (!context.getters.all.length) { return }
      let connections = []
      context.getters.all.forEach(connection => {
        const path = context.getters.connectionBetweenCards(connection.startCardId, connection.endCardId, connection.controlPoint)
        if (!path) { return }
        if (path === connection.path) { return }
        connections.push(connection)
      })
      context.dispatch('updatePaths', { connections, shouldUpdateApi })
    },
    updateType: (context, type) => {
      context.dispatch('history/add', { connectionTypes: [type] }, { root: true })
      context.commit('updateType', type)
      context.dispatch('broadcast/update', { updates: type, type: 'updateConnectionType', handler: 'currentConnections/updateType' }, { root: true })
      context.dispatch('api/addToQueue', { name: 'updateConnectionType', body: type }, { root: true })
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
      context.dispatch('api/addToQueue', { name: 'removeConnection', body: connection }, { root: true })
      context.dispatch('broadcast/update', { updates: connection, type: 'removeConnection', handler: 'currentConnections/remove' }, { root: true })
      context.commit('remove', connection)
      context.dispatch('history/add', { connections: [connection], isRemoved: true }, { root: true })
    },
    removeType: (context, type) => {
      context.dispatch('api/addToQueue', { name: 'removeConnectionType', body: type }, { root: true })
      context.dispatch('broadcast/update', { updates: type, type: 'removeConnectionType', handler: 'currentConnections/removeType' }, { root: true })
      context.commit('removeType', type)
    },
    removeUnusedTypes: (context) => {
      const connections = context.getters.all
      let usedTypes = connections.map(connection => connection.connectionTypeId)
      let types = context.getters.allTypes
      types = types.filter(type => Boolean(type))
      const typesToRemove = types.filter(type => !usedTypes.includes(type.id))
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
      let types = getters.allTypes
      types = types.filter(type => Boolean(type))
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
    },
    typeOrTypeForNewConnections: (state, getters) => (typeId) => {
      if (getters.typeByTypeId(typeId)) {
        return typeId
      } else {
        return getters.typeForNewConnections
      }
    },
    existingTypeByData: (state, getters) => (type) => {
      let connectionTypes = getters.allTypes
      const existingType = connectionTypes.find(connectionType => {
        const isColor = connectionType.color === type.color
        const isName = connectionType.name === type.name
        return isColor && isName
      })
      return existingType
    },

    // path utils

    isExistingPath: (state, getters) => ({ startCardId, endCardId }) => {
      const connections = getters.all
      const existing = connections.filter(connection => {
        let start = connection.startCardId === startCardId
        let end = connection.endCardId === endCardId
        return start && end
      })
      return Boolean(existing.length)
    },
    connectionBetweenCards: (state, getters) => (startCardId, endCardId, controlPoint) => {
      let start = utils.connectorCoords(startCardId)
      start = utils.cursorPositionInSpace({ position: start })
      let end = utils.connectorCoords(endCardId)
      end = utils.cursorPositionInSpace({ position: end })
      return getters.connectionPathBetweenCoords(start, end, controlPoint)
    },
    curveControlPoint: (state, getters, rootState) => {
      // q defines a quadratic curve control point
      let controlPoint = 'q90,40'
      return controlPoint
    },
    connectionPathBetweenCoords: (state, getters) => (start, end, controlPoint) => {
      if (!start || !end) { return }
      // const offsetStart = utils.coordsWithCurrentScrollOffset(start)
      // const offsetEnd = utils.coordsWithCurrentScrollOffset(end)
      const delta = {
        x: parseInt(end.x - start.x),
        y: parseInt(end.y - start.y)
      }
      let curve = controlPoint || getters.curveControlPoint
      return `m${start.x},${start.y} ${curve} ${delta.x},${delta.y}`
    }

  }
}
