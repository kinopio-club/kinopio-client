import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useHistoryStore } from '@/stores/useHistoryStore'

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
    getAllConnections () {
      return this.allIds.map(id => this.byId[id])
    },
    getAllConnectionTypes () {
      return this.typeAllIds.map(id => this.typeById[id])
    },
    getNewConnectionType () {
      const userStore = useUserStore()
      const userId = userStore.id
      const shouldUseLastConnectionType = userStore.shouldUseLastConnectionType
      const connectionTypes = this.typeAllIds.map(id => this.typeById[id])
      let prevConnectionType
      if (this.prevConnectionTypeId) {
        prevConnectionType = this.typeById[this.prevConnectionTypeId]
      }
      if (shouldUseLastConnectionType) {
        return prevConnectionType || last(connectionTypes)
      } else {
        return last(connectionTypes)
      }
    },
    getAllConnectionsInViewport () {
      const elements = document.querySelectorAll('svg.connection')
      const paths = []
      elements.forEach(path => {
        if (path.dataset.isVisibleInViewport === 'false') { return }
        if (path.dataset.isHiddenByCommentFilter === 'true') { return }
        paths.push(path)
      })
      return paths
    }
  },

  actions: {

    getConnection (id) {
      return this.byId[id]
    },
    getConnectionType (id) {
      return this.typeById[id]
    },
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
      const spaceStore = useSpaceStore()
      startItem = startItem || spaceStore.getSpaceItemById(startItemId)
      endItem = endItem || spaceStore.getSpaceItemById(endItemId)
      if (!startItem || !endItem) { return }
      const start = utils.estimatedItemConnectorPosition(startItem)
      const end = estimatedEndItemConnectorPosition || utils.estimatedItemConnectorPosition(endItem)
      const path = this.getConnectionPathBetweenCoords(start, end, controlPoint)
      return path
    },
    getConnectionTypeByName (name) {
      const types = this.getAllConnectionTypes
      return types.find(type => type.name === name)
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
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const historyStore = useHistoryStore()
      // const broadcastStore = useBroadcastStore()
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
      connection.spaceId = spaceStore.id
      connection.userId = userStore.id
      connection.connectionTypeId = type.id
      this.addConnectionToState(connection)
      store.commit('triggerUpdateItemCurrentConnections', connection.endItemId, { root: true })
      store.commit('triggerUpdateItemCurrentConnections', connection.startItemId, { root: true })
      // if (!updates.isBroadcast) {
      // broadcastStore.update({ updates: connection, type: 'addConnection', handler: 'currentConnections/create' }, { root: true })
      // historyStore.add({ connections: [connection] }, { root: true })
      await apiStore.addToQueue({ name: 'createConnection', body: connection }, { root: true })
    },
    async createConnectionType (type) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      const isThemeDark = userStore.theme === 'dark'
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
      connectionType.userId = userStore.id
      this.addConnectionTypeToState(connectionType)
      this.prevConnectionTypeId = connectionType.id
      if (!connectionType.isBroadcast) {
        broadcastStore.update({ updates: connectionType, storeName: 'connectionStore', actionName: 'createConnectionType' }, { root: true })
      }
      await apiStore.addToQueue({ name: 'createConnectionType', body: connectionType }, { root: true })
      await cache.updateSpace('connectionsTypes', this.getAllConnectionTypes, spaceStore.id)
    },

    // update

    async updateConnections (updates) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      const canEditSpace = userStore.getUserCanEditSpace
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
        broadcastStore.update({ updates, storeName: 'connectionStore', actionName: 'updateConnections' }, { root: true })
      }
      await apiStore.addToQueue({ name: 'updateMultipleConnections', body: { connections: updates } }, { root: true })
      // TODO history? if unpaused
      await cache.updateSpace('connections', this.getAllConnections, spaceStore.id)
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
      const apiStore = useApiStore()
      const spaceStore = useSpaceStore()
      const connectionType = this.getConnectionType(update.id)
      const historyStore = useHistoryStore()
      // const broadcastStore = useBroadcastStore()
      const keys = Object.keys(update)
      keys.forEach(key => {
        connectionType[key] = update[key]
      })
      this.typeByIds[connectionType.id] = connectionType
      await cache.updateSpace('connectionTypes', this.getAllConnectionTypes, spaceStore.id)
      await apiStore.addToQueue({ name: 'updateConnectionType', body: connectionType }, { root: true })
      // historyStore.add({ connectionTypes: [type] }, { root: true })
      // if (!updates.isBroadcast) {
      // broadcastStore.update({ updates: type, type: 'updateConnectionType', handler: 'currentConnections/updateType' }, { root: true })
    },

    // remove

    async removeConnections (ids) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const historyStore = useHistoryStore()
      // const broadcastStore = useBroadcastStore()
      const canEditSpace = userStore.getUserCanEditSpace
      if (!canEditSpace) { return }
      for (const id of ids) {
        const idIndex = this.allIds.indexOf(id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[id]
        await apiStore.addToQueue({ name: 'removeConnection', body: { id } }, { root: true })
        // broadcastStore.update({ updates: connection, type: 'removeConnection', handler: 'currentConnections/remove' }, { root: true })
      }
      const connections = ids.map(id => this.getConnection(id))
      historyStore.add({ connections, isRemoved: true }, { root: true })
    },
    async removeConnection (id) {
      await this.removeConnections([id])
    },
    async removeAllUnusedConnectionTypes () {
      const apiStore = useApiStore()
      // const broadcastStore = useBroadcastStore()
      const connections = this.getAllConnections
      if (!utils.arrayHasItems(connections)) { return }
      const usedTypes = connections.map(connection => connection.connectionTypeId)
      let types = this.getAllConnectionTypes
      types = types.filter(type => Boolean(type))
      const typesToRemove = types.filter(type => !usedTypes.includes(type.id))
      for (const type of typesToRemove) {
        const idIndex = this.typeAllIds.indexOf(type.id)
        this.typeAllIds.splice(idIndex, 1)
        delete this.typeById[type.id]
        // broadcastStore.update({ updates: type, type: 'removeConnectionType', handler: 'currentConnections/removeType' }, { root: true })
        await apiStore.addToQueue({ name: 'removeConnectionType', body: type }, { root: true })
      }
    },
    removeConnectionsFromItems (itemIds) {
      const connections = this.getItemsConnections(itemIds)
      const connectionIds = connections.map(connection => connection.id)
      this.removeConnections(connectionIds)
    },
    removeConnectionsFromItem (itemId) {
      this.removeConnectionsFromItems([itemId])
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
