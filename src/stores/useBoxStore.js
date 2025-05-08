import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'

import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

export const useBoxStore = defineStore('boxes', {
  state: () => ({
    byId: {},
    allIds: [],
    dirtyBoxIds: new Set(),
    pendingUpdates: new Map(),
    isUpdating: false
  }),

  getters: {
    getBox: (state) => {
      return (id) => state.byId[id]
    },
    getAllBoxes: (state) => {
      return state.allIds.map(id => state.byId[id])
    },
    getBoxesIsLocked: (state) => {
      const boxes = state.allIds.map(id => state.byId[id])
      return boxes.filter(box => box.isLocked)
    },
    getBoxesIsNotLocked: (state) => {
      const boxes = state.allIds.map(id => state.byId[id])
      return boxes.filter(box => !box.isLocked)
    }
  },

  actions: {

    // init

    initializeBoxes (boxes) {
      const byId = {}
      const allIds = []
      boxes.forEach(box => {
        byId[box.id] = box
        allIds.push(box.id)
      })
      this.byId = byId
      this.allIds = allIds
      console.log('🍍', this.byId)
    },

    // create

    addBoxToState (box) {
      this.byId[box.id] = box
      this.allIds.push(box.id)
    },
    async createBox (box) {
      // normalize box
      this.addBoxToState(box)
      // if (!updates.isBroadcast) {
      // store.dispatch('broadcast/update', { updates: connection, type: 'addConnection', handler: 'currentConnections/create' }, { root: true })
      // store.dispatch('history/add', { connections: [connection] }, { root: true })
      await store.dispatch('api/addToQueue', { name: 'createBox', body: box }, { root: true })
    },

    // update

    processPendingUpdates () {
      const updatedBoxes = {}
      this.pendingUpdates.forEach((updates, id) => {
        updatedBoxes[id] = {
          ...this.byId[id],
          ...updates
        }
      })
      // Batch state update
      this.byId = {
        ...this.byId,
        ...updatedBoxes
      }
      // Clear queues
      this.pendingUpdates.clear()
      this.dirtyBoxIds.clear()
      this.isUpdating = false
    },
    updateBox (id, updates) {
      if (!this.isUpdating) {
        requestAnimationFrame(() => this.processPendingUpdates())
      }
      this.pendingUpdates.set(id, {
        ...this.pendingUpdates.get(id) || {},
        ...updates
      })
      this.dirtyBoxIds.add(id)
      this.isUpdating = true
    },

    updateBoxes (updates) {
      updates.forEach(({ id, ...changes }) => {
        this.pendingUpdates.set(id, {
          ...this.pendingUpdates.get(id) || {},
          ...changes
        })
        this.dirtyBoxIds.add(id)
      })
      if (!this.isUpdating) {
        requestAnimationFrame(() => this.processPendingUpdates())
        this.isUpdating = true
      }
    },

    // delete

    async deleteBoxes (boxes) {
      const canEditSpace = store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      for (const box of boxes) {
        const idIndex = this.allIds.indexOf(box.id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[box.id]
        await store.dispatch('api/addToQueue', { name: 'deleteBox', body: box }, { root: true })
      }
    },
    async deleteBox (box) {
      await this.deleteBoxes([box])
    }

  }
})
