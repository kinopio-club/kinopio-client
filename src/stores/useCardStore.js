import { defineStore } from 'pinia'
import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'

import debounce from 'lodash/debounce'

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
    },

    getDirtyCards: (state) => {
      return Array.from(state.dirtyCardIds).map(id => state.byId[id])
    },

    getVisibleCards: (state) => {
      return (visibleIds) => visibleIds.map(id => state.byId[id])
    }
  },

  actions: {

    updateCard (update) {
      this.updateCards([update])
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
      // server tasks
      if (!updates.isBroadcast) {
        store.dispatch('broadcast/update', { updates, storeName: 'cardStore', actionName: 'updateCards' }, { root: true })
      }
      store.dispatch('api/addToQueue', { name: 'updateMultipleCards', body: { cards: updates } }, { root: true })
    },

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

    initializeCards (cards) {
      const byId = {}
      const allIds = []
      cards.forEach(card => {
        byId[card.id] = card
        allIds.push(card.id)
      })
      this.byId = byId
      this.allIds = allIds
      console.log('🍍', cards, this.byId, this.allIds)
    },

    // move

    moveCards ({ ids, endCursor, prevCursor }) {
      if (!endCursor || !prevCursor) { return }
      const delta = {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      const updates = []
      ids.forEach(id => {
        const card = this.getCard(id)
        const update = {
          id,
          x: card.x + delta.x,
          y: card.y + delta.y
        }
        updates.push(update)
      })
      this.updateCards(updates)
    },

    // z-index

    clearAllCardsZ () {
      const cards = this.getAllCards
      const updates = cards.map(card => {
        return {
          id: card.id,
          z: 0
        }
      })
      this.updateCards(updates)
    },

    incrementCardsZ (id) {
      // highest z
      const cards = this.getAllCards
      const maxInt = Number.MAX_SAFE_INTEGER - 1000
      let highestZ = utils.highestItemZ(cards)
      if (highestZ > maxInt) {
        this.clearAllCardsZ()
        highestZ = 1
      }
      // update
      let ids = store.state.multipleCardsSelectedIds
      const updates = []
      if (!ids.length) {
        ids = [id]
      }
      ids.forEach(id => {
        const update = {
          id,
          z: highestZ + 1
        }
        updates.push(update)
      })
      this.updateCards(updates)
    }
  }
})
