import { nextTick } from 'vue'
import { defineStore } from 'pinia'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useCardStore } from '@/stores/useCardStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'
import { useHistoryStore } from '@/stores/useHistoryStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

import { nanoid } from 'nanoid'
import sortBy from 'lodash-es/sortBy'
import randomColor from 'randomcolor'
import uniq from 'lodash/uniq'

export const useBoxStore = defineStore('boxes', {
  state: () => ({
    byId: {},
    allIds: [],
    dirtyBoxIds: new Set(),
    pendingUpdates: new Map(),
    isUpdating: false,
    boxSnapGuides: [] // { side, origin, target }, { ... }
  }),

  getters: {
    getAllBoxes () {
      return this.allIds.map(id => this.byId[id])
    },
    getBoxesIsLocked () {
      const boxes = this.allIds.map(id => this.byId[id])
      return boxes.filter(box => box.isLocked)
    },
    getBoxesIsNotLocked () {
      const boxes = this.allIds.map(id => this.byId[id])
      return boxes.filter(box => !box.isLocked)
    },
    getBoxesSelected () {
      const globalStore = useGlobalStore()
      let ids = globalStore.multipleBoxesSelectedIds
      if (!ids.length) {
        ids = [globalStore.currentDraggingBoxId]
      }
      ids = ids.filter(id => Boolean(id))
      const boxes = ids.map(id => this.byId[id])
      return boxes
    },
    getBoxesSelectableByY () {
      let boxes = this.allIds.map(id => this.byId[id])
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
    },
    getBoxesResizing () {
      const globalStore = useGlobalStore()
      const ids = globalStore.currentUserIsResizingBoxIds
      // if (this.isSelectedIds.length) {
      //   boxIds = this.isSelectedIds
      // }
      const boxes = ids.map(id => this.byId[id])
      return boxes
    },
    getBoxColors () {
      const boxes = this.getAllBoxes
      let colors = boxes.map(box => box.color)
      colors = colors.filter(color => Boolean(color))
      return uniq(colors)
    }

  },

  actions: {

    getBox (id) {
      return this.byId[id]
    },
    getBoxesSelectableInViewport () {
      const elements = document.querySelectorAll('.box')
      let boxes = []
      elements.forEach(box => {
        if (box.dataset.isVisibleInViewport === 'false') { return }
        if (box.dataset.isLocked === 'true') { return }
        boxes.push(box)
      })
      boxes = boxes.map(box => this.getBox(box.dataset.boxId))
      return boxes
    },
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
    },

    // create

    normalizeNewBox (box) {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const count = this.allIds.length
      const minBoxSize = consts.minBoxSize
      const isThemeDark = userStore.theme === 'dark'
      const color = randomColor({ luminosity: 'dark' })
      return {
        id: box.id || nanoid(),
        spaceId: spaceStore.id,
        userId: userStore.id,
        x: box.x,
        y: box.y,
        resizeWidth: box.resizeWidth || minBoxSize,
        resizeHeight: box.resizeHeight || minBoxSize,
        color: box.color || color,
        fill: box.fill || 'filled', // empty, filled
        name: box.name || `Box ${count}`,
        infoHeight: 57,
        infoWidth: 34,
        headerFontId: userStore.prevHeaderFontId || 0,
        background: box.background,
        backgroundIsStretch: box.backgroundIsStretch
      }
    },
    addBoxToState (box) {
      this.byId[box.id] = box
      this.allIds.push(box.id)
    },
    async createBox (box, isResizing) {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const historyStore = useHistoryStore()
      // const broadcastStore = useBroadcastStore()
      box = this.normalizeNewBox(box)
      this.addBoxToState(box)
      // if (!updates.isBroadcast) {
      // broadcastStore.update({ updates: box, type: 'createBox', handler: 'currentBoxes/addBoxToState' })
      // historyStore.add({ boxes: [box] })
      if (isResizing) {
        historyStore.pause()
        globalStore.currentUserIsResizingBox = true
        globalStore.currentUserIsResizingBoxIds = [box.id]
      }
      await apiStore.addToQueue({ name: 'createBox', body: box })
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
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      // const broadcastStore = useBroadcastStore()
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
        // broadcastStore.update({ updates, storeName: 'boxStore', actionName: 'updateBoxes' })
      }
      await apiStore.addToQueue({ name: 'updateMultipleBoxes', body: { boxes: updates } })
      await spaceStore.updateSpace({
        editedAt: new Date(),
        editedByUserId: userStore.id
      })
      // TODO history? if unpaused
      await cache.updateSpace('boxes', this.getAllBoxes, spaceStore.id)
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
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const historyStore = useHistoryStore()
      // const broadcastStore = useBroadcastStore()
      const canEditSpace = userStore.getUserCanEditSpace
      if (!canEditSpace) { return }
      const updates = []
      for (const id of ids) {
        const idIndex = this.allIds.indexOf(id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[id]
        await apiStore.addToQueue({ name: 'removeBox', body: { id } })
        // broadcastStore.update({ updates: box, type: 'removeBox', handler: 'currentBoxes/remove' })
      }
      const boxes = ids.map(id => this.getBox(id))
      // historyStore.add({ boxes, isRemoved: true })
      await cache.updateSpace('boxes', this.getAllBoxes, spaceStore.id)
      await nextTick()
      const connectionStore = useConnectionStore()
      connectionStore.removeConnectionsFromItems(ids)
    },
    removeBox (id) {
      this.removeBoxes([id])
    },

    // position

    updatePageSize (box) {
      const globalStore = useGlobalStore()
      const boxY = box.y + box.resizeHeight
      if (boxY >= globalStore.pageHeight) {
        globalStore.pageHeight = boxY
      }
      const boxX = box.x + box.resizeWidth
      if (boxX >= globalStore.pageWidth) {
        globalStore.pageWidth = boxX
      }
    },
    moveBoxes ({ endCursor, prevCursor, delta }) {
      const globalStore = useGlobalStore()
      const connectionStore = useConnectionStore()
      const zoom = globalStore.getSpaceCounterZoomDecimal
      if (!endCursor || !prevCursor) { return }
      endCursor = {
        x: endCursor.x * zoom,
        y: endCursor.y * zoom
      }
      if (globalStore.shouldSnapToGrid) {
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
          y: box.y + delta.y,
          resizeWidth: box.resizeWidth,
          resizeHeight: box.resizeHeight
        }
        updates.push(update)
        this.updatePageSize(update)
      })
      this.updateBoxes(updates)
      globalStore.boxesWereDragged = true
      const itemIds = updates.map(update => update.id)
      connectionStore.updateConnectionPaths(itemIds)
      this.updateBoxSnapGuides(updates)
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
    resizeBoxes (ids, delta) {
      const globalStore = useGlobalStore()
      const updates = []
      ids.forEach(id => {
        const rect = utils.boxElementDimensions({ id })
        let width = rect.width
        let height = rect.height
        width = width + delta.x
        height = height + delta.y
        const infoPosition = utils.boxInfoPositionFromId(id)
        if (!infoPosition) { return }
        const { infoWidth, infoHeight } = infoPosition
        const box = { id, resizeWidth: width, resizeHeight: height, infoWidth, infoHeight }
        updates.push(box)
        this.updatePageSize(box)
        globalStore.currentUserIsResizingBox = true
        globalStore.currentUserIsResizingBoxIds = [box.id]
      })
      const connectionStore = useConnectionStore()
      connectionStore.updateConnectionPaths(ids)
      this.updateBoxes(updates)
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
      const globalStore = useGlobalStore()
      const { boxes, cards } = this.itemsContainedInSelectedBoxes()
      // boxes
      const boxIds = boxes.map(box => box.id)
      globalStore.updateMultipleBoxesSelectedIds(boxIds)
      // cards
      const isMultipleBoxesSelected = Boolean(globalStore.multipleBoxesSelectedIds.length)
      const cardIds = cards.map(card => card.id)
      globalStore.updateMultipleCardsSelectedIds(cardIds)
      if (!isMultipleBoxesSelected) {
        globalStore.preventMultipleSelectedActionsIsVisible = true
      }
    },

    // snap guides

    getBoxSnapGuide ({ side, item, targetBox }) {
      let time = Date.now()
      const prevGuide = this.boxSnapGuides.find(guide => guide.side === side)
      if (prevGuide) {
        time = prevGuide.time
      }
      return { side, origin: item, target: targetBox, time }
    },
    updateBoxSnapGuides (items, isCards) {
      const globalStore = useGlobalStore()
      if (!items.length) { return }
      if (globalStore.shouldSnapToGrid) { return }
      const snapThreshold = 6
      const spaceEdgeThreshold = 100
      const targetBoxes = this.getBoxesSelectableInViewport()
      const prevSnapGuides = globalStore.snapGuides
      let snapGuides = []
      if (isCards) {
        items = [utils.boundaryRectFromItems(items)]
      }
      items = items.map(item => {
        item.width = item.resizeWidth || item.width
        item.height = item.resizeHeight || item.height
        return item
      })
      // find
      items.forEach(item => {
        targetBoxes.forEach(targetBox => {
          if (targetBox.id === item.id) { return }
          targetBox.width = targetBox.resizeWidth
          targetBox.height = targetBox.resizeHeight
          const isBetweenTargetBoxPointsX = utils.isBetween({
            value: item.x,
            min: targetBox.x + snapThreshold,
            max: targetBox.x + targetBox.width - snapThreshold
          })
          const isBetweenTargetBoxPointsY = utils.isBetween({
            value: item.y,
            min: targetBox.y + snapThreshold,
            max: targetBox.y + targetBox.height - snapThreshold
          })
          // item sides
          const itemLeft = item.x
          const itemRight = item.x + item.width
          const itemTop = item.y
          const itemBottom = item.y + item.height
          // target sides
          const targetBoxLeft = targetBox.x
          const targetBoxRight = targetBox.x + targetBox.width
          const targetBoxTop = targetBox.y
          const targetBoxBottom = targetBox.y + targetBox.height
          const targetBoxIsMinX = targetBox.x <= spaceEdgeThreshold
          const targetBoxIsMinY = targetBox.y <= spaceEdgeThreshold
          // snap left
          const isSnapLeftFromItemRight = Math.abs(itemRight - targetBoxLeft) <= snapThreshold
          const isSnapLeftFromItemLeft = Math.abs(itemLeft - targetBoxLeft) <= snapThreshold
          if (!targetBoxIsMinX && isBetweenTargetBoxPointsY && (isSnapLeftFromItemRight || isSnapLeftFromItemLeft)) {
            const snapGuide = this.getBoxSnapGuide({ side: 'left', item, targetBox })
            snapGuides.push(snapGuide)
          }
          // snap right
          const isSnapRightFromItemLeft = Math.abs(itemLeft - targetBoxRight) <= snapThreshold
          const isSnapRightFromItemRight = Math.abs(itemRight - targetBoxRight) <= snapThreshold
          if (isBetweenTargetBoxPointsY && (isSnapRightFromItemLeft || isSnapRightFromItemRight)) {
            const snapGuide = this.getBoxSnapGuide({ side: 'right', item, targetBox })
            snapGuides.push(snapGuide)
          }
          // snap top
          const isSnapTopFromItemBottom = Math.abs(itemTop - targetBoxTop) <= snapThreshold
          const isSnapTopFromItemTop = Math.abs(itemBottom - targetBoxTop) <= snapThreshold
          if (!targetBoxIsMinY && isBetweenTargetBoxPointsX && (isSnapTopFromItemBottom || isSnapTopFromItemTop)) {
            const snapGuide = this.getBoxSnapGuide({ side: 'top', item, targetBox })
            snapGuides.push(snapGuide)
          }
          // snap bottom
          const isSnapBottomFromItemTop = Math.abs(itemTop - targetBoxBottom) <= snapThreshold
          const isSnapBottomFromItemBottom = Math.abs(itemBottom - targetBoxBottom) <= snapThreshold
          if (isBetweenTargetBoxPointsX && (isSnapBottomFromItemTop || isSnapBottomFromItemBottom)) {
            const snapGuide = this.getBoxSnapGuide({ side: 'bottom', item, targetBox })
            snapGuides.push(snapGuide)
          }
        })
      })
      // limit each origin item to it's closest target
      const normalizedGuides = {}
      snapGuides.forEach(snapGuide => {
        const originGuide = normalizedGuides[snapGuide.origin.id]
        if (originGuide) {
          if (snapGuide.distance < originGuide.distance) {
            normalizedGuides[snapGuide.origin.id] = snapGuide
          }
        } else {
          normalizedGuides[snapGuide.origin.id] = snapGuide
        }
      })
      const normalizedGuideKeys = Object.keys(normalizedGuides)
      snapGuides = normalizedGuideKeys.map(key => normalizedGuides[key])
      this.boxSnapGuides = snapGuides
    },
    async updateBoxSnapToPosition (snapGuide) {
      let { side, origin, target } = snapGuide
      const borderWidth = 2
      const update = { id: origin.id }
      origin = this.byId[origin.id]
      if (!origin) { return }
      const alignWithOriginY = side === 'right' || side === 'left'
      // size
      if (alignWithOriginY) {
        update.y = target.y
        update.resizeHeight = Math.max(target.resizeHeight, origin.resizeHeight)
      } else {
        update.x = target.x
        update.resizeWidth = Math.max(target.resizeWidth, origin.resizeWidth)
      }
      // position
      if (side === 'right') {
        update.x = target.x + target.resizeWidth - borderWidth
      } else if (side === 'left') {
        update.x = target.x - origin.resizeWidth + borderWidth
      } else if (side === 'top') {
        update.y = target.y - origin.resizeHeight + borderWidth
      } else if (side === 'bottom') {
        update.y = target.y + target.resizeHeight - borderWidth
      }
      // historyStore.resume()
      this.boxSnapGuides = []
      await nextTick()
      this.updateBox(update)
    },
    async updateBoxSnapToSize (snapGuide) {
      const { side, origin, target } = snapGuide
      const padding = consts.spaceBetweenCards
      const update = { id: target.id }
      const delta = {
        x: origin.x - target.x,
        y: origin.y - target.y
      }
      if (side === 'right') {
        // increase width
        update.resizeWidth = target.width + origin.width + padding
        // increase height if origin is taller than target
        if (origin.height + delta.y > target.resizeHeight) {
          update.resizeHeight = origin.height + delta.y + padding
        }
      } else if (side === 'left') {
        // increase width and shift left
        update.resizeWidth = target.width + origin.width + padding
        update.x = target.x - origin.width - padding
        // increase height if origin is taller than target
        if (origin.height + delta.y > target.resizeHeight) {
          update.resizeHeight = origin.height + delta.y + padding
        }
      } else if (side === 'top') {
        // increase height and shift up
        const paddingTop = 30 + padding
        update.resizeHeight = target.resizeHeight + origin.height + paddingTop
        update.y = target.y - origin.height - paddingTop
        // increase width if origin is wider than target
        if (origin.width + delta.x > target.resizeWidth) {
          update.resizeWidth = origin.width + delta.x + padding
        }
      } else if (side === 'bottom') {
        // increase width
        update.resizeHeight = target.resizeHeight + origin.height + padding
        // increase width if origin is wider than target
        if (origin.width + delta.x > target.resizeWidth) {
          update.resizeWidth = origin.width + delta.x + padding
        }
      }
      // historyStore.resume()
      this.updateBox(update)
      // this.boxSnapGuides = []
    }
  }
})
