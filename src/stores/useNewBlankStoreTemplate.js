import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

export const useItemStore = defineStore('items', {
  state: () => ({
    byId: {},
    allIds: []
  }),

  getters: {
    // getters take no params, and are invoked like object properties
    // blankStore.getAllItems
    getAllItems () {
      return this.allIds.map(id => this.byId[id])
    }
  },

  actions: {

    getItem (id) {
      return this.byId[id]
    },

    // init

    initializeItems (items) {
      const byId = {}
      const allIds = []
      items.forEach(item => {
        byId[item.id] = item
        allIds.push(item.id)
      })
      this.byId = byId
      this.allIds = allIds
    },

    // create

    addItemToState (item) {
      this.byId[item.id] = item
      this.allIds.push(item.id)
    },
    async createItem (item) {
      const apiStore = useApiStore()
      // const broadcastStore = useBroadcastStore()
      // normalize item
      this.addItemToState(item)
      // if (updates.isFromBroadcast) { return }
      // broadcastStore.update({ updates: item, store: 'itemStore', action: 'createItem' })
      await apiStore.addToQueue({ name: 'createItem', body: item })
    },

    // update

    updateItems (updates) {
      updates.forEach(update => {
        this.byId[update.id] = {
          ...this.byId[update.id],
          ...update
        }
      })
      // save to server, cache, broadcast
    },
    updateItem (update) {
      this.updatedItems([update])
    },

    // remove

    async removeItems (items) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const canEditSpace = userStore.getUserCanEditSpace
      if (!canEditSpace) { return }
      for (const item of items) {
        const idIndex = this.allIds.indexOf(item.id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[item.id]
        await apiStore.addToQueue({ name: 'removeItem', body: item })
      }
    },
    async removeItem (item) {
      await this.removeItems([item])
    }

  }
})
