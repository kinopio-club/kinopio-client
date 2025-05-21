import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useCardStore } from '@/stores/useCardStore'
import { useBoxStore } from '@/stores/useBoxStore'

import store from '@/store/store.js' // TEMP Import Vuex store

import inboxSpace from '@/data/inbox.json'
import newSpace from '@/data/new.json'

import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'
import postMessage from '@/postMessage.js'

import randomColor from 'randomcolor'
import { nanoid } from 'nanoid'
import random from 'lodash-es/random'
import uniqBy from 'lodash-es/uniqBy'
import uniq from 'lodash-es/uniq'
import sortBy from 'lodash-es/sortBy'
import defer from 'lodash-es/defer'
import throttle from 'lodash-es/throttle'
import dayjs from 'dayjs'

const idleClientTimers = []
let isLoadingRemoteSpace, shouldLoadNewHelloSpace
const loadSpaceIdsError = []

export const useSpaceStore = defineStore('space', {
  state: () => (newSpace),

  getters: {
  },

  actions: {

    // init

    async initializeSpace () {
      const userStore = useUserStore()
      store.commit('isLoadingSpace', true, { root: true })
      const spaceUrl = store.state.spaceUrlToLoad
      // restore from url
      if (spaceUrl) {
        console.info('🚃 Restore space from url', spaceUrl)
        const spaceId = utils.spaceIdFromUrl(spaceUrl)
        const space = { id: spaceId }
        await this.loadSpace(space) // TODO
      // restore inbox space
      } else if (store.state.loadInboxSpace) {
        console.info('🚃 Restore inbox space')
        await this.loadInboxSpace() // TODO
      // create new space
      } else if (store.state.loadNewSpace) {
        console.info('🚃 Create new space')
        await this.addSpace() // TODO createSpace
        store.commit('loadNewSpace', false, { root: true })
      // restore last space
      } else if (userStore.lastSpaceId) {
        console.info('🚃 Restore last space', userStore.lastSpaceId)
        await this.loadLastSpace() // TODO
      // hello kinopio
      } else {
        console.info('🚃 Create and restore hello space')
        shouldLoadNewHelloSpace = true
      }
      await this.checkIfShouldCreateNewUserSpaces() // TODO
      store.commit('triggerUpdateWindowHistory', null, { root: true })
    }

    // load

    // initializeCards (cards) {
    //   const byId = {}
    //   const allIds = []
    //   cards.forEach(card => {
    //     byId[card.id] = card
    //     allIds.push(card.id)
    //   })
    //   this.byId = byId
    //   this.allIds = allIds
    // },

    // create

    // addCardToState (card) {
    //   this.byId[card.id] = card
    //   this.allIds.push(card.id)
    // },
    // async createCard (card) {
    //   // normalize card
    //   this.addCardToState(card)
    //   // if (!updates.isBroadcast) {
    //   // store.dispatch('broadcast/update', { updates: connection, type: 'addConnection', handler: 'currentConnections/create' }, { root: true })
    //   // store.dispatch('history/add', { connections: [connection] }, { root: true })
    //   await store.dispatch('api/addToQueue', { name: 'createCard', body: card }, { root: true })
    // },

    // update

    // processPendingUpdates () {
    //   const updatedCards = {}
    //   this.pendingUpdates.forEach((updates, id) => {
    //     updatedCards[id] = {
    //       ...this.byId[id],
    //       ...updates
    //     }
    //   })
    //   // Batch state update
    //   this.byId = {
    //     ...this.byId,
    //     ...updatedCards
    //   }
    //   // Clear queues
    //   this.pendingUpdates.clear()
    //   this.dirtyCardIds.clear()
    //   this.isUpdating = false
    // },
    // updateCards (updates) {
    //   updates.forEach(({ id, ...changes }) => {
    //     this.pendingUpdates.set(id, {
    //       ...this.pendingUpdates.get(id) || {},
    //       ...changes
    //     })
    //     this.dirtyCardIds.add(id)
    //   })
    //   if (!this.isUpdating) {
    //     requestAnimationFrame(() => this.processPendingUpdates())
    //     this.isUpdating = true
    //   }
    // },
    // updateCard (update) {
    //   this.updatedCards([update])
    // },

    // remove

    // async removeCards (cards) {
    //   const userStore = useUserStore()
    //   const canEditSpace = userStore.getUserCanEditSpace()
    //   if (!canEditSpace) { return }
    //   for (const card of cards) {
    //     const idIndex = this.allIds.indexOf(card.id)
    //     this.allIds.splice(idIndex, 1)
    //     delete this.byId[card.id]
    //     await store.dispatch('api/addToQueue', { name: 'removeCard', body: card }, { root: true })
    //   }
    // },
    // async removeCard (card) {
    //   await this.removeCards([card])
    // }

  }
})
