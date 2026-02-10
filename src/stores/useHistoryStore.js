import { nextTick, watch } from 'vue'
import { defineStore } from 'pinia'
// import { useUserStore } from '@/stores/useUserStore'
// import { useSpaceStore } from '@/stores/useSpaceStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useLineStore } from '@/stores/useLineStore'
import { useListStore } from '@/stores/useListStore'

import { useGlobalStore } from '@/stores/useGlobalStore'

import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'

const showDebugMessages = false
const max = 30

export const useHistoryStore = defineStore('history', {
  // adapted from https://twitter.com/steveruizok/status/1487052071685734410
  // each `patch` contains `new` and `prev` updates
  // `pointer` is the current position in history
  //
  //                    ┌──────────────────────┐
  //                    │                      │
  //                    │ PREV                 │
  //                    │ Patch 0              │
  //                    │ [{action prev, new}] │
  //                    │                      │
  //                    ├──────────────────────┤
  //                    │                      │
  //                    │ PREV                 │
  //                    │ Patch 1              │
  //                    │ [{…}]                │       ▲
  //                    │                      │       │
  //                    ├──────────────────────┤       │
  //                    │                      │░  ┌ ─ ─ ─   ┌ ─ ─ ─
  //  ┌─────────┐       │ NEW                  │░    Undo │    Redo │
  //  │ Pointer │──────▶│ Patch 2              │░  └ ─ ─ ─   └ ─ ─ ─
  //  └─────────┘░      │ [{…}]                │░                │
  //   ░░░░░░░░░░░      │                      │░                │
  //                    └──────────────────────┘░                ▼
  //                     ░░░░░░░░░░░░░░░░░░░░░░░░
  //
  //  subscribe to items → process updates → create debounced patch
  //
  state: () => ({
    patches: [],
    pointer: 0,
    shouldPreventPatchUpdates: false,
    pendingPatch: [],
    // card
    cardUpdatesProcessing: new Map(),
    prevCardUpdatesProcessing: new Map(),
    cardUpdateKeysProcessing: new Set(),
    // box
    boxUpdatesProcessing: new Map(),
    prevBoxUpdatesProcessing: new Map(),
    boxUpdateKeysProcessing: new Set(),
    // connection
    connectionUpdatesProcessing: new Map(),
    prevConnectionUpdatesProcessing: new Map(),
    connectionUpdateKeysProcessing: new Set(),
    // line
    // lineUpdatesProcessing: new Map(),
    // prevLineUpdatesProcessing: new Map(),
    // lineUpdateKeysProcessing: new Set(),
    // list
    listUpdatesProcessing: new Map(),
    prevListUpdatesProcessing: new Map(),
    listUpdateKeysProcessing: new Set()

  }),
  actions: {

    // patches and pointers

    addPatch (patch) {
      utils.typeCheck({ value: patch, type: 'array', origin: 'addPatch' })
      // console.log('🌺 addPatch', patch)
      patch = patch.filter(item => Boolean(item))
      if (!patch.length) { return }
      this.pendingPatch.push(...patch)
      this.debouncePendingPatch()
    },
    commitPendingPatch () {
      if (!this.pendingPatch.length) { return }
      const combinedPatch = utils.clone(this.pendingPatch)
      this.pendingPatch = []
      // remove patches above pointer
      this.patches = this.patches.slice(0, this.pointer)
      // add patch to pointer
      this.patches.splice(this.pointer, 0, combinedPatch)
      this.updatePointer({ increment: true })
      this.trimPatches()
      if (showDebugMessages) {
        console.info('⏺ add history patch', { newPatch: combinedPatch, pointer: this.pointer })
      }
    },
    debouncePendingPatch: debounce(function () {
      this.commitPendingPatch()
    }, 150, { maxWait: 200 }), // maxWait ensures it fires even if constantly triggered

    // Shared debounced processor for all entity types
    processAllUpdates: debounce(function () {
      this.processCardUpdatesNow()
      this.processBoxUpdatesNow()
      this.processConnectionUpdatesNow()
      this.processListUpdatesNow()
    }, 100),
    trimPatches () {
      if (this.patches.length > max) {
        this.patches.shift()
        this.pointer = this.pointer - 1
      }
    },
    reset () {
      this.patches = []
      this.pointer = 0
      this.pendingPatch = []
      if (showDebugMessages) {
        console.info('reset history')
      }
    },
    updatePointer ({ increment, decrement }) {
      if (increment) {
        this.pointer = this.pointer + 1
      } else if (decrement) {
        this.pointer = this.pointer - 1
      }
      this.pointer = Math.max(0, this.pointer)
      this.pointer = Math.min(this.patches.length, this.pointer)
      if (showDebugMessages) {
        console.info('✦ update history pointer', this.pointer, increment, decrement)
      }
    },

    // init subscribers

    init () {
      this.subscribeToCards()
      this.subscribeToBoxes()
      this.subscribeToConnections()
      // this.subscribeToLines() // todo
      this.subscribeToLists()
    },

    // card events

    processCardUpdatesNow () {
      if (!this.cardUpdatesProcessing.size) { return }
      const ignoreKeys = ['id', 'nameUpdatedAt', 'height', 'width', 'z', 'prevHeight', 'prevWidth', 'urlPreviewDescription', 'urlPreviewFavicon', 'urlPreviewImage', 'urlPreviewTitle', 'urlPreviewUrl', 'urlPreviewIframeUrl', 'shouldUpdateUrlPreview', 'linkToCardId']
      const cardStore = useCardStore()
      const patch = []
      this.cardUpdatesProcessing.forEach((update, id) => {
        const keys = Array.from(this.cardUpdateKeysProcessing)
        const everyKeyIsIgnored = keys.every(key => ignoreKeys.includes(key))
        if (everyKeyIsIgnored) { return }
        let prevCard = this.prevCardUpdatesProcessing.get(id)
        prevCard = utils.objectPickKeys(prevCard, keys)
        const newCard = this.cardUpdatesProcessing.get(id)
        patch.push({
          action: 'cardUpdated',
          prev: prevCard,
          new: newCard
        })
      })
      if (patch.length) {
        this.addPatch(patch)
      }
      this.cardUpdatesProcessing = new Map()
      this.prevCardUpdatesProcessing = new Map()
      this.cardUpdateKeysProcessing = new Set()
    },
    processCardsCreated (updates) {
      const patch = updates.map(update => {
        return {
          action: 'cardCreated',
          new: update
        }
      })
      this.addPatch(patch)
    },
    processCardsRemoved (updates) {
      const cardStore = useCardStore()
      const cards = updates.map(id => cardStore.getCard(id))
      const patch = cards.map(card => {
        return {
          action: 'cardRemoved',
          new: card
        }
      })
      this.addPatch(patch)
    },
    subscribeToCards () {
      const cardStore = useCardStore()
      cardStore.$onAction(({ name, args, after, onError }) => {
        if (this.shouldPreventPatchUpdates) { return }
        const updates = args[0]
        switch (name) {
          case 'updateCards':
            updates.forEach(update => {
              const keys = Object.keys(update)
              keys.forEach(key => this.cardUpdateKeysProcessing.add(key))
              if (this.cardUpdatesProcessing.has(update.id)) {
                // Merge with existing object
                this.cardUpdatesProcessing.set(update.id, { ...this.cardUpdatesProcessing.get(update.id), ...update })
              } else {
                // Add new object
                this.cardUpdatesProcessing.set(update.id, { ...update })
              }
              if (this.prevCardUpdatesProcessing.has(update.id)) { return }
              const prevCard = cardStore.getCard(update.id)
              this.prevCardUpdatesProcessing.set(prevCard?.id, prevCard)
            })
            this.processAllUpdates()
            break
          case 'createCard':
            this.processCardsCreated([updates])
            break
          case 'removeCards':
            this.processCardsRemoved(updates)
            break
        }
      })
    },

    // box events

    processBoxUpdatesNow () {
      if (!this.boxUpdatesProcessing.size) { return }
      const ignoreKeys = ['id', 'z']
      const patch = []
      this.boxUpdatesProcessing.forEach((update, id) => {
        const keys = Array.from(this.boxUpdateKeysProcessing)
        const everyKeyIsIgnored = keys.every(key => ignoreKeys.includes(key))
        if (everyKeyIsIgnored) { return }
        let prevBox = this.prevBoxUpdatesProcessing.get(id)
        prevBox = utils.objectPickKeys(prevBox, keys)
        const newBox = this.boxUpdatesProcessing.get(id)
        patch.push({
          action: 'boxUpdated',
          prev: prevBox,
          new: newBox
        })
      })
      if (patch.length) {
        this.addPatch(patch)
      }
      this.boxUpdatesProcessing = new Map()
      this.prevBoxUpdatesProcessing = new Map()
      this.boxUpdateKeysProcessing = new Set()
    },
    processBoxCreated (updates) {
      const patch = [{
        action: 'boxCreated',
        new: updates
      }]
      this.addPatch(patch)
    },
    processBoxRemoved (updates) {
      const boxStore = useBoxStore()
      const boxes = updates.map(id => boxStore.getBox(id))
      const patch = boxes.map(box => {
        return {
          action: 'boxRemoved',
          new: box
        }
      })
      this.addPatch(patch)
    },
    subscribeToBoxes () {
      const boxStore = useBoxStore()
      boxStore.$onAction(({ name, args, after, onError }) => {
        if (this.shouldPreventPatchUpdates) { return }
        const updates = args[0]
        switch (name) {
          case 'updateBoxes':
            updates.forEach(update => {
              const keys = Object.keys(update)
              keys.forEach(key => this.boxUpdateKeysProcessing.add(key))
              if (this.boxUpdatesProcessing.has(update.id)) {
                // Merge with existing object
                this.boxUpdatesProcessing.set(update.id, { ...this.boxUpdatesProcessing.get(update.id), ...update })
              } else {
                // Add new object
                this.boxUpdatesProcessing.set(update.id, { ...update })
              }
              if (this.prevBoxUpdatesProcessing.has(update.id)) { return }
              const prevBox = boxStore.getBox(update.id)
              this.prevBoxUpdatesProcessing.set(prevBox.id, prevBox)
            })
            this.processAllUpdates()
            break
          case 'triggerCreateBox':
            this.processBoxCreated(updates)
            break
          case 'removeBoxes':
            this.processBoxRemoved(updates)
            break
        }
      })
    },

    // list events

    processListUpdatesNow () {
      if (!this.listUpdatesProcessing.size) { return }
      const ignoreKeys = ['id', 'z']
      const patch = []
      this.listUpdatesProcessing.forEach((update, id) => {
        const keys = Array.from(this.listUpdateKeysProcessing)
        const everyKeyIsIgnored = keys.every(key => ignoreKeys.includes(key))
        if (everyKeyIsIgnored) { return }
        let prevList = this.prevListUpdatesProcessing.get(id)
        prevList = utils.objectPickKeys(prevList, keys)
        const newList = this.listUpdatesProcessing.get(id)
        patch.push({
          action: 'listUpdated',
          prev: prevList,
          new: newList
        })
      })
      if (patch.length) {
        this.addPatch(patch)
      }
      this.listUpdatesProcessing = new Map()
      this.prevListUpdatesProcessing = new Map()
      this.listUpdateKeysProcessing = new Set()
    },
    processListCreated (updates) {
      const patch = [{
        action: 'listCreated',
        new: updates
      }]
      this.addPatch(patch)
    },
    processListRemoved (updates) {
      const listStore = useListStore()
      const lists = updates.map(id => listStore.getList(id))
      const patch = lists.map(list => {
        return {
          action: 'listRemoved',
          new: list
        }
      })
      this.addPatch(patch)
    },
    subscribeToLists () {
      const listStore = useListStore()
      listStore.$onAction(({ name, args, after, onError }) => {
        if (this.shouldPreventPatchUpdates) { return }
        const updates = args[0]
        switch (name) {
          case 'updateLists':
            updates.forEach(update => {
              const keys = Object.keys(update)
              keys.forEach(key => this.listUpdateKeysProcessing.add(key))
              if (this.listUpdatesProcessing.has(update.id)) {
                // Merge with existing object
                this.listUpdatesProcessing.set(update.id, { ...this.listUpdatesProcessing.get(update.id), ...update })
              } else {
                // Add new object
                this.listUpdatesProcessing.set(update.id, { ...update })
              }
              if (this.prevListUpdatesProcessing.has(update.id)) { return }
              const prevList = listStore.getList(update.id)
              this.prevListUpdatesProcessing.set(prevList.id, prevList)
            })
            this.processAllUpdates()
            break
          case 'triggerCreateList':
            this.processListCreated(updates)
            break
          case 'removeLists':
            this.processListRemoved(updates)
            break
        }
      })
    },

    // connection events

    processConnectionUpdatesNow () {
      if (!this.connectionUpdatesProcessing.size) { return }
      const ignoreKeys = ['id', 'path']
      const patch = []
      this.connectionUpdatesProcessing.forEach((update, id) => {
        const keys = Array.from(this.connectionUpdateKeysProcessing)
        const everyKeyIsIgnored = keys.every(key => ignoreKeys.includes(key))
        if (everyKeyIsIgnored) { return }
        let prevConnection = this.prevConnectionUpdatesProcessing.get(id)
        prevConnection = utils.objectPickKeys(prevConnection, keys)
        const newConnection = this.connectionUpdatesProcessing.get(id)
        patch.push({
          action: 'connectionUpdated',
          prev: prevConnection,
          new: newConnection
        })
      })
      if (patch.length) {
        this.addPatch(patch)
      }
      this.connectionUpdatesProcessing = new Map()
      this.prevConnectionUpdatesProcessing = new Map()
      this.connectionUpdateKeysProcessing = new Set()
    },
    processConnectionCreated (updates) {
      const patch = [{
        action: 'connectionCreated',
        new: updates
      }]
      this.addPatch(patch)
    },
    processConnectionRemoved (updates) {
      const connectionStore = useConnectionStore()
      const connections = updates.map(id => connectionStore.getConnection(id))
      const patch = connections.map(connection => {
        return {
          action: 'connectionRemoved',
          new: connection
        }
      })
      this.addPatch(patch)
    },
    subscribeToConnections () {
      const connectionStore = useConnectionStore()
      connectionStore.$onAction(({ name, args, after, onError }) => {
        if (this.shouldPreventPatchUpdates) { return }
        const updates = args[0]
        switch (name) {
          case 'updateConnections':
            updates.forEach(update => {
              const keys = Object.keys(update)
              keys.forEach(key => this.connectionUpdateKeysProcessing.add(key))
              if (this.connectionUpdatesProcessing.has(update.id)) {
                // Merge with existing object
                this.connectionUpdatesProcessing.set(update.id, { ...this.connectionUpdatesProcessing.get(update.id), ...update })
              } else {
                // Add new object
                this.connectionUpdatesProcessing.set(update.id, { ...update })
              }
              if (this.prevConnectionUpdatesProcessing.has(update.id)) { return }
              const prevConnection = connectionStore.getConnection(update.id)
              this.prevConnectionUpdatesProcessing.set(prevConnection.id, prevConnection)
            })
            this.processAllUpdates()
            break
          case 'createConnection':
            this.processConnectionCreated(updates)
            break
          case 'removeConnections':
            this.processConnectionRemoved(updates)
            break
        }
      })
    },

    // Undo

    async undo () {
      const globalStore = useGlobalStore()
      const cardStore = useCardStore()
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()
      const lineStore = useLineStore()
      const listStore = useListStore()
      if (globalStore.getToolbarIsDrawing) {
        globalStore.triggerDrawingUndo()
        return
      }
      this.shouldPreventPatchUpdates = true
      if (this.pointer === 0) {
        console.info('⏩ undo cancelled, pointer is at start', this.pointer)
        return
      }
      const index = this.pointer - 1
      const patch = this.patches[index]
      for (const item of patch) {
        console.info('⏪ undo', item, { pointer: this.pointer, totalPatches: this.patches.length })
        const { action } = item
        let card, connection, type, box, line, list
        switch (action) {
          // cards
          case 'cardUpdated':
            card = item.prev
            cardStore.updateCard(card)
            await nextTick()
            connectionStore.updateConnectionPathByItemId(card.id)
            break
          case 'cardCreated':
            card = item.new
            cardStore.removeCard(card.id)
            break
          case 'cardRemoved':
            card = item.new
            cardStore.restoreRemovedCard(card)
            break
          // boxes
          case 'boxCreated':
            box = item.new
            boxStore.removeBox(box)
            break
          case 'boxRemoved':
            box = item.new
            boxStore.createBox(box)
            break
          case 'boxUpdated':
            box = item.prev
            boxStore.updateBox(box)
            await nextTick()
            connectionStore.updateConnectionPathByItemId(box.id)
            break
          // connections
          case 'connectionUpdated':
            connection = item.prev
            connectionStore.updateConnection(connection)
            break
          case 'connectionCreated':
            connection = item.new
            connectionStore.removeConnection(connection.id)
            break
          case 'connectionRemoved':
            connection = item.new
            connection.connectionTypeId = connectionStore.getNewConnectionType
            if (!connection.connectionTypeId) {
              connectionStore.createConnectionType()
              connection.connectionTypeId = connectionStore.getNewConnectionType
            }
            connectionStore.createConnection(connection)
            break
          // lines
          case 'lineUpdated':
            line = item.prev
            lineStore.updateLine(line)
            break
          case 'lineCreated':
            line = item.new
            lineStore.removeLine(line.id)
            break
          case 'lineRemoved':
            line = item.new
            lineStore.createLine(line.id)
            break
          // lists
          case 'listUpdated':
            list = item.prev
            listStore.updateList(list)
            break
          case 'listCreated':
            list = item.new
            listStore.removeList(list.id)
            break
          case 'listRemoved':
            list = item.new
            listStore.createList(list.id)
            break
        }
      }
      this.updatePointer({ decrement: true })
      this.shouldPreventPatchUpdates = false
    },

    // Redo

    async redo (patch) {
      const globalStore = useGlobalStore()
      const cardStore = useCardStore()
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()

      if (globalStore.getToolbarIsDrawing) {
        globalStore.triggerDrawingRedo()
        return
      }
      if (!patch) {
        if (this.pointer === this.patches.length) {
          console.info('⏩ redo cancelled, pointer is at end', this.pointer, this.patches.length)
          return
        }
        patch = this.patches[this.pointer]
      }
      this.shouldPreventPatchUpdates = true
      for (const item of patch) {
        console.info('⏩ redo', item, { pointer: this.pointer, totalPatches: this.patches.length })
        const { action } = item
        let card, connection, type, box, prevCard
        switch (action) {
          // cards
          case 'cardUpdated':
            card = item.new
            prevCard = cardStore.getCard(card.id)
            if (prevCard) {
              cardStore.updateCard(card)
            } else {
              cardStore.createCard(card, true)
            }
            await nextTick()
            connectionStore.updateConnectionPathByItemId(card.id)
            break
          case 'cardCreated':
            card = item.new
            prevCard = cardStore.getCard(card.id)
            if (prevCard) {
              cardStore.restoreRemovedCard(card)
            } else {
              cardStore.createCard(card, true)
            }
            break
          case 'cardRemoved':
            card = item.new
            cardStore.removeCard(card)
            break
          // boxes
          case 'boxCreated':
            box = item.new
            boxStore.createBox(box)
            break
          case 'boxRemoved':
            box = item.new
            boxStore.removeBox(box)
            break
          case 'boxUpdated':
            box = item.new
            boxStore.updateBox(box)
            await nextTick()
            connectionStore.updateConnectionPathByItemId(box.id)
            break
          // connections
          case 'connectionUpdated':
            connection = item.new
            connectionStore.updateConnection(connection)
            break
          case 'connectionCreated':
            connection = item.new
            connectionStore.createConnection(connection)
            break
          case 'connectionRemoved':
            connection = item.new
            connectionStore.removeConnection(connection.id)
            break
        }
      }
      this.updatePointer({ increment: true })
      this.shouldPreventPatchUpdates = false
    },

    // Restore local changes over remote space
    // replays patches between the time local space is loaded to when remote space is loaded

    redoLocalUpdates () {
      this.patches.forEach(patch => {
        const actions = ['cardUpdated', 'boxUpdated']
        const isUpdate = actions.includes(patch[0].action)
        this.redo(patch)
      })
    }

  }
})
