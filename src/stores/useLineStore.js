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
    updateLines (updates) {
      // save to server, cache, broadcast

      // const apiStore = useApiStore()
      // const userStore = useUserStore()
      // const spaceStore = useSpaceStore()
      // const broadcastStore = useBroadcastStore()
      // const connectionStore = useConnectionStore()
      // try {
      //   this.updateCardsState(updates)
      //   if (!userStore.getUserCanEditSpace) { return }
      //   const ids = updates.map(update => update.id)
      //   broadcastStore.update({ updates, store: 'cardStore', action: 'updateCardsState' })
      //   for (const card of updates) {
      //     await apiStore.addToQueue({ name: 'updateCard', body: card })
      //   }
      //   let cards = this.getAllCards
      //   cards = utils.clone(cards)
      //   await cache.updateSpace('cards', cards, spaceStore.id)
      // } catch (error) {
      //   console.error('🚒 updateCards', error, updates)
      // }
    },
    updateLine (update) {
      this.updateLines([update])
    },
    // moveLines ({ endCursor, prevCursor, delta }) {
    //   const globalStore = useGlobalStore()
    //   const connectionStore = useConnectionStore()
    //   const boxStore = useBoxStore()
    //   const zoom = globalStore.getSpaceCounterZoomDecimal
    //   if (!endCursor || !prevCursor) { return }
    //   if (globalStore.shouldSnapToGrid) {
    //     prevCursor = utils.cursorPositionSnapToGrid(prevCursor)
    //     endCursor = utils.cursorPositionSnapToGrid(endCursor)
    //   }
    //   delta = delta || {
    //     x: endCursor.x - prevCursor.x,
    //     y: endCursor.y - prevCursor.y
    //   }
    //   delta = {
    //     x: delta.x * zoom,
    //     y: delta.y * zoom
    //   }
    //   let cards = this.getCardsSelected
    //   cards = cards.map(card => {
    //     let x = Math.round(card.x + delta.x)
    //     x = Math.max(0, x)
    //     let y = Math.round(card.y + delta.y)
    //     y = Math.max(0, y)
    //     return {
    //       id: card.id,
    //       x,
    //       y
    //     }
    //   })
    //   this.updatePageSize(cards[0])
    //   this.updateCards(cards)
    //   globalStore.cardsWereDragged = true
    //   cards = cards.map(card => this.getCard(card.id))
    //   boxStore.updateBoxSnapGuides({ items: cards, isCards: true, cursor: endCursor })
    // },

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
