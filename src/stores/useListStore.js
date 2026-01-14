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

import { nanoid } from 'nanoid'
import randomColor from 'randomcolor'

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
    },
    getListsSelected () {
      const globalStore = useGlobalStore()
      let ids = globalStore.multipleListsSelectedIds
      if (!ids.length) {
        ids = [globalStore.currentDraggingListId]
      }
      ids = ids.filter(id => Boolean(id))
      const lists = ids.map(id => this.byId[id])
      return lists
    },
    getListColors () {
      const lists = this.getAllLists
      const colors = lists.map(list => list.color)
      return colors
    }
  },

  actions: {

    getList (id) {
      return this.byId[id]
    },

    // init

    initializeLists (lists = []) {
      // stubbed list data
      lists = [
        {
          id: '123xyz',
          name: 'List 0',
          color: 'teal',
          x: 300,
          y: 100,
          z: 0,
          width: consts.normalCardMaxWidth,
          isCollapsed: false
          // resizeWidth: null
          // spaceId
          // userId
        }
      ]

      const byId = {}
      const allIds = []
      lists.forEach(list => {
        byId[list.id] = list
        allIds.push(list.id)
      })
      this.byId = byId
      this.allIds = allIds
    },
    initializeRemoteLists (remoteLists = []) {
      const localLists = utils.clone(this.getAllLists)
      const { updateItems, addItems, removeItems } = utils.syncItems(remoteLists, localLists)
      console.info('🎑 remote lists', { updateItems, addItems, removeItems })
      this.updateListsState(updateItems)
      addItems.forEach(list => this.addListToState(list))
      const ids = removeItems.map(list => list.id)
      this.removeListsFromState(ids)
    },

    // create

    normalizeNewList (list) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const { id, color } = list
      const zoom = globalStore.getSpaceCounterZoomDecimal
      const min = consts.minItemXY
      const count = this.allIds.length
      list.id = id || nanoid()
      list.color = color || randomColor({ luminosity: 'dark' })
      list.y = list.y || min
      list.y = Math.max(list.y, min)
      list.name = list.name || `List ${count}`
      list.resizeWidth = list.resizeWidth || null
      list.userId = userStore.id
      list.spaceId = spaceStore.id
      return list
    },
    addListToState (list) {
      this.byId[list.id] = list
      this.allIds.push(list.id)
    },
    async createList (list = {}) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      if (!userStore.getUserIsSpaceMember) { return }
      list = this.normalizeNewList(list)
      this.addListToState(list)
      if (list.isFromBroadcast) { return }
      broadcastStore.update({ updates: list, store: 'listStore', action: 'addListToState' })
      await apiStore.addToQueue({ name: 'createList', body: list })
    },

    // update

    updateListsState (updates) {
      updates.forEach(update => {
        this.byId[update.id] = {
          ...this.byId[update.id],
          ...update
        }
      })
    },
    async updateLists (updates) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      if (!userStore.getUserCanEditSpace) { return }
      this.updateListsState(updates)
      broadcastStore.update({ updates, store: 'listStore', action: 'updateListsState' })
      for (const list of updates) {
        await apiStore.addToQueue({ name: 'updateList', body: list })
      }
      await cache.updateSpace('lists', this.getAllLists, spaceStore.id)
    },
    updateList (update) {
      this.updatedLists([update])
    },
    moveLists ({ endCursor, prevCursor, delta }) {
      const globalStore = useGlobalStore()
      const connectionStore = useConnectionStore()
      // const boxStore = useBoxStore()
      const zoom = globalStore.getSpaceCounterZoomDecimal
      if (!endCursor || !prevCursor) { return }
      if (globalStore.shouldSnapToGrid) {
        prevCursor = utils.cursorPositionSnapToGrid(prevCursor)
        endCursor = utils.cursorPositionSnapToGrid(endCursor)
      }
      delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      delta = {
        x: delta.x * zoom,
        y: delta.y * zoom
      }
      let lists = this.getListsSelected
      lists = lists.map(list => {
        let x = Math.round(list.x + delta.x)
        x = Math.max(0, x)
        let y = Math.round(list.y + delta.y)
        y = Math.max(0, y)
        // TODO update list z
        return {
          id: list.id,
          x,
          y
        }
      })
      // this.updatePageSize(lists[0])
      this.updateLists(lists)
      globalStore.listsWereDragged = true
      // lists = lists.map(list => this.getList(list.id))
      // boxStore.updateBoxSnapGuides({ items: lists, isLists: true, cursor: endCursor })
    },

    // list details

    showListDetails (id) {
      const globalStore = useGlobalStore()
      globalStore.updateListDetailsIsVisibleForListId(id)
    },

    // remove

    removeListsFromState (ids) {
      for (const id of ids) {
        const idIndex = this.allIds.indexOf(id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[id]
      }
    },
    async removeLists (ids = []) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      const canEditSpace = userStore.getUserIsSpaceMember
      if (!canEditSpace) { return }
      for (const id of ids) {
        const list = this.getList(id)
        console.log(list)
        await apiStore.addToQueue({ name: 'removeList', body: list })
      }
      this.removeListsFromState(ids)
      broadcastStore.update({ updates: ids, store: 'listStore', action: 'removeListsFromState' })
      await cache.updateSpace('lists', this.getAllLists, spaceStore.id)
    },
    async removeList (id) {
      await this.removeLists([id])
    }
  }
})
