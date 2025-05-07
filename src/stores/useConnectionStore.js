import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'

export const useConnectionStore = defineStore('cards', {
  state: () => ({
    byId: {},
    allIds: [],
    dirtyConnectionIds: new Set(),
    pendingUpdates: new Map(),
    isUpdating: false
    // worker: null
  }),

  getters: {
    getConnection: (state) => {
      return (id) => state.byId[id]
    },

    getAllConnections: (state) => {
      return state.allIds.map(id => state.byId[id])
    },

    getDirtyConnections: (state) => {
      return Array.from(state.dirtyConnectionIds).map(id => state.byId[id])
    },

    getVisibleConnections: (state) => {
      return (visibleIds) => visibleIds.map(id => state.byId[id])
    }
  },

  actions: {
    // initializeWorker() {
    //   this.worker = new Worker(new URL('../workers/cardWorker.js', import.meta.url))
    //   this.worker.onmessage = (e) => {
    //     const { type, data } = e.data
    //     switch(type) {
    //       case 'BATCH_UPDATE':
    //         this.updateConnections(data)
    //         break
    //       // Add other worker message handlers as needed
    //     }
    //   }
    // },

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

    initializeConnections (cards) {
      const byId = {}
      const allIds = []
      cards.forEach(card => {
        byId[card.id] = card
        allIds.push(card.id)
      })
      this.byId = byId
      this.allIds = allIds
    }

    // processConnectionsInWorker(operation, cards = this.getAllConnections) {
    //   if (!this.worker) {
    //     this.initializeWorker()
    //   }

    //   this.worker.postMessage({
    //     type: operation,
    //     cards
    //   })
    // },

    // Cleanup
    // dispose() {
    //   if (this.worker) {
    //     this.worker.terminate()
    //     this.worker = null
    //   }
    // }
  }
})
