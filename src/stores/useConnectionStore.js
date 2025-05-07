import { nextTick } from 'vue'
import { defineStore } from 'pinia'

import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'

export const useConnectionStore = defineStore('connections', {
  state: () => ({
    byId: {},
    allIds: [],
    typeById: {},
    typeAllIds: [],
    dirtyConnectionIds: new Set(),
    pendingUpdates: new Map(),
    isUpdating: false
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
    }

  },

  actions: {

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
      console.log('🍍', byId)
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
      console.log('🍍🍍', byId)
    },

    // update

    updateConnection (id, updates) {
      if (!this.isUpdating) {
        requestAnimationFrame(() => this.processPendingUpdates())
      }
      this.pendingUpdates.set(id, {
        ...this.pendingUpdates.get(id) || {},
        ...updates
      })
      this.dirtyConnectionIds.add(id)
      this.isUpdating = true
    },
    updateConnections (updates) {
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

    // remove

    async deleteConnections (connections) {
      const canEditSpace = store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      for (const connection of connections) {
        const idIndex = this.allIds.indexOf(connection.id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[connection.id]
        await store.dispatch('api/addToQueue', { name: 'deleteConnection', body: connection }, { root: true })
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
        await store.dispatch('api/addToQueue', { name: 'deleteConnection', body: type }, { root: true })
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
    }
  }
})
