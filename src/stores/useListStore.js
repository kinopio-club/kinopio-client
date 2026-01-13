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

export const useListStore = defineStore('lists', {
  state: () => ({
    byId: {},
    allIds: []
  }),

  getters: {
    // getters take no params, and are invoked like object properties
    // blankStore.getAllLists
    getAllLists () {
      return this.allIds.map(id => this.byId[id])
    }
  },

  actions: {

    getList (id) {
      return this.byId[id]
    },

    // init

    initializeLists (lists) {
      const byId = {}
      const allIds = []
      lists.forEach(list => {
        byId[list.id] = list
        allIds.push(list.id)
      })
      this.byId = byId
      this.allIds = allIds
    },

    // create

    addListToState (list) {
      this.byId[list.id] = list
      this.allIds.push(list.id)
    },
    async createList (list) {
      const apiStore = useApiStore()
      // const broadcastStore = useBroadcastStore()
      // normalize list
      this.addListToState(list)
      // if (updates.isFromBroadcast) { return }
      // broadcastStore.update({ updates: list, store: 'listStore', action: 'createList' })
      await apiStore.addToQueue({ name: 'createList', body: list })
    },

    // update

    updateLists (updates) {
      updates.forEach(update => {
        this.byId[update.id] = {
          ...this.byId[update.id],
          ...update
        }
      })
      // save to server, cache, broadcast
    },
    updateList (update) {
      this.updatedLists([update])
    },

    // remove

    async removeLists (lists) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const canEditSpace = userStore.getUserCanEditSpace
      if (!canEditSpace) { return }
      for (const list of lists) {
        const idIndex = this.allIds.indexOf(list.id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[list.id]
        await apiStore.addToQueue({ name: 'removeList', body: list })
      }
    },
    async removeList (list) {
      await this.removeLists([list])
    }

  }
})
