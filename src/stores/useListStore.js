import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useCardStore } from '@/stores/useCardStore'
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
import last from 'lodash-es/last'
import uniq from 'lodash/uniq'

export const useListStore = defineStore('lists', {
  state: () => ({
    byId: {},
    allIds: [],
    listSnapGuides: {}, // { listId, listPositionIndex, cards }
    listChildPlaceholders: {} // { listId: [ card{ id, x, y, height }, {..}] }
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
      return uniq(colors)
    },
    getListsResizing () {
      const globalStore = useGlobalStore()
      const ids = globalStore.currentUserIsResizingListIds
      const lists = ids.map(id => this.byId[id])
      return lists
    },
    getListsNearLeftEdge () {
      const lists = this.getAllLists
      return lists.filter(list => {
        return list.x <= consts.edgeThreshold
      })
    },
    getCollapsedLists () {
      const lists = this.getAllLists
      return lists.filter(list => {
        return list.isCollapsed
      })
    }
  },

  actions: {

    getList (id) {
      return this.byId[id]
    },

    // subscribe triggers

    triggerCreateList (updates) {},
    triggerClearShouldPreventNextListInfoButton () {},

    // init

    initializeLists (lists = []) {
      // TEMP stubbed list data
      lists = [
        {
          id: '123xyz',
          name: 'List 0 laksdjflksa jdfklajsd flksajdklf jsaldf',
          color: 'teal',
          x: 300,
          y: 100,
          z: 0,
          resizeWidth: consts.minListWidth,
          isCollapsed: false,
          height: consts.listEmptyHeight
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
      const { id, color, x, y, name, resizeWidth, spaceId } = list
      const zoom = globalStore.getSpaceCounterZoomDecimal
      const count = this.allIds.length
      list.id = id || nanoid()
      list.color = color || randomColor({ luminosity: 'dark' })
      list.y = Math.max(y, consts.minItemXY)
      list.resizeWidth = resizeWidth || consts.minListWidth
      list.isCollapsed = false
      list.name = name || `List ${count}`
      list.userId = userStore.id
      list.spaceId = spaceId || spaceStore.id
      return list
    },
    addListToState (list) {
      this.byId[list.id] = list
      this.allIds.push(list.id)
    },
    async createList ({ list = {}, isResizing }) {
      const globalStore = useGlobalStore()
      const apiStore = useApiStore()
      const userStore = useUserStore()
      const broadcastStore = useBroadcastStore()
      if (!userStore.getUserIsSpaceMember) { return }
      list = this.normalizeNewList(list)
      this.addListToState(list)
      this.triggerCreateList(list)
      if (list.isFromBroadcast) { return }
      broadcastStore.update({ updates: list, store: 'listStore', action: 'addListToState' })
      if (isResizing) {
        globalStore.currentUserIsResizingList = true
        globalStore.currentUserIsResizingListIds = [list.id]
      }
      await apiStore.addToQueue({ name: 'createList', body: list })
    },

    // snap

    updateShouldSnapBackToList () {
      const globalStore = useGlobalStore()
      const cardStore = useCardStore()
      const card = cardStore.getCurrentDraggingCard()
      if (!card) { return }
      if (!card.listId) { return }
      const list = this.getList(card.listId)
      if (!list) { return }
      const cardIsInsideList = utils.isNormalizedRectAInsideRectB(card, list)
      globalStore.shouldSnapBackToList = cardIsInsideList
    },
    updateListSnapGuides (cards) {
      const globalStore = useGlobalStore()
      const cardStore = useCardStore()
      if (globalStore.preventItemSnapping) { return }
      if (!globalStore.currentUserIsDraggingCard) { return }
      this.updateShouldSnapBackToList()
      const card = cardStore.getCurrentDraggingCard()
      const lists = this.getAllLists
      const list = lists.find(listRect => {
        // if list has cards, list height is list-info only
        listRect = utils.clone(listRect)
        const isListCards = cardStore.getCardsByList(listRect.id)
        if (isListCards.length) {
          listRect.height = consts.listInfoHeight
        }
        // is card in list rect
        return utils.isNormalizedRectAInsideRectB(card, listRect)
      })
      // no snap
      if (!list) {
        this.listSnapGuides = {}
        return
      }
      // snap to list card
      this.listSnapGuides = { listId: list.id, cards }
      const listCards = cardStore.getCardsByList(list.id)
      const listCardIds = listCards.map(listCard => listCard.id)
      if (!listCards.length) { return }
      const isSnappingToListCard = cardStore.cardSnapGuides.find(item => listCardIds.includes(item.target.id))
      if (isSnappingToListCard) { return }
      // snap to list (prepend)
      const listCard = listCards[0]
      cardStore.cardSnapGuides = [{
        item: card,
        side: 'top',
        target: listCard
      }]
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
      this.updateLists([update])
    },
    moveListChildPlaceholders (list, delta) {
      let cards = this.listChildPlaceholders[list.id]
      if (!cards) { return }
      cards = cards.map(card => {
        card.x = Math.round(card.x + delta.x)
        card.y = Math.round(card.y + delta.y)
        return card
      })
      this.listChildPlaceholders[list.id] = cards
    },
    moveLists ({ endCursor, prevCursor, delta }) {
      const globalStore = useGlobalStore()
      const cardStore = useCardStore()
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
        this.moveListChildPlaceholders(list, delta)
        let x = Math.round(list.x + delta.x)
        x = Math.max(0, x)
        let y = Math.round(list.y + delta.y)
        y = Math.max(0, y)
        return {
          id: list.id,
          x,
          y
        }
      })
      // this.updatePageSize(lists[0]) // ??might automatically be done by cards inside
      this.updateLists(lists)
      globalStore.listsWereDragged = true
      // lists = lists.map(list => this.getList(list.id))
      // boxStore.updateListSnapGuides({ items: lists, isLists: true, cursor: endCursor })
    },

    // position

    clearAllListsZ () {
      const lists = this.getAllLists
      const updates = lists.map(list => {
        return {
          id: list.id,
          z: 0
        }
      })
      this.updateLists(updates)
    },
    incrementListZ (id) {
      // highest z
      const lists = this.getAllLists
      const maxInt = Number.MAX_SAFE_INTEGER - 1000
      let highestZ = utils.highestItemZ(lists)
      if (highestZ > maxInt) {
        this.clearAllListsZ()
        highestZ = 1
      }
      const update = {
        id,
        z: highestZ + 1
      }
      this.updateList(update)
    },
    updateListDimensions (list, cards) {
      const cardStore = useCardStore()
      if (!list) { return }
      cards = cards || cardStore.getCardsByList(list.id)
      // list has cards
      if (cards.length) {
        const card = last(cards)
        const listHeight = (card.y - list.y) + card.height + consts.listPadding
        this.updateList({
          id: list.id,
          height: listHeight
        })
        this.listChildPlaceholders[list.id] = cards
      // list is empty
      } else {
        this.listChildPlaceholders[list.id] = []
        this.updateList({
          id: list.id,
          height: consts.listEmptyHeight
        })
      }
    },
    selectItemsInSelectedLists (selectedList) {
      const globalStore = useGlobalStore()
      const cardStore = useCardStore()
      const lists = this.getListsSelected
      let cards = []
      lists.forEach(list => {
        const listCards = cardStore.getCardsByList(list.id)
        cards = cards.concat(listCards)
      })
      const isMultipleListsSelected = Boolean(globalStore.multipleListsSelectedIds.length)
      const cardIds = cards.map(card => card.id)
      globalStore.addMultipleToMultipleCardsSelected(cardIds)
      if (!isMultipleListsSelected) {
        globalStore.preventMultipleSelectedActionsIsVisible = true
      }
    },

    // resize

    async resizeListChildCards (list, width) {
      const cardStore = useCardStore()
      // child width
      let childWidth = utils.listChildWidth(width)
      const minChildWidth = utils.listChildWidth(consts.minListWidth)
      childWidth = Math.max(minChildWidth, childWidth)
      // update cards
      let cards = cardStore.getCardsByList(list.id)
      cards = cards.map(card => {
        return {
          id: card.id,
          resizeWidth: childWidth,
          width: childWidth
        }
      })
      await cardStore.updateCards(cards)
      const cardIds = cards.map(card => card.id)
      await cardStore.updateCardsDimensions(cardIds)
      list = this.getList(list.id)
      cardStore.updateCardPositionsInList(list)
    },
    async resizeLists (ids, delta) {
      const globalStore = useGlobalStore()
      globalStore.currentUserIsResizingList = true
      globalStore.currentUserIsResizingListIds = ids
      for (const id of ids) {
        const rect = utils.listElementDimensions({ id })
        let width = rect.width
        width = width + delta.x
        width = Math.max(width, consts.minListWidth)
        const list = { id, resizeWidth: width }
        this.updateList(list)
        this.resizeListChildCards(list, width)
      }
    },
    async clearResizeLists (id) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const width = userStore.cardSettingsCardWrapWidth
      await nextTick()
      const ids = uniq(globalStore.multipleListsSelectedIds.concat([id]))
      for (const id of ids) {
        const list = this.getList(id)
        this.updateList({
          id,
          resizeWidth: width
        })
        this.resizeListChildCards(list, width)
      }
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
      const cardStore = useCardStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      const canEditSpace = userStore.getUserIsSpaceMember
      if (!canEditSpace) { return }
      // remove cards from lists
      ids.forEach(id => {
        const cards = cardStore.getCardsByList(id)
        cardStore.removeCardsFromLists(cards)
      })
      // remove lists
      for (const id of ids) {
        const list = this.getList(id)
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
