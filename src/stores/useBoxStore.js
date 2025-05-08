import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useCardStore } from '@/stores/useCardStore'

import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

import sortBy from 'lodash-es/sortBy'

export const useBoxStore = defineStore('boxes', {
  state: () => ({
    byId: {},
    allIds: [],
    dirtyBoxIds: new Set(),
    pendingUpdates: new Map(),
    isUpdating: false
  }),

  getters: {
    getBox: (state) => {
      return (id) => state.byId[id]
    },
    getAllBoxes: (state) => {
      return state.allIds.map(id => state.byId[id])
    },
    getBoxesIsLocked: (state) => {
      const boxes = state.allIds.map(id => state.byId[id])
      return boxes.filter(box => box.isLocked)
    },
    getBoxesIsNotLocked: (state) => {
      const boxes = state.allIds.map(id => state.byId[id])
      return boxes.filter(box => !box.isLocked)
    },
    getBoxesSelected: (state) => {
      let ids = store.state.multipleBoxesSelectedIds
      if (!ids.length) {
        ids = [store.state.currentDraggingBoxId]
      }
      ids = ids.filter(id => Boolean(id))
      const boxes = ids.map(id => state.byId[id])
      return boxes
    },
    getBoxesSelectableByY: (state) => {
      let boxes = state.allIds.map(id => state.byId[id])
      // filter
      boxes = boxes.filter(box => !box.isLocked)
      // sort by y
      boxes = sortBy(boxes, ['y'])
      const yIndex = []
      boxes.forEach(box => yIndex.push(box.y))
      return {
        boxes,
        yIndex
      }
    }

  },

  actions: {

    // init

    initializeBoxes (boxes) {
      const byId = {}
      const allIds = []
      boxes.forEach(box => {
        byId[box.id] = box
        allIds.push(box.id)
      })
      this.byId = byId
      this.allIds = allIds
      console.log('🍍', this.byId)
    },

    // create

    addBoxToState (box) {
      this.byId[box.id] = box
      this.allIds.push(box.id)
    },
    async createBox (box) {
      // normalize box
      this.addBoxToState(box)
      // if (!updates.isBroadcast) {
      // store.dispatch('broadcast/update', { updates: connection, type: 'addConnection', handler: 'currentConnections/create' }, { root: true })
      // store.dispatch('history/add', { connections: [connection] }, { root: true })
      await store.dispatch('api/addToQueue', { name: 'createBox', body: box }, { root: true })
    },

    // update

    processPendingUpdates () {
      const updatedBoxes = {}
      this.pendingUpdates.forEach((updates, id) => {
        updatedBoxes[id] = {
          ...this.byId[id],
          ...updates
        }
      })
      // Batch state update
      this.byId = {
        ...this.byId,
        ...updatedBoxes
      }
      // Clear queues
      this.pendingUpdates.clear()
      this.dirtyBoxIds.clear()
      this.isUpdating = false
    },
    async updateBoxes (updates) {
      updates.forEach(({ id, ...changes }) => {
        this.pendingUpdates.set(id, {
          ...this.pendingUpdates.get(id) || {},
          ...changes
        })
        this.dirtyBoxIds.add(id)
      })
      if (!this.isUpdating) {
        requestAnimationFrame(() => this.processPendingUpdates())
        this.isUpdating = true
      }
      // server tasks
      if (!updates.isBroadcast) {
        // store.dispatch('broadcast/update', { updates, storeName: 'boxStore', actionName: 'updateBoxes' }, { root: true })
      }
      await store.dispatch('api/addToQueue', { name: 'updateMultipleBoxes', body: { boxes: updates } }, { root: true })
      // TODO history? if unpaused
      cache.updateSpace('boxes', this.getAllBoxes, store.state.currentSpace.id)
      // update connection paths
      const connectionStore = useConnectionStore()
      const isNameUpdated = updates.find(update => Boolean(update.name))
      if (isNameUpdated) {
        const ids = updates.map(update => update.id)
        connectionStore.updateConnectionPaths(ids)
      }
    },
    async updateBox (update) {
      await this.updateBoxes([update])
    },

    // remove

    async removeBoxes (ids) {
      const canEditSpace = store.getters['currentUser/canEditSpace']()
      if (!canEditSpace) { return }
      const updates = []
      for (const id of ids) {
        const idIndex = this.allIds.indexOf(id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[id]
        await store.dispatch('api/addToQueue', { name: 'removeBox', body: { id } }, { root: true })
        // store.dispatch('broadcast/update', { updates: box, type: 'removeBox', handler: 'currentBoxes/remove' }, { root: true })
      }
      const boxes = ids.map(id => this.getBox(id))
      store.dispatch('history/add', { boxes, isRemoved: true }, { root: true })
      await cache.updateSpace('boxes', this.getAllBoxes, store.state.currentSpace.id)
      await nextTick()
      const connectionStore = useConnectionStore()
      connectionStore.removeConnectionsFromItems(ids)
    },
    removeBox (id) {
      this.removeBoxes([id])
    },

    // position

    moveBoxes ({ endCursor, prevCursor, delta }) {
      const connectionStore = useConnectionStore()
      const zoom = store.getters.spaceCounterZoomDecimal
      if (!endCursor || !prevCursor) { return }
      endCursor = {
        x: endCursor.x * zoom,
        y: endCursor.y * zoom
      }
      if (store.state.shouldSnapToGrid) {
        prevCursor = utils.cursorPositionSnapToGrid(prevCursor)
        endCursor = utils.cursorPositionSnapToGrid(endCursor)
      }
      delta = delta || {
        x: endCursor.x - prevCursor.x,
        y: endCursor.y - prevCursor.y
      }
      const boxes = this.getBoxesSelected
      const updates = []
      boxes.forEach(box => {
        const update = {
          id: box.id,
          x: box.x + delta.x,
          y: box.y + delta.y
        }
        updates.push(update)
      })
      this.updateBoxes(updates)
      store.commit('boxesWereDragged', true, { root: true })
      const itemIds = updates.map(update => update.id)
      connectionStore.updateConnectionPaths(itemIds)
      // boxStore.updateSnapGuides({ boxes: updates }) ? from currentBoxes to store
    },
    updateBoxesInfoDimensions (ids) {
      for (const id of ids) {
        const box = this.getBox(id)
        const { infoWidth, infoHeight } = utils.boxInfoPositionFromId(box.id)
        const update = {
          id: box.id,
          infoWidth,
          infoHeight
        }
        this.updateBox(update)
      }
    },
    updateBoxInfoDimensions (id) {
      this.updateBoxesInfoDimensions([id])
    },
    clearAllBoxesZ () {
      const boxes = this.getAllBoxes
      const updates = boxes.map(box => {
        return {
          id: box.id,
          z: 0
        }
      })
      this.updateBoxes(updates)
    },
    incrementBoxZ (id) {
      // highest z
      const boxes = this.getAllBoxes
      const maxInt = Number.MAX_SAFE_INTEGER - 1000
      let highestZ = utils.highestItemZ(boxes)
      if (highestZ > maxInt) {
        this.clearAllBoxesZ()
        highestZ = 1
      }
      const update = {
        id,
        z: highestZ + 1
      }
      this.updateBox(update)
    },

    // checked

    toggleBoxChecked (id, value) {
      const box = this.getBox(id)
      let { name } = box
      const checkbox = utils.checkboxFromString(name)
      name = name.replace(checkbox, '')
      if (value) {
        name = `[x] ${name}`
      } else {
        name = `[] ${name}`
      }
      const update = {
        id,
        name,
        nameUpdatedAt: new Date()
      }
      this.updateBox(update)
    },
    clearBoxChecked (id) {
      const box = this.getBox(id)
      let name = box.name
      name = name.replace('[x]', '').trim()
      const update = {
        id,
        name,
        nameUpdatedAt: new Date()
      }
      this.updateBox(update)
      this.updateBoxDimensions(id)
    },

    // contained items

    isItemInSelectedBoxes (item, type) {
      item.width = item.width || item.resizeWidth
      item.height = item.height || item.resizeHeight
      const selectedBoxes = this.getBoxesSelected
      return selectedBoxes.find(box => {
        box.width = box.resizeWidth
        box.height = box.resizeHeight
        const isTopLeft = utils.isPointInsideRect({
          x: item.x,
          y: item.y
        }, box)
        const isTopRight = utils.isPointInsideRect({
          x: item.x + item.width,
          y: item.y
        }, box)
        const isBottomLeft = utils.isPointInsideRect({
          x: item.x,
          y: item.y + item.height
        }, box)
        const isBottomRight = utils.isPointInsideRect({
          x: item.x + item.width,
          y: item.y + item.height
        }, box)
        return isTopLeft && isTopRight && isBottomLeft && isBottomRight
      })
    },
    itemsContainedInSelectedBoxes () {
      const cards = []
      const boxes = []
      // cards
      const cardStore = useCardStore()
      cardStore.getCardsSelectableByY.cards.forEach(card => {
        if (this.isItemInSelectedBoxes(card, 'card')) {
          cards.push(card)
        }
      })
      // boxes
      const selectableBoxes = this.getAllBoxes
      this.getBoxesSelectableByY.boxes.forEach(box => {
        if (this.isItemInSelectedBoxes(box, 'box')) {
          boxes.push(box)
        }
      })
      return { cards, boxes }
    },
    selectItemsInSelectedBoxes () {
      const { boxes, cards } = this.itemsContainedInSelectedBoxes()
      // boxes
      const boxIds = boxes.map(box => box.id)
      store.dispatch('multipleBoxesSelectedIds', boxIds)
      // cards
      const isMultipleBoxesSelected = Boolean(store.state.multipleBoxesSelectedIds.length)
      const cardIds = cards.map(card => card.id)
      store.dispatch('multipleCardsSelectedIds', cardIds)
      if (!isMultipleBoxesSelected) {
        store.commit('preventMultipleSelectedActionsIsVisible', true)
      }
    }

  }
})
