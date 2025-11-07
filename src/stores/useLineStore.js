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
      return this.allIds.map(id => this.byId[id])
    },
    getLinesSelected () {
      const globalStore = useGlobalStore()
      let ids = globalStore.multipleLinesSelectedIds
      if (!ids.length) {
        ids = [globalStore.currentDraggingLineId]
      }
      ids = ids.filter(id => Boolean(id))
      const lines = ids.map(id => this.byId[id])
      return lines
    }
  },

  actions: {

    getLine (id) {
      return this.byId[id]
    },

    // init

    initializeLines (lines = []) {
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
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const { id, color } = line
      const zoom = globalStore.getSpaceCounterZoomDecimal
      const minY = (consts.minLineY + window.scrollY) * zoom
      line.id = id || nanoid()
      line.color = color || randomColor({ luminosity: 'dark' })
      line.y = line.y || minY
      line.y = Math.max(line.y, minY)
      line.name = line.name || `Line Divider ${this.allIds.length + 1}`
      line.userId = userStore.id
      line.spaceId = spaceStore.id
      return line
    },
    addLineToState (line) {
      this.byId[line.id] = line
      this.allIds.push(line.id)
    },
    async createLine (line = {}) {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      if (!userStore.getUserIsSpaceMember) { return }
      line = this.normalizeNewLine(line)
      this.addLineToState(line)
      globalStore.focusOnLineId = line.id
      window.scrollTo({
        left: 0,
        behavior: 'smooth'
      })
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
      const userStore = useUserStore()
      if (!userStore.getUserIsSpaceMember) { return }
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

    async removeLines (ids = []) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const canEditSpace = userStore.getUserIsSpaceMember
      if (!canEditSpace) { return }
      for (const id of ids) {
        const line = this.getLine(id)
        const idIndex = this.allIds.indexOf(line.id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[line.id]
        await apiStore.addToQueue({ name: 'removeLine', body: line })
      }
      await cache.updateSpace('lines', this.getAllLines, spaceStore.id)
    },
    async removeLine (id) {
      await this.removeLines([id])
    }
  }
})
