import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'

import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

export const useCardStore = defineStore('cards', {
  state: () => ({
    byId: {},
    allIds: [],
    dirtyCardIds: new Set(),
    pendingUpdates: new Map(),
    isUpdating: false
  }),

  getters: {
    getCard: (state) => {
      return (id) => state.byId[id]
    },
    getAllCards: (state) => {
      return state.allIds.map(id => state.byId[id])
    }
  },

  actions: {

    // init

    initializeCards (cards) {
      const byId = {}
      const allIds = []
      cards.forEach(card => {
        byId[card.id] = card
        allIds.push(card.id)
      })
      this.byId = byId
      this.allIds = allIds
    },

    // create

    addCardToState (card) {
      this.byId[card.id] = card
      this.allIds.push(card.id)
    },
    async createCard (card) {
      // normalize card
      this.addCardToState(card)
      // if (!updates.isBroadcast) {
      // store.dispatch('broadcast/update', { updates: connection, type: 'addConnection', handler: 'currentConnections/create' }, { root: true })
      // store.dispatch('history/add', { connections: [connection] }, { root: true })
      await store.dispatch('api/addToQueue', { name: 'createCard', body: card }, { root: true })
    },

    // update

    processPendingUpdates () {
      const updatedCards = {}
      this.pendingUpdates.forEach((updates, id) => {
        updatedCards[id] = {
          ...this.byId[id],
          ...updates
        }
      })
      // Batch state update
      this.byId = {
        ...this.byId,
        ...updatedCards
      }
      // Clear queues
      this.pendingUpdates.clear()
      this.dirtyCardIds.clear()
      this.isUpdating = false
    },
    updateCards (updates) {
      updates.forEach(({ id, ...changes }) => {
        this.pendingUpdates.set(id, {
          ...this.pendingUpdates.get(id) || {},
          ...changes
        })
        this.dirtyCardIds.add(id)
      })
      if (!this.isUpdating) {
        requestAnimationFrame(() => this.processPendingUpdates())
        this.isUpdating = true
      }
    },
    updateCard (update) {
      this.updatedCards([update])
    },

    // remove

    async removeCards (cards) {
      const userStore = useUserStore()
      const canEditSpace = userStore.getUserCanEditSpace()
      if (!canEditSpace) { return }
      for (const card of cards) {
        const idIndex = this.allIds.indexOf(card.id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[card.id]
        await store.dispatch('api/addToQueue', { name: 'removeCard', body: card }, { root: true })
      }
    },
    async removeCard (card) {
      await this.removeCards([card])
    }

  }
})
