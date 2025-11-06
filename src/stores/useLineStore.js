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

export const useLineStore = defineStore('lines', {
  state: () => ({
    byId: {},
    allIds: []
  }),

  getters: {
    // getters take no params, and are invoked like object properties
    // blankStore.getAllLines
    getAllLines () {
      // temp
      return [
        {
          id: '1',
          name: 'Line Divider 1',
          color: 'purple',
          y: 200
          // userId,
          // spaceId
        }
      ]

      // return this.allIds.map(id => this.byId[id])
    },
    getLinesSelected () {
      const globalStore = useGlobalStore()
      let ids = globalStore.multipleLinesSelectedIds
      if (!ids.length) {
        ids = [globalStore.currentDraggingLineId]
      }
      console.log('🍇🍇🍇', ids)
      ids = ids.filter(id => Boolean(id))
      const lines = ids.map(id => this.byId[id])
      // return lines

      // temp
      // next convert getAllLinestousereal created line data
      return this.getAllLines
    }
  },

  actions: {

    getLine (id) {
      return this.byId[id]
    },

    // init

    initializeLines (lines) {
      const byId = {}
      const allIds = []
      lines.forEach(line => {
        byId[line.id] = line
        allIds.push(line.id)
      })
      this.byId = byId
      this.allIds = allIds
    },

    // create

    normalizeNewLine (line) {
      const userStore = useUserStore()
      const { id, color } = line
      line.id = id || nanoid()
      line.color = color || randomColor({ luminosity: 'dark' })
      line.userId = userStore.id
      line.y = line.y || consts.minLineY
      line.y = Math.max(line.y, consts.minLineY)
      line.name = line.name || `Line Divider ${this.allIds.length + 1}`
      return line
    },
    addLineToState (line) {
      this.byId[line.id] = line
      this.allIds.push(line.id)
    },
    async createLine (line) {
      const apiStore = useApiStore()
      const broadcastStore = useBroadcastStore()
      line = this.normalizeNewLine(line)
      this.addLineToState(line)
      if (line.isFromBroadcast) { return }
      broadcastStore.update({ updates: line, store: 'lineStore', action: 'addLineToState' })
      await apiStore.addToQueue({ name: 'createLine', body: line })
    },

    // update

    updateLinesState (updates) {
      updates.forEach(update => {
        this.byId[update.id] = {
          ...this.byId[update.id],
          ...update
        }
      })
    },
    async updateLines (updates) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      if (!userStore.getUserCanEditSpace) { return }
      this.updateLinesState(updates)
      broadcastStore.update({ updates, store: 'lineStore', action: 'updateLinesState' })
      for (const line of updates) {
        await apiStore.addToQueue({ name: 'updateLine', body: line })
      }
      await cache.updateSpace('lines', this.getAllLines, spaceStore.id)
    },
    updateLine (update) {
      this.updateLines([update])
    },
    moveLines ({ endCursor, prevCursor, delta }) {
      const globalStore = useGlobalStore()
      const zoom = globalStore.getSpaceCounterZoomDecimal
      if (!endCursor || !prevCursor) { return }
      if (globalStore.shouldSnapToGrid) {
        prevCursor = utils.cursorPositionSnapToGrid(prevCursor)
        endCursor = utils.cursorPositionSnapToGrid(endCursor)
      }
      delta = delta || {
        y: endCursor.y - prevCursor.y
      }
      delta = {
        y: delta.y * zoom
      }
      let lines = this.getLinesSelected
      console.log('🔮', lines)
      lines = lines.map(line => {
        line.y = Math.max(line.y, consts.minLineY)
        return line
      })
      const updates = []
      lines.forEach(line => {
        let y = Math.round(line.y + delta.y)
        y = Math.max(0, y)
        updates.push({
          id: line.id,
          y
        })
      })
      this.updateLines(updates)
      globalStore.linesWereDragged = true
    },

    // line details

    showLineDetails (id) {
      const globalStore = useGlobalStore()
      globalStore.updateLineDetailsIsVisibleForLineId(id)
    },

    // remove

    async removeLines (lines) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const canEditSpace = userStore.getUserCanEditSpace
      if (!canEditSpace) { return }
      for (const line of lines) {
        const idIndex = this.allIds.indexOf(line.id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[line.id]
        await apiStore.addToQueue({ name: 'removeLine', body: line })
      }
      await cache.updateSpace('lines', this.getAllLines, spaceStore.id)
    },
    async removeLine (line) {
      await this.removeLines([line])
    }
  }
})
