import { nextTick } from 'vue'
import { defineStore } from 'pinia'

import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

import { nanoid } from 'nanoid'
import randomColor from 'randomcolor'
import last from 'lodash-es/last'
import uniq from 'lodash-es/uniq'

export const useConnectionStore = defineStore('connections', {
  state: () => ({
    byId: {},
    allIds: [],
    typeById: {},
    typeAllIds: [],
    dirtyConnectionIds: new Set(),
    pendingUpdates: new Map(),
    isUpdating: false,
    prevConnectionTypeId: ''
  }),

  getters: {
    getConnection: (state) => {
      return (id) => state.byId[id]
    },
    getAllConnections: (state) => {
      return state.allIds.map(id => state.byId[id])
    },
    getVisibleConnections: (state) => {
      return (visibleIds) => visibleIds.map(id => state.byId[id])
    },
    getConnectionType: (state) => {
      return (id) => state.typeById[id]
    },
    getAllConnectionTypes: (state) => {
      return state.typeAllIds.map(id => state.typeById[id])
    },
    getNewConnectionType: (state) => {
      const userId = store.state.currentUser.id
      const shouldUseLastConnectionType = store.state.currentUser.shouldUseLastConnectionType
      const connectionTypes = state.typeAllIds.map(id => state.typeById[id])
      let prevConnectionType
      if (state.prevConnectionTypeId) {
        prevConnectionType = state.typeById[state.prevConnectionTypeId]
      }
      if (shouldUseLastConnectionType) {
        return prevConnectionType || last(connectionTypes)
      } else {
        return last(connectionTypes)
      }
    }

  },

  actions: {

    getItemsConnections (itemIds) {
      let connections = this.getAllConnections
      connections = connections.filter(connection => {
        const start = itemIds.includes(connection.startItemId)
        const end = itemIds.includes(connection.endItemId)
        return start || end
      })
      return connections
    },
    getItemConnections (itemId) {
      return this.getItemsConnections([itemId])
    },
    getItemConnectionTypes (itemId) {
      const connections = this.getItemConnections(itemId)
      const typeIds = connections.map(connection => connection.connectionTypeId)
      const connectionTypes = typeIds.map(id => this.getConnectionType(id))
      return connectionTypes
    },
    getConnectionConnectionType (connectionId) {
      const connection = this.getConnection(connectionId)
      const type = this.getConnectionType(connection.connectionTypeId)
      return type
    },
    getConnectionPathBetweenCoords (start, end, controlPoint) {
      if (!start || !end) { return }
      const delta = {
        x: parseInt(end.x - start.x),
        y: parseInt(end.y - start.y)
      }
      const curve = controlPoint || consts.defaultConnectionPathCurveControlPoint
      return `m${start.x},${start.y} ${curve} ${delta.x},${delta.y}`
    },
    getConnectionPathBetweenItems ({ startItem, endItem, startItemId, endItemId, controlPoint, estimatedEndItemConnectorPosition }) {
      startItem = startItem || store.getters['currentSpace/itemById'](startItemId)
      endItem = endItem || store.getters['currentSpace/itemById'](endItemId)
      if (!startItem || !endItem) { return }
      const start = utils.estimatedItemConnectorPosition(startItem)
      const end = estimatedEndItemConnectorPosition || utils.estimatedItemConnectorPosition(endItem)
      const path = this.getConnectionPathBetweenCoords(start, end, controlPoint)
      return path
    },

    // init

    clear () {
      this.byId = []
      this.allIds = {}
      this.typeById = []
      this.typeAllIds = {}
    },
    initializeConnections (connections) {
      const byId = {}
      const allIds = []
      connections.forEach(connection => {
        byId[connection.id] = connection
        allIds.push(connection.id)
      })
      this.byId = byId
      this.allIds = allIds
    },
    initializeConnectionTypes (connectionTypes) {
      const byId = {}
      const allIds = []
      connectionTypes.forEach(type => {
        byId[type.id] = type
        allIds.push(type.id)
      })
      this.typeById = byId
      this.typeAllIds = allIds
    },

    // update

    async updateConnections (updates) {
      const canEditSpace = store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      updates.forEach(({ id, ...changes }) => {
        this.pendingUpdates.set(id, {
          ...this.pendingUpdates.get(id) || {},
          ...changes
        })
        this.dirtyConnectionIds.add(id)
      })
      if (!this.isUpdating) {
        requestAnimationFrame(() => this.processPendingUpdates())
        this.isUpdating = true
      }
      // server tasks
      if (!updates.isBroadcast) {
        store.dispatch('broadcast/update', { updates, storeName: 'connectionStore', actionName: 'updateConnections' }, { root: true })
      }
      await store.dispatch('api/addToQueue', { name: 'updateMultipleConnections', body: { connections: updates } }, { root: true })
      // TODO history? if unpaused
      await cache.updateSpace('connections', this.getAllConnections, store.state.currentSpace.id)

      // if (update.name) // updates contain name or pos? or just always do it
      // await nextTick()
      // await nextTick()
      // store.dispatch('currentConnections/updatePaths', { itemId: card.id }) // TODO search to remove excess updatepaths
    },
    updateConnection (update) {
      this.updateConnections([update])
    },
    processPendingUpdates () {
      const updatedConnections = {}
      this.pendingUpdates.forEach((updates, id) => {
        updatedConnections[id] = {
          ...this.byId[id],
          ...updates
        }
      })
      // Batch state update
      this.byId = {
        ...this.byId,
        ...updatedConnections
      }
      // Clear queues
      this.pendingUpdates.clear()
      this.dirtyConnectionIds.clear()
      this.isUpdating = false
    },
    updatePrevConnectionTypeId (id) {
      this.prevConnectionTypeId = id
    },
    async updateConnectionType (update) {
      const connectionType = this.getConnectionType(update.id)
      const keys = Object.keys(update)
      keys.forEach(key => {
        connectionType[key] = update[key]
      })
      this.typeByIds[connectionType.id] = connectionType
      await cache.updateSpace('connectionTypes', this.getAllConnectionTypes, store.state.currentSpace.id)
      await store.dispatch('api/addToQueue', { name: 'updateConnectionType', body: connectionType }, { root: true })
      // context.dispatch('history/add', { connectionTypes: [type] }, { root: true })
      // if (!updates.isBroadcast) {
      // context.dispatch('broadcast/update', { updates: type, type: 'updateConnectionType', handler: 'currentConnections/updateType' }, { root: true })
    },

    // create

    addConnectionToState (connection) {
      this.byId[connection.id] = connection
      this.allIds.push(connection.id)
    },
    addConnectionTypeToState (type) {
      this.typeById[type.id] = type
      this.typeAllIds.push(type.id)
    },
    async createConnection (connection) {
      const connections = this.getAllConnections
      const isExistingConnection = connections.find(item => {
        const isStart = item.startItemId === connection.startItemId
        const isEnd = item.endItemId === connection.endItemId
        return isStart && isEnd
      })
      if (isExistingConnection) { return }
      if (connection.startItemId === connection.endItemId) { return }
      const type = connection.type || this.getNewConnectionType
      connection.id = connection.id || nanoid()
      connection.spaceId = store.state.currentSpace.id
      connection.userId = store.state.currentUser.id
      connection.connectionTypeId = type.id
      this.addConnectionToState(connection)
      store.commit('triggerUpdateItemCurrentConnections', connection.endItemId, { root: true })
      store.commit('triggerUpdateItemCurrentConnections', connection.startItemId, { root: true })
      // if (!updates.isBroadcast) {
      // store.dispatch('broadcast/update', { updates: connection, type: 'addConnection', handler: 'currentConnections/create' }, { root: true })
      // store.dispatch('history/add', { connections: [connection] }, { root: true })
      await store.dispatch('api/addToQueue', { name: 'createConnection', body: connection }, { root: true })
    },
    async createConnectionType (type) {
      const isThemeDark = store.state.currentUser.theme === 'dark'
      let color = randomColor({ luminosity: 'light' })
      if (isThemeDark) {
        color = randomColor({ luminosity: 'dark' })
      }
      const connectionType = {
        id: nanoid(),
        name: `Connection Type ${this.typeAllIds.length + 1}`,
        color,
        spaceId: store.currentSpace.id
      }
      if (type) {
        const keys = Object.keys(type)
        keys.forEach(key => {
          connectionType[key] = type[key]
        })
      }
      connectionType.userId = store.state.currentUser.id
      this.addConnectionTypeToState(connectionType)
      this.prevConnectionTypeId = connectionType.id
      if (!connectionType.isBroadcast) {
        store.dispatch('broadcast/update', { updates: connectionType, storeName: 'connectionStore', actionName: 'createConnectionType' }, { root: true })
      }
      await store.dispatch('api/addToQueue', { name: 'createConnectionType', body: connectionType }, { root: true })
      await cache.updateSpace('connectionsTypes', this.getAllConnectionTypes, store.state.currentSpace.id)
    },

    // remove

    async deleteConnections (connections) {
      const canEditSpace = store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      for (const connection of connections) {
        const idIndex = this.allIds.indexOf(connection.id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[connection.id]
        await store.dispatch('api/addToQueue', { name: 'removeConnection', body: connection }, { root: true })
      }
    },
    async deleteConnection (connection) {
      await this.deleteConnections([connection])
    },
    removeConnections (ids) {
      const connections = ids.map(id => this.getConnection(id))
      this.deleteConnections(connections)
      // await context.dispatch('api/addToQueue', { name: 'removeConnection', body: connection }, { root: true })
      // context.dispatch('broadcast/update', { updates: connection, type: 'removeConnection', handler: 'currentConnections/remove' }, { root: true })
      // context.dispatch('history/add', { connections: [connection], isRemoved: true }, { root: true })
    },
    removeConnection (id) {
      this.removeConnections([id])
    },
    async deleteConnectionTypes (ids) {
      const types = ids.map(id => this.getConnectionType(id))
      for (const type of types) {
        const idIndex = this.typeAllIds.indexOf(type.id)
        this.typeAllIds.splice(idIndex, 1)
        delete this.typeById[type.id]
        await store.dispatch('api/addToQueue', { name: 'removeConnection', body: type }, { root: true })
      }
    },
    removeAllUnusedConnectionTypes () {
      const connections = this.getAllConnections
      if (!utils.arrayHasItems(connections)) { return }
      const usedTypes = connections.map(connection => connection.connectionTypeId)
      let types = this.getAllConnectionTypes
      types = types.filter(type => Boolean(type))
      const typesToRemove = types.filter(type => !usedTypes.includes(type.id))
      typesToRemove.forEach(type => {
        this.deleteConnectionTypes([type.id])
      })
    },

    // path

    async updateConnectionPaths (itemIds) {
      const connections = this.getItemsConnections(itemIds)
      const updates = []
      connections.forEach(connection => {
        const startItem = utils.itemElementDimensions({ id: connection.startItemId })
        const endItem = utils.itemElementDimensions({ id: connection.endItemId })
        const path = this.getConnectionPathBetweenItems({
          startItem,
          endItem,
          controlPoint: connection.controlPoint
        })
        if (!path) { return }
        const update = {
          id: connection.id,
          path
        }
        updates.push(update)
      })
      this.updateConnections(updates)
      store.commit('clearShouldExplicitlyRenderCardIds', null, { root: true })
    },
    updateConnectionPath (itemId) {
      this.updateConnectionPaths([itemId])
    },

    // label

    async updateConnectionLabelPosition ({ id, labelRelativePositionX, labelRelativePositionY }) {
      const prevConnection = this.getConnection(id)
      if (utils.isUndefinedOrNull(labelRelativePositionX)) {
        labelRelativePositionX = utils.roundFloat(prevConnection.labelRelativePositionX)
      }
      if (utils.isUndefinedOrNull(labelRelativePositionY)) {
        labelRelativePositionY = utils.roundFloat(prevConnection.labelRelativePositionY)
      }
      const update = {
        id,
        labelRelativePositionX,
        labelRelativePositionY
      }
      this.updateConnection(update)
    },
    clearConnectionLabelPosition (id) {
      const update = {
        id,
        labelRelativePositionX: 0.5,
        labelRelativePositionY: 0.5
      }
      this.updateConnection(update)
    }

  }
})
