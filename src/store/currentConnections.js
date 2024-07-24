import utils from '@/utils.js'
import consts from '@/consts.js'
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
    types: {},
    lastTypeId: ''
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
    updatePathsWhileDragging: (state, connections) => {
      connections.forEach(connection => {
        const connectionElement = document.querySelector(`svg.connection[data-id="${connection.id}"]`)
        const pathElement = connectionElement.querySelector('path')
        if (!pathElement) { return }
        pathElement.setAttribute('d', connection.path)
      })
    },
    updateType: (state, type) => {
      const keys = Object.keys(type)
      keys.forEach(key => {
        state.types[type.id][key] = type[key]
      })
      cache.updateSpace('connectionTypes', state.types, currentSpaceId)
    },
    lastTypeId: (state, id) => {
      state.lastTypeId = id
    },

    // broadcast

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
        startItemId: connection.startItemId,
        endItemId: connection.endItemId
      })
      if (isExistingPath) { return }
      if (connection.startItemId === connection.endItemId) { return }
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
      context.commit('triggerUpdateItemCurrentConnections', connection.endItemId, { root: true })
    },
    addType: (context, type) => {
      const isThemeDark = context.rootState.currentUser.theme === 'dark'
      let color = randomColor({ luminosity: 'light' })
      if (isThemeDark) {
        color = randomColor({ luminosity: 'dark' })
      }
      let connectionType = {
        id: nanoid(),
        name: `Connection Type ${context.state.typeIds.length + 1}`,
        color,
        spaceId: context.rootState.currentSpace.id
      }
      if (type) {
        const keys = Object.keys(type)
        keys.forEach(key => {
          connectionType[key] = type[key]
        })
      }
      connectionType.userId = context.rootState.currentUser.id
      context.commit('createType', connectionType)
      context.commit('lastTypeId', connectionType.id)
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
    updatePaths: (context, { itemId, connections }) => {
      const canEditSpace = context.rootGetters['currentUser/canEditSpace']()
      connections = connections || context.getters.byItemId(itemId)
      connections.map(connection => {
        const startItem = utils.itemElementDimensions({ id: connection.startItemId })
        const endItem = utils.itemElementDimensions({ id: connection.endItemId })
        const path = context.getters.connectionPathBetweenItems({
          startItem,
          endItem,
          controlPoint: connection.controlPoint
        })
        const newConnection = {
          id: connection.id,
          path
        }
        context.dispatch('api/addToQueue', { name: 'updateConnection', body: newConnection }, { root: true })
        if (canEditSpace) {
          context.dispatch('broadcast/update', { updates: newConnection, type: 'updateConnection', handler: 'currentConnections/update' }, { root: true })
          context.commit('update', newConnection)
        } else {
          context.commit('updateReadOnly', newConnection)
        }
      })
      context.commit('clearShouldExplicitlyRenderCardIds', null, { root: true })
    },
    updateMultiplePaths: (context, items) => {
      const canEditSpace = context.rootGetters['currentUser/canEditSpace']()
      const itemIds = items.map(item => item.id)
      const connections = context.getters.byMultipleItemIds(itemIds)
      if (!connections.length) { return }
      let newConnections = []
      // update state
      connections.forEach(connection => {
        const startItem = utils.itemElementDimensions({ id: connection.startItemId })
        const endItem = utils.itemElementDimensions({ id: connection.endItemId })
        const path = context.getters.connectionPathBetweenItems({
          startItem,
          endItem,
          controlPoint: connection.controlPoint
        })
        if (!path) { return }
        const newConnection = {
          id: connection.id,
          path
        }
        newConnections.push(newConnection)
        if (canEditSpace) {
          context.dispatch('broadcast/update', { updates: newConnection, type: 'updateConnection', handler: 'currentConnections/update' }, { root: true })
          context.commit('update', newConnection)
        } else {
          context.commit('updateReadOnly', newConnection)
        }
      })
      // update api
      if (canEditSpace) {
        context.dispatch('api/addToQueue', {
          name: 'updateMultipleConnections',
          body: {
            connections: newConnections,
            spaceId: context.rootState.currentSpace.id
          }
        }, { root: true })
      }
      context.commit('clearShouldExplicitlyRenderCardIds', null, { root: true })
    },
    updatePathsWhileDragging: (context, { connections }) => {
      let newConnections = []
      connections = connections.forEach(connection => {
        const startItem = utils.itemElementDimensions({ id: connection.startItemId })
        const endItem = utils.itemElementDimensions({ id: connection.endItemId })
        const path = context.getters.connectionPathBetweenItems({
          startItem,
          endItem,
          controlPoint: connection.controlPoint
        })
        if (!path) { return }
        const newConnection = {
          id: connection.id,
          path
        }
        newConnections.push(newConnection)
      })
      context.commit('updatePathsWhileDragging', newConnections)
      context.commit('triggerUpdatePathWhileDragging', newConnections, { root: true })
      context.dispatch('broadcast/update', { updates: { connections: newConnections }, type: 'updateConnection', handler: 'currentConnections/updatePathsBroadcast' }, { root: true })
    },
    correctPaths: (context) => {
      if (!context.rootState.webfontIsLoaded) { return }
      if (!context.getters.all.length) { return }
      let connections = []
      context.getters.all.forEach(connection => {
        const path = context.getters.connectionPathBetweenItems({
          startItemId: connection.startItemId,
          endItemId: connection.endItemId,
          controlPoint: connection.controlPoint
        })
        if (!path) { return }
        if (path === connection.path) { return }
        connections.push(connection)
      })
      context.dispatch('updatePaths', { connections })
    },
    updateType: (context, type) => {
      context.dispatch('history/add', { connectionTypes: [type] }, { root: true })
      context.commit('updateType', type)
      context.dispatch('broadcast/update', { updates: type, type: 'updateConnectionType', handler: 'currentConnections/updateType' }, { root: true })
      context.dispatch('api/addToQueue', { name: 'updateConnectionType', body: type }, { root: true })
    },
    updateLabelPosition: (context, { connection, labelRelativePositionX, labelRelativePositionY }) => {
      const prevConnection = context.getters.byId(connection.id)
      // normalize
      if (utils.isUndefinedOrNull(labelRelativePositionX)) {
        labelRelativePositionX = utils.roundFloat(prevConnection.labelRelativePositionX)
      }
      if (utils.isUndefinedOrNull(labelRelativePositionY)) {
        labelRelativePositionY = utils.roundFloat(prevConnection.labelRelativePositionY)
      }
      // update
      const item = {
        id: connection.id,
        labelRelativePositionX,
        labelRelativePositionY
      }
      context.commit('update', item)
      context.dispatch('broadcast/update', { updates: item, type: 'updateConnection', handler: 'currentConnections/update' }, { root: true })
      context.dispatch('api/addToQueue', { name: 'updateConnection', body: item }, { root: true })
    },
    clearLabelPosition: (context, connection) => {
      context.dispatch('updateLabelPosition', {
        connection,
        labelRelativePositionX: 0.5,
        labelRelativePositionY: 0.5
      })
    },

    // remove

    removeFromItem: (context, item) => {
      context.getters.all.forEach(connection => {
        if (connection.startItemId === item.id || connection.endItemId === item.id) {
          context.dispatch('remove', connection)
        }
      })
    },
    removeFromSelectedItem: (context, itemId) => {
      const multipleItemsSelectedIds = context.rootState.multipleCardsSelectedIds.concat(context.rootState.multipleBoxesSelectedIds)
      const connections = context.getters.all
      connections.map(connection => {
        const { startItemId, endItemId } = connection
        const start = startItemId === itemId && multipleItemsSelectedIds.includes(endItemId)
        const end = endItemId === itemId && multipleItemsSelectedIds.includes(startItemId)
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
      if (!utils.arrayHasItems(connections)) { return }
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
    byItemId: (state, getters, rootState, rootGetters) => (itemId) => {
      let connections = getters.all
      connections = connections.filter(connection => {
        let start = connection.startItemId === itemId
        let end = connection.endItemId === itemId
        return start || end
      })
      connections = getters.connectionsWithValidItems(connections)
      return connections
    },
    byMultipleItemIds: (state, getters, rootState, rootGetters) => (itemIds) => {
      let connections = getters.all
      connections = connections.filter(connection => {
        let start = itemIds.includes(connection.startItemId)
        let end = itemIds.includes(connection.endItemId)
        return start || end
      })
      return connections
    },
    typesByItemId: (state, getters, rootState, rootGetters) => (itemId) => {
      let connections = getters.byItemId(itemId)
      let types = getters.allTypes
      types = types.filter(type => Boolean(type))
      connections = getters.connectionsWithValidItems(connections)
      const typeIds = connections.map(connection => connection.connectionTypeId)
      return types.filter(type => {
        return typeIds.includes(type.id)
      })
    },
    isSelected: (state, getters, rootState) => {
      let connectionIds = rootState.multipleConnectionsSelectedIds
      const connections = connectionIds.map(id => getters.byId(id))
      return connections
    },
    isSelectableInViewport: (state, getters) => () => {
      const elements = document.querySelectorAll('svg.connection')
      let paths = []
      elements.forEach(path => {
        if (path.dataset.isVisibleInViewport === 'false') { return }
        if (path.dataset.isHiddenByCommentFilter === 'true') { return }
        paths.push(path)
      })
      return paths
    },
    connectionsWithValidItems: (state, getters, rootState, rootGetters) => (connections) => {
      connections = connections.filter(connection => {
        const startItem = rootGetters['currentCards/byId'](connection.startItemId) || rootGetters['currentBoxes/byId'](connection.startItemId)
        const endItem = rootGetters['currentCards/byId'](connection.endItemId) || rootGetters['currentBoxes/byId'](connection.endItemId)
        return startItem && endItem
      })
      return connections
    },
    typeForNewConnections: (state, getters, rootState, rootGetters) => {
      const userId = rootState.currentUser.id
      const shouldUseLastConnectionType = rootState.currentUser.shouldUseLastConnectionType
      let types = getters.allTypes
      types = types.filter(type => type.userId === userId)
      if (shouldUseLastConnectionType) {
        return getters.lastType
      } else {
        return last(types)
      }
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
    lastType: (state, getters) => {
      const id = state.lastTypeId || last(state.typeIds)
      let type = getters.typeByTypeId(id)
      return type
    },

    // path utils

    isExistingPath: (state, getters) => ({ startItemId, endItemId }) => {
      const connections = getters.all
      const existing = connections.filter(connection => {
        let start = connection.startItemId === startItemId
        let end = connection.endItemId === endItemId
        return start && end
      })
      return Boolean(existing.length)
    },
    connectionPathBetweenItems: (state, getters, rootState, rootGetters) => ({ startItem, endItem, startItemId, endItemId, controlPoint, estimatedEndItemConnectorPosition }) => {
      startItem = startItem || rootGetters['currentSpace/itemById'](startItemId)
      endItem = endItem || rootGetters['currentSpace/itemById'](endItemId)
      if (!startItem || !endItem) { return }
      const start = utils.estimatedItemConnectorPosition(startItem)
      const end = estimatedEndItemConnectorPosition || utils.estimatedItemConnectorPosition(endItem)
      const path = getters.connectionPathBetweenCoords(start, end, controlPoint)
      return path
    },
    curveControlPoint: (state, getters, rootState) => {
      // q defines a quadratic curve control point
      let controlPoint = consts.defaultConnectionPathCurveControlPoint
      return controlPoint
    },
    connectionPathBetweenCoords: (state, getters) => (start, end, controlPoint) => {
      if (!start || !end) { return }
      const delta = {
        x: parseInt(end.x - start.x),
        y: parseInt(end.y - start.y)
      }
      let curve = controlPoint || getters.curveControlPoint
      return `m${start.x},${start.y} ${curve} ${delta.x},${delta.y}`
    }

  }
}
