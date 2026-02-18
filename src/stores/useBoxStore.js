import { nextTick } from 'vue'
import { defineStore } from 'pinia'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useCardStore } from '@/stores/useCardStore'
import { useListStore } from '@/stores/useListStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

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
    },
    getBoxesInteracting () {
      const globalStore = useGlobalStore()
      const currentDraggingBoxId = globalStore.currentDraggingBoxId
      const multipleBoxesSelectedIds = globalStore.multipleBoxesSelectedIds
      let boxes
      if (multipleBoxesSelectedIds.length) {
        boxes = multipleBoxesSelectedIds
      } else {
        boxes = [currentDraggingBoxId]
      }
      boxes = boxes.map(boxId => this.getBox(boxId))
      boxes = boxes.filter(box => Boolean(box))
      return boxes
    },
    getBoxesNearLeftEdge () {
      const boxes = this.getAllBoxes
      return boxes.filter(box => {
        return box.x <= consts.edgeThreshold
      })
    },
    getBoxesNearTopEdge () {
      const boxes = this.getAllBoxes
      return boxes.filter(box => {
        return box.y <= consts.edgeThreshold
      })
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

    // subscribe triggers

    triggerCreateBox (updates) {},

    // init

    initializeBoxes (boxes = []) {
      boxes = boxes.filter(box => Boolean(box))
      const byId = {}
      const allIds = []
      boxes.forEach(box => {
        byId[box.id] = box
        allIds.push(box.id)
      })
      this.byId = byId
      this.allIds = allIds
    },
    initializeRemoteBoxes (remoteBoxes) {
      const localBoxes = utils.clone(this.getAllBoxes)
      const { updateItems, addItems, removeItems } = utils.syncItems(remoteBoxes, localBoxes)
      console.info('🎑 remote boxes', { updateItems, addItems, removeItems })
      this.updateBoxesState(updateItems)
      addItems.forEach(box => this.addBoxToState(box))
      removeItems.forEach(box => this.removeBoxFromState(box.id))
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
      const broadcastStore = useBroadcastStore()
      box = this.normalizeNewBox(box)
      this.addBoxToState(box)
      this.triggerCreateBox(box)
      broadcastStore.update({ updates: box, store: 'boxStore', action: 'addBoxToState' })
      if (isResizing) {
        globalStore.currentUserIsResizingBox = true
        globalStore.currentUserIsResizingBoxIds = [box.id]
      }
      await apiStore.addToQueue({ name: 'createBox', body: box })
    },

    // update

    updateBoxesState (updates) {
      const connectionStore = useConnectionStore()
      updates.forEach(update => {
        this.byId[update.id] = {
          ...this.byId[update.id],
          ...update
        }
      })
      // update connection paths
      // const isNameUpdated = updates.find(update => Boolean(update.name))
      // if (isNameUpdated) {
      const ids = updates.map(update => update.id)
      connectionStore.updateConnectionPathsByItemIds(ids)
      // }
    },
    async updateBoxes (updates) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      if (!userStore.getUserCanEditSpace) { return }
      this.updateBoxesState(updates)
      broadcastStore.update({ updates, store: 'boxStore', action: 'updateBoxesState' })
      for (const box of updates) {
        await apiStore.addToQueue({ name: 'updateBox', body: box })
      }
      await cache.updateSpace('boxes', this.getAllBoxes, spaceStore.id)
    },
    async updateBox (update) {
      await this.updateBoxes([update])
    },

    // remove

    removeBoxFromState (id) {
      const idIndex = this.allIds.indexOf(id)
      this.allIds.splice(idIndex, 1)
      delete this.byId[id]
    },
    removeBoxesRemote (ids) {
      for (const id of ids) {
        const idIndex = this.allIds.indexOf(id)
        this.allIds.splice(idIndex, 1)
        delete this.byId[id]
      }
    },
    async removeBoxes (ids) {
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      const canEditSpace = userStore.getUserCanEditSpace
      if (!canEditSpace) { return }
      const updates = []
      for (const id of ids) {
        this.removeBoxFromState(id)
        await apiStore.addToQueue({ name: 'removeBox', body: { id } })
        broadcastStore.update({ updates: ids, store: 'boxStore', action: 'removeBoxesRemote' })
      }
      const boxes = ids.map(id => this.getBox(id))
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
    moveBoxes ({ endCursor, prevCursor, delta, endSpaceCursor }) {
      const globalStore = useGlobalStore()
      const connectionStore = useConnectionStore()
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
      const boxes = this.getBoxesSelected
      const updates = []
      boxes.forEach(box => {
        let x = Math.round(box.x + delta.x)
        x = Math.max(0, x)
        let y = Math.round(box.y + delta.y)
        y = Math.max(0, y)
        const update = {
          id: box.id,
          x,
          y,
          resizeWidth: box.resizeWidth,
          resizeHeight: box.resizeHeight
        }
        updates.push(update)
        this.updatePageSize(update)
      })
      this.updateBoxes(updates)
      globalStore.boxesWereDragged = true
      const itemIds = updates.map(update => update.id)
      connectionStore.updateConnectionPathsByItemIds(itemIds)
      const cursor = endSpaceCursor || endCursor
      this.updateBoxSnapGuides({ items: updates, cursor })
    },
    updateBoxInfoDimensions (update) {
      const { infoWidth, infoHeight } = utils.boxInfoPositionFromId(update.id)
      update = {
        id: update.id,
        infoWidth,
        infoHeight
      }
      this.updateBox(update)
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
      connectionStore.updateConnectionPathsByItemIds(ids)
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
      this.updateBoxInfoDimensions(update)
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
      this.updateBoxInfoDimensions(update)
    },

    // contained items

    isItemInSelectedBoxes (item, selectedBox) {
      if (item.listId) { return }
      const threshold = 1
      item.width = item.width || item.resizeWidth
      item.height = item.height || item.resizeHeight
      let selectedBoxes = this.getBoxesSelected
      if (selectedBox?.id === item.id) { return }
      if (selectedBox) {
        selectedBoxes = [selectedBox]
      }
      return selectedBoxes.find(box => {
        box.width = box.resizeWidth
        box.height = box.resizeHeight
        const isTopLeft = utils.isPointInsideRect({
          x: item.x,
          y: item.y
        }, box, threshold)
        const isTopRight = utils.isPointInsideRect({
          x: item.x + item.width,
          y: item.y
        }, box, threshold)
        const isBottomLeft = utils.isPointInsideRect({
          x: item.x,
          y: item.y + item.height
        }, box, threshold)
        const isBottomRight = utils.isPointInsideRect({
          x: item.x + item.width,
          y: item.y + item.height
        }, box, threshold)
        return isTopLeft && isTopRight && isBottomLeft && isBottomRight
      })
    },
    getItemsContainedInSelectedBoxes (selectedBox) {
      const cardStore = useCardStore()
      const listStore = useListStore()
      const cards = []
      const boxes = []
      const lists = []
      // cards
      cardStore.getCardsSelectableByY.cards.forEach(card => {
        if (this.isItemInSelectedBoxes(card, selectedBox)) {
          cards.push(card)
        }
      })
      // boxes
      const selectableBoxes = this.getAllBoxes
      this.getBoxesSelectableByY.boxes.forEach(box => {
        if (this.isItemInSelectedBoxes(box, selectedBox)) {
          boxes.push(box)
        }
      })
      // lists
      listStore.getAllLists.forEach(list => {
        if (this.isItemInSelectedBoxes(list, selectedBox)) {
          lists.push(list)
        }
      })
      return { cards, boxes, lists }
    },
    selectItemsInSelectedBoxes (selectedBox) {
      const globalStore = useGlobalStore()
      const cardStore = useCardStore()
      const { boxes, cards, lists } = this.getItemsContainedInSelectedBoxes(selectedBox)
      // boxes
      const boxIds = boxes.map(box => box.id)
      globalStore.addMultipleToMultipleBoxesSelected(boxIds)
      // cards
      const isMultipleBoxesSelected = Boolean(globalStore.multipleBoxesSelectedIds.length)
      const cardIds = cards.map(card => card.id)
      globalStore.addMultipleToMultipleCardsSelected(cardIds)
      if (!isMultipleBoxesSelected) {
        globalStore.preventMultipleSelectedActionsIsVisible = true
      }
      // lists
      const listIds = lists.map(list => list.id)
      globalStore.addMultipleToMultipleListsSelected(listIds)
      lists.forEach(list => {
        const listCards = cardStore.getCardsByList(list.id)
        const listCardIds = listCards.map(card => card.id)
        globalStore.addMultipleToMultipleCardsSelected(listCardIds)
      })
    },

    // snap guides

    createBoxSnapGuide ({ side, item, targetBox, cursor }) {
      let time = Date.now()
      const prevGuide = this.boxSnapGuides.find(guide => guide.side === side)
      if (prevGuide) {
        time = prevGuide.time
      }
      let distance, sizeOutside
      if (side === 'left') {
        distance = Math.abs(cursor.x - targetBox.x)
        sizeOutside = Math.abs(targetBox.x - item.x)
      } else if (side === 'right') {
        distance = Math.abs(cursor.x - (targetBox.x + targetBox.width))
        sizeOutside = Math.abs((targetBox.x + targetBox.width) - (item.x + item.width))
      } else if (side === 'top') {
        distance = Math.abs(cursor.y - targetBox.y)
        sizeOutside = Math.abs(targetBox.y - item.y)
      } else if (side === 'bottom') {
        distance = Math.abs(cursor.y - (targetBox.y + targetBox.height))
        sizeOutside = Math.abs((targetBox.y + targetBox.height) - (item.y + item.height))
      }
      return { side, item, target: targetBox, time, distance, sizeOutside }
    },
    updateBoxSnapGuides ({ items, isChildren, cursor }) {
      const globalStore = useGlobalStore()
      if (!items.length) { return }
      if (globalStore.shouldSnapToGrid) { return }
      const snapThreshold = 6
      const spaceEdgeThreshold = 100
      const targetBoxes = this.getBoxesSelectableInViewport()
      const prevSnapGuides = globalStore.snapGuides
      let snapGuides = []
      if (isChildren) {
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
          // item side is on target edge
          const itemIsOverTargetBoxTop = utils.isBetween({ value: targetBoxTop, min: itemTop, max: itemBottom })
          const itemIsOverTargetBoxBottom = utils.isBetween({ value: targetBoxBottom, min: itemTop, max: itemBottom })
          const itemIsOverTargetBoxLeft = utils.isBetween({ value: targetBoxLeft, min: itemLeft, max: itemRight })
          const itemIsOverTargetBoxRight = utils.isBetween({ value: targetBoxRight, min: itemLeft, max: itemRight })
          // item inside target
          const itemLeftIsInsideTargetBox = utils.isBetween({ value: itemLeft, min: targetBoxLeft, max: targetBoxRight })
          const itemRightIsInsideTargetBox = utils.isBetween({ value: itemRight, min: targetBoxLeft, max: targetBoxRight })
          const itemTopIsInsideTargetBox = utils.isBetween({ value: itemTop, min: targetBoxTop, max: targetBoxBottom })
          const itemBottomIsInsideTargetBox = utils.isBetween({ value: itemBottom, min: targetBoxTop, max: targetBoxBottom })
          // snap left
          if (itemIsOverTargetBoxLeft && (itemTopIsInsideTargetBox || itemBottomIsInsideTargetBox)) {
            const snapGuide = this.createBoxSnapGuide({ side: 'left', item, targetBox, cursor })
            snapGuides.push(snapGuide)
          }
          // snap right
          if (itemIsOverTargetBoxRight && (itemTopIsInsideTargetBox || itemBottomIsInsideTargetBox)) {
            const snapGuide = this.createBoxSnapGuide({ side: 'right', item, targetBox, cursor })
            snapGuides.push(snapGuide)
          }
          // snap top
          if (itemIsOverTargetBoxTop && (itemLeftIsInsideTargetBox || itemRightIsInsideTargetBox)) {
            const snapGuide = this.createBoxSnapGuide({ side: 'top', item, targetBox, cursor })
            snapGuides.push(snapGuide)
          }
          // snap bottom
          if (itemIsOverTargetBoxBottom && (itemLeftIsInsideTargetBox || itemRightIsInsideTargetBox)) {
            const snapGuide = this.createBoxSnapGuide({ side: 'bottom', item, targetBox, cursor })
            snapGuides.push(snapGuide)
          }
        })
        snapGuides = sortBy(snapGuides, ['distance'])
      })
      // limit each origin item to it's closest target
      const normalizedGuides = {}
      snapGuides.forEach(snapGuide => {
        const itemGuide = normalizedGuides[snapGuide.item.id]
        if (itemGuide) {
          if (snapGuide.distance < itemGuide.distance) {
            normalizedGuides[snapGuide.item.id] = snapGuide
          }
        } else {
          normalizedGuides[snapGuide.item.id] = snapGuide
        }
      })
      const normalizedGuideKeys = Object.keys(normalizedGuides)
      snapGuides = normalizedGuideKeys.map(key => normalizedGuides[key])
      this.boxSnapGuides = snapGuides
    },
    async updateBoxSnapToSize (snapGuide) {
      const { side, item, target, sizeOutside } = snapGuide
      const padding = consts.spaceBetweenCards * 2
      const update = { id: target.id }
      const delta = {
        x: item.x - target.x,
        y: item.y - target.y
      }
      if (side === 'right') {
        // increase width
        update.resizeWidth = target.width + sizeOutside + padding
        // increase target box height if item is taller than target
        if (item.height + delta.y > target.resizeHeight) {
          update.resizeHeight = item.height + delta.y + padding
        }
      } else if (side === 'left') {
        // increase width and shift left
        update.resizeWidth = target.width + sizeOutside + padding
        update.x = target.x - sizeOutside - padding
        // increase target box height if item is taller than target
        if (item.height + delta.y > target.resizeHeight) {
          update.resizeHeight = item.height + delta.y + padding
        }
      } else if (side === 'top') {
        // increase height and shift up
        const paddingTop = 20 + padding
        update.resizeHeight = target.resizeHeight + sizeOutside + paddingTop
        update.y = target.y - sizeOutside - paddingTop
        // increase target box width if item is wider than target
        if (item.width + delta.x > target.resizeWidth) {
          update.resizeWidth = item.width + delta.x + padding
        }
      } else if (side === 'bottom') {
        // increase width
        update.resizeHeight = target.resizeHeight + sizeOutside + padding
        // increase target box width if item is wider than target
        if (item.width + delta.x > target.resizeWidth) {
          update.resizeWidth = item.width + delta.x + padding
        }
      }
      this.updateBox(update)
      // this.boxSnapGuides = []
    }
  }
})
