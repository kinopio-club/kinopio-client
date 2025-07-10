import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

import { nanoid } from 'nanoid'
import randomColor from 'randomcolor'
import last from 'lodash-es/last'
import uniq from 'lodash-es/uniq'
import uniqBy from 'lodash-es/uniqBy'

export const useConnectionStore = defineStore('connections', {
  state: () => ({
    byId: {},
    allIds: [],
    typeById: {},
    typeAllIds: [],
    prevConnectionTypeId: '',
    // indexes
    byStartItemId: {}, // { itemId: [ id1, id2 ] }
    byEndItemId: {}
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
    getConnections (ids) {
      let connections = ids.map(id => this.getConnection(id))
      connections = connections.filter(connection => Boolean(connection))
      return connections
    },
    getConnectionType (id) {
      return this.typeById[id]
    },
    getConnectionByStartItemId (itemId) {
      const ids = this.byStartItemId[itemId] || []
      return ids.map(id => this.getConnection(id))
    },
    getConnectionByEndItemId (itemId) {
      const ids = this.byEndItemId[itemId] || []
      return ids.map(id => this.getConnection(id))
    },
    getConnectionsByItemIds (itemIds) {
      let connections = []
      itemIds.forEach(itemId => {
        const startMatches = this.getConnectionByStartItemId(itemId)
        const endMatches = this.getConnectionByEndItemId(itemId)
        startMatches.forEach(match => connections.push(match))
        endMatches.forEach(match => connections.push(match))
      })
      connections = uniqBy(connections, 'id')
      return connections
    },
    getConnectionsByItemId (itemId) {
      return this.getConnectionsByItemIds([itemId])
    },
    getItemConnectionTypes (itemId) {
      const connections = this.getConnectionsByItemId(itemId)
      const typeIds = connections.map(connection => connection.connectionTypeId)
      const connectionTypes = typeIds.map(id => this.getConnectionType(id))
      return connectionTypes
    },
    getConnectionTypeByConnectionId (connectionId) {
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
      const type = types.find(type => type.name === name)
      return type
    },

    // init

    initializeConnections (connections = []) {
      const byId = {}
      const allIds = []
      const byStartItemId = {}
      const byEndItemId = {}
      connections.forEach(connection => {
        byId[connection.id] = connection
        allIds.push(connection.id)
        // init arrays for indexes
        if (!byStartItemId[connection.startItemId]) {
          byStartItemId[connection.startItemId] = []
        }
        if (!byEndItemId[connection.endItemId]) {
          byEndItemId[connection.endItemId] = []
        }
        // add to indexes
        byStartItemId[connection.startItemId].push(connection.id)
        byEndItemId[connection.endItemId].push(connection.id)
      })
      this.byId = byId
      this.allIds = allIds
      this.byStartItemId = byStartItemId
      this.byEndItemId = byEndItemId
    },
    initializeConnectionTypes (connectionTypes = []) {
      const byId = {}
      const allIds = []
      connectionTypes.forEach(type => {
        byId[type.id] = type
        allIds.push(type.id)
      })
      this.typeById = byId
      this.typeAllIds = allIds
    },

    // indexes

    removeFromIndexes (connection) {
      const { startItemId, endItemId, id } = connection
      const removeId = (array) => array.filter(prevId => prevId !== id)
      // remove from byStartItemId
      if (this.byStartItemId[startItemId]) {
        this.byStartItemId[startItemId] = removeId(this.byStartItemId[startItemId])
      }
      if (this.byStartItemId[endItemId]) {
        this.byStartItemId[endItemId] = removeId(this.byStartItemId[endItemId])
      }
      // remove from byEndItemId
      if (this.byEndItemId[startItemId]) {
        this.byEndItemId[startItemId] = removeId(this.byEndItemId[startItemId])
      }
      if (this.byEndItemId[endItemId]) {
        this.byEndItemId[endItemId] = removeId(this.byEndItemId[endItemId])
      }
    },
    addToIndexes (connection) {
      // add startItemId
      this.byStartItemId[connection.startItemId] = this.byStartItemId[connection.startItemId] || []
      this.byStartItemId[connection.startItemId].push(connection.id)
      // add endItemId
      this.byEndItemId[connection.endItemId] = this.byEndItemId[connection.endItemId] || []
      this.byEndItemId[connection.endItemId].push(connection.id)
      // remove duplicates
      this.byStartItemId[connection.startItemId] = uniq(this.byStartItemId[connection.startItemId])
      this.byEndItemId[connection.endItemId] = uniq(this.byEndItemId[connection.endItemId])
    },
    updateIndexes (connection) {
      this.removeFromIndexes(connection)
      this.addToIndexes(connection)
    },

    // create

    addConnectionToState (connection) {
      const globalStore = useGlobalStore()
      this.byId[connection.id] = connection
      this.allIds.push(connection.id)
      // init arrays for indexes
      if (!this.byStartItemId[connection.startItemId]) {
        this.byStartItemId[connection.startItemId] = []
      }
      if (!this.byEndItemId[connection.endItemId]) {
        this.byEndItemId[connection.endItemId] = []
      }
      this.addToIndexes(connection)
      globalStore.removeRemoteCurrentConnection(connection)
    },
    addConnectionTypeToState (type) {
      this.typeById[type.id] = type
      this.typeAllIds.push(type.id)
    },
    async createConnection (connection) {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
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
      broadcastStore.update({ updates: connection, store: 'connectionStore', action: 'addConnectionToState' })
      await apiStore.addToQueue({ name: 'createConnection', body: connection })
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
        spaceId: spaceStore.id
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
      if (connectionType.isFromBroadcast) { return }
      broadcastStore.update({ updates: connectionType, store: 'connectionStore', action: 'addConnectionTypeToState' })
      await apiStore.addToQueue({ name: 'createConnectionType', body: connectionType })
      await cache.updateSpace('connectionsTypes', this.getAllConnectionTypes, spaceStore.id)
    },

    // update

    updateConnectionsState (updates) {
      updates.forEach(update => {
        this.byId[update.id] = {
          ...this.byId[update.id],
          ...update
        }
        const shouldUpdateIndexes = update.startItemId || update.endItemId
        if (shouldUpdateIndexes) {
          this.updateIndexes(update)
        }
      })
    },
    async updateConnections (updates) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      if (!userStore.getUserCanEditSpace) { return }
      this.updateConnectionsState(updates)
      broadcastStore.update({ updates, store: 'connectionStore', action: 'updateConnectionsState' })
      await apiStore.addToQueue({ name: 'updateMultipleConnections', body: { connections: updates } })
      await cache.updateSpace('connections', this.getAllConnections, spaceStore.id)
    },
    updateConnection (update) {
      this.updateConnections([update])
    },
    updatePrevConnectionTypeId (id) {
      this.prevConnectionTypeId = id
    },
    updateConnectionTypeState (update) {
      const connectionType = this.getConnectionType(update.id)
      const keys = Object.keys(update)
      keys.forEach(key => {
        connectionType[key] = update[key]
      })
      this.typeById[connectionType.id] = connectionType
    },
    async updateConnectionType (update) {
      const apiStore = useApiStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      this.updateConnectionTypeState(update)
      broadcastStore.update({ updates: update, store: 'connectionStore', action: 'updateConnectionTypeState' })
      await apiStore.addToQueue({ name: 'updateConnectionType', body: update })
      await cache.updateSpace('connectionTypes', this.getAllConnectionTypes, spaceStore.id)
    },

    // remove

    removeConnectionsState (ids) {
      for (const id of ids) {
        // remove from indexes
        const connection = this.getConnection(id)
        if (!connection) { return }
        if (this.byStartItemId[connection.startItemId]) {
          this.byStartItemId[connection.startItemId] = this.byStartItemId[connection.startItemId]
            .filter(id => id !== connection.id)
        }
        if (this.byEndItemId[connection.endItemId]) {
          this.byEndItemId[connection.endItemId] = this.byEndItemId[connection.endItemId]
            .filter(id => id !== connection.id)
        }
        // remove from state
        const idIndex = this.allIds.indexOf(id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[id]
      }
    },
    async removeConnections (ids) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      const canEditSpace = userStore.getUserCanEditSpace
      if (!canEditSpace) { return }
      this.removeConnectionsState(ids)
      await apiStore.addToQueue({ name: 'removeConnections', body: { ids } })
      broadcastStore.update({ updates: ids, store: 'connectionStore', action: 'removeConnectionsState' })
    },
    async removeConnection (id) {
      await this.removeConnections([id])
    },
    removeConnectionTypesRemote (types) {
      for (const type of types) {
        const idIndex = this.typeAllIds.indexOf(type.id)
        this.typeAllIds.splice(idIndex, 1)
        delete this.typeById[type.id]
      }
    },
    async removeAllUnusedConnectionTypes () {
      const apiStore = useApiStore()
      const broadcastStore = useBroadcastStore()
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
        await apiStore.addToQueue({ name: 'removeConnectionType', body: type })
      }
      broadcastStore.update({ updates: typesToRemove, store: 'connectionStore', action: 'removeConnectionTypesRemote' })
    },
    removeConnectionsFromItems (itemIds) {
      const connections = this.getConnectionsByItemIds(itemIds)
      const connectionIds = connections.map(connection => connection.id)
      this.removeConnections(connectionIds)
    },
    removeConnectionsFromItem (itemId) {
      this.removeConnectionsFromItems([itemId])
    },

    // path

    async updateConnectionPaths (itemIds) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      if (!itemIds.length) { return }
      const connections = this.getConnectionsByItemIds(itemIds)
      const updates = []
      connections.forEach(connection => {
        // perf: use dom lookup bc faster than getting state item
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
      if (userStore.getUserCanEditSpace) {
        this.updateConnections(updates)
      } else {
        this.updateConnectionsState(updates)
      }
      globalStore.clearShouldExplicitlyRenderCardIds()
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
