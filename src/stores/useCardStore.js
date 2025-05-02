import { defineStore } from 'pinia'
import store from '@/store/store.js' // TEMP Import Vuex store

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
      // console.log('🍇 card updates complete',this.getAllCards)
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

    // public

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

    incrementZ (id) {
      const card = this.getCard(id)
      this.updateCard({
        id,
        z: card.z + 1
      })
    }
  }
})
