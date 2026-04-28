import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/useUserStore'
import { useListStore } from '@/stores/useListStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import closestPoints from '@/closestPoints.js'

import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
import randomColor from 'randomcolor'
import last from 'lodash-es/last'
import uniq from 'lodash-es/uniq'
import uniqBy from 'lodash-es/uniqBy'
import sortBy from 'lodash-es/sortBy'
import { colord } from 'colord'

const cardinalDebounceTimers = new Map()

export const useConnectionStore = defineStore('connections', {
  state: () => ({
    byId: {},
    allIds: [],
    prevConnectionColor: '',
    // indexes
    byStartItemId: {}, // { itemId: [ id1, id2 ] }
    byEndItemId: {}
  }),

  getters: {
    getAllConnections () {
      return this.allIds.map(id => this.byId[id])
    },
    getConnectionColors () {
      let connections = this.getAllConnections
      connections = connections.filter(connection => connection.color)
      connections = utils.sortByUpdatedAt(connections)
      const colors = connections.map(connection => colord(connection.color).toHex())
      return uniq(colors)
    },
    getLastConnectionColor () {
      const globalStore = useGlobalStore()
      if (globalStore.lastInteractedConnectionColor) {
        return globalStore.lastInteractedConnectionColor
      }
      return last(this.getConnectionColors)
    },
    getNewConnectionColor () {
      const userStore = useUserStore()
      const themeStore = useThemeStore()
      const globalStore = useGlobalStore()
      const userId = userStore.id
      let useLastColor = userStore.shouldUseLastConnectionColor
      if (globalStore.currentConnectionShiftKeyIsActive) {
        useLastColor = !useLastColor
      }
      if (this.getConnectionColors.length && useLastColor) {
        return this.getLastConnectionColor
      } else {
        return themeStore.randomColor()
      }
    }
  },

  actions: {

    getAllConnectionsInViewport () {
      const elements = document.querySelectorAll('svg.connection')
      const paths = []
      elements.forEach(path => {
        if (path.dataset.isVisibleInViewport === 'false') { return }
        if (path.dataset.isHiddenByCommentFilter === 'true') { return }
        paths.push(path)
      })
      return paths
    },
    getConnection (id) {
      return this.byId[id]
    },
    getConnections (ids) {
      let connections = ids.map(id => this.getConnection(id))
      connections = connections.filter(connection => Boolean(connection))
      return connections
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
    getConnectionPathBetweenCoords (start, end, controlPoint) {
      if (!start || !end) { return }
      const delta = {
        x: parseInt(end.x - start.x),
        y: parseInt(end.y - start.y)
      }
      const curve = controlPoint || consts.defaultConnectionPathCurveControlPoint
      return `m${start.x},${start.y} ${curve} ${delta.x},${delta.y}`
    },
    getshortestConnectionPathBetweenItems (startItem, endItem, controlPoint) {
      let { point1, point2, point1Cardinal, point2Cardinal } = closestPoints.findClosestPoints(startItem, endItem)
      if (startItem.itemType === 'box') {
        point1 = utils.estimatedItemConnectorPosition(startItem)
      }
      if (endItem.itemType === 'box') {
        point2 = utils.estimatedItemConnectorPosition(endItem)
      }
      const path = this.getConnectionPathBetweenCoords(point1, point2, controlPoint)
      return { path, point1Cardinal, point2Cardinal }
    },
    getConnectionPathBetweenItems ({ startItem, endItem, startItemId, endItemId, controlPoint, estimatedEndItemConnectorPosition }) {
      const listStore = useListStore()
      const spaceStore = useSpaceStore()
      startItem = startItem || spaceStore.getSpaceItemById(startItemId)
      endItem = endItem || spaceStore.getSpaceItemById(endItemId)
      if (!startItem || !endItem) { return }
      const lists = listStore.getCollapsedLists
      lists.forEach(list => {
        if (list.id === startItem.listId) { startItem = list }
        if (list.id === endItem.listId) { endItem = list }
      })

      let path, point1Cardinal, point2Cardinal
      if (controlPoint === consts.straightLineConnectionPathControlPoint) {
        ({ path, point1Cardinal, point2Cardinal } = this.getshortestConnectionPathBetweenItems(startItem, endItem, controlPoint))
      } else {
        const start = utils.estimatedItemConnectorPosition(startItem)
        const end = estimatedEndItemConnectorPosition || utils.estimatedItemConnectorPosition(endItem)
        path = this.getConnectionPathBetweenCoords(start, end, controlPoint)
      }
      return { path, point1Cardinal, point2Cardinal }
    },
    getConnectionIsValid (connection) {
      const spaceStore = useSpaceStore()
      const startItem = spaceStore.getSpaceItemById(connection.startItemId)
      const endItem = spaceStore.getSpaceItemById(connection.endItemId)
      return Boolean(startItem && endItem)
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

    // init remote

    initializeRemoteConnections (remoteConnections) {
      const localConnections = utils.clone(this.getAllConnections)
      const { updateItems, addItems, removeItems } = utils.syncItems(remoteConnections, localConnections)
      console.info('🎑 remote connections', { updateItems, addItems, removeItems })
      this.updateConnectionsState(updateItems)
      addItems.forEach(connection => this.addConnectionToState(connection))
      const ids = removeItems.map(connection => connection.id)
      this.removeConnectionsFromState(ids)
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
    async createConnection (connection) {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const themeStore = useThemeStore()
      const broadcastStore = useBroadcastStore()
      const connections = this.getAllConnections
      const isExistingConnection = connections.find(item => {
        const isStart = item.startItemId === connection.startItemId
        const isEnd = item.endItemId === connection.endItemId
        return isStart && isEnd
      })
      if (isExistingConnection) { return }
      if (connection.startItemId === connection.endItemId) { return }
      connection.id = connection.id || nanoid()
      connection.spaceId = spaceStore.id
      connection.userId = userStore.id
      connection.color = this.getNewConnectionColor
      globalStore.lastInteractedConnectionColor = connection.color
      this.addConnectionToState(connection)
      broadcastStore.update({ updates: connection, store: 'connectionStore', action: 'addConnectionToState' })
      await apiStore.addToQueue({ name: 'createConnection', body: connection })
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
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      if (!userStore.getUserCanEditSpace) { return }
      this.updateConnectionsState(updates)
      broadcastStore.update({ updates, store: 'connectionStore', action: 'updateConnectionsState' })
      for (const connection of updates) {
        await apiStore.addToQueue({ name: 'updateConnection', body: connection })
        if (connection.color) {
          globalStore.lastInteractedConnectionColor = connection.color
        }
      }
      await cache.updateSpace('connections', this.getAllConnections, spaceStore.id)
    },
    updateConnection (update) {
      this.updateConnections([update])
    },

    // remove

    removeConnectionsFromState (ids) {
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
      this.removeConnectionsFromState(ids)
      for (const id of ids) {
        await apiStore.addToQueue({ name: 'removeConnection', body: { id } })
      }
      broadcastStore.update({ updates: ids, store: 'connectionStore', action: 'removeConnectionsFromState' })
    },
    async removeConnection (id) {
      await this.removeConnections([id])
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

    async updateConnectionPathsByItemIds (itemIds) {
      try {
        await nextTick()
        const globalStore = useGlobalStore()
        const userStore = useUserStore()
        const spaceStore = useSpaceStore()
        if (!itemIds.length) { return }
        const connections = this.getConnectionsByItemIds(itemIds) || []
        const updates = []
        connections.forEach(connection => {
          // perf: use dom lookup bc faster than getting state item
          let startItem = utils.itemElementDimensions({ id: connection.startItemId })
          let endItem = utils.itemElementDimensions({ id: connection.endItemId })
          startItem = spaceStore.updateItemWithItemType(startItem)
          endItem = spaceStore.updateItemWithItemType(endItem)
          if (!endItem || !startItem) { return }

          const { path, point1Cardinal, point2Cardinal } = this.getConnectionPathBetweenItems({
            startItem,
            startItemId: connection.startItemId,
            endItem,
            endItemId: connection.endItemId,
            controlPoint: connection.controlPoint
          })
          if (!path) { return }
          // determine if should animate snapping between points
          const prevPoint1Cardinal = connection.point1Cardinal
          const prevPoint2Cardinal = connection.point2Cardinal
          const shouldInterpolatePoint1 = prevPoint1Cardinal !== point1Cardinal
          const shouldInterpolatePoint2 = prevPoint2Cardinal !== point2Cardinal
          const shouldAnimateInterpolation = shouldInterpolatePoint1 || shouldInterpolatePoint2
          if (shouldAnimateInterpolation) {
            // compute path using previous cardinals so the line stays stable during debounce
            const paddedRect1 = closestPoints.updateRectWithPadding(closestPoints.normalizeRect(startItem), startItem.itemType)
            const paddedRect2 = closestPoints.updateRectWithPadding(closestPoints.normalizeRect(endItem), endItem.itemType)
            const cardinalPoints1 = closestPoints.getCardinalPoints(paddedRect1)
            const cardinalPoints2 = closestPoints.getCardinalPoints(paddedRect2)
            let prevPoint1 = cardinalPoints1[prevPoint1Cardinal]
            let prevPoint2 = cardinalPoints2[prevPoint2Cardinal]
            // mirror box override from getshortestConnectionPathBetweenItems
            if (startItem.itemType === 'box') { prevPoint1 = utils.estimatedItemConnectorPosition(startItem) }
            if (endItem.itemType === 'box') { prevPoint2 = utils.estimatedItemConnectorPosition(endItem) }
            const stablePath = (prevPoint1 && prevPoint2)
              ? this.getConnectionPathBetweenCoords(prevPoint1, prevPoint2, connection.controlPoint)
              : path
            // debounce the actual cardinal update and snap animation
            if (!cardinalDebounceTimers.has(connection.id)) {
              const connectionId = connection.id
              const flush = () => {
                cardinalDebounceTimers.delete(connectionId)
                const currentConnection = this.byId[connectionId]
                if (!currentConnection) { return }
                // recalculate cardinals from current item positions at flush time
                let flushStartItem = utils.itemElementDimensions({ id: currentConnection.startItemId })
                let flushEndItem = utils.itemElementDimensions({ id: currentConnection.endItemId })
                if (!flushStartItem || !flushEndItem) { return }
                flushStartItem = spaceStore.updateItemWithItemType(flushStartItem)
                flushEndItem = spaceStore.updateItemWithItemType(flushEndItem)
                const { point1Cardinal: currentPoint1Cardinal, point2Cardinal: currentPoint2Cardinal } = this.getConnectionPathBetweenItems({
                  startItem: flushStartItem,
                  startItemId: currentConnection.startItemId,
                  endItem: flushEndItem,
                  endItemId: currentConnection.endItemId,
                  controlPoint: currentConnection.controlPoint
                })
                const fromPath = this.byId[connectionId]?.path
                const cardinalUpdate = [{ id: connectionId, point1Cardinal: currentPoint1Cardinal, point2Cardinal: currentPoint2Cardinal }]
                if (userStore.getUserCanEditSpace) {
                  this.updateConnections(cardinalUpdate)
                } else {
                  this.updateConnectionsState(cardinalUpdate)
                }
                if (fromPath) {
                  globalStore.triggerConnectionSnapAnimation({ id: connectionId, fromPath })
                }
              }
              const timer = setTimeout(flush, 50)
              cardinalDebounceTimers.set(connection.id, { timer, flush })
            }
            // use stable path (old cardinals, new positions) during debounce window
            updates.push({ id: connection.id, path: stablePath })
          } else {
            // cardinals stable or reverted – cancel any pending debounce
            if (cardinalDebounceTimers.has(connection.id)) {
              clearTimeout(cardinalDebounceTimers.get(connection.id).timer)
              cardinalDebounceTimers.delete(connection.id)
            }
            updates.push({ id: connection.id, path, point1Cardinal, point2Cardinal })
          }
        })
        if (userStore.getUserCanEditSpace) {
          this.updateConnections(updates)
        } else {
          this.updateConnectionsState(updates)
        }
        globalStore.clearShouldExplicitlyRenderCardIds()
      } catch (error) {
        console.error('🚒 updateConnectionPathsByItemIds', error, itemIds)
      }
    },
    updateConnectionPathByItemId (itemId) {
      this.updateConnectionPathsByItemIds([itemId])
    },
    flushCardinalDebounceTimers () {
      cardinalDebounceTimers.forEach(({ timer, flush }) => {
        clearTimeout(timer)
        flush()
      })
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
