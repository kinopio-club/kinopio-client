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

import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useApiStore } from '@/stores/useApiStore'
import { useCardStore } from '@/stores/useCardStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'

const showDebugMessages = false
const showLogMessages = true // true

let prevPatchTime = new Date() // unix timestamp ms

const max = 30
let patches = []
let pointer = 0
let isPaused = false
let snapshots = { cards: {}, connections: {}, connectionTypes: {}, boxes: {} }

const normalizeUpdates = ({ item, itemType, previous, isRemoved }) => {
  // removed
  if (isRemoved) {
    const action = `${itemType}Removed`
    return {
      action,
      new: item
    }
  }
  // created
  if (!previous) {
    const action = `${itemType}Created`
    return {
      action,
      new: item
    }
  // updated
  } else {
    const action = `${itemType}Updated`
    const keys = Object.keys(item)
    const ignoreKeys = ['nameUpdatedAt', 'height', 'width', 'z', 'urlPreviewDescription', 'urlPreviewFavicon', 'urlPreviewImage', 'urlPreviewTitle', 'urlPreviewUrl', 'urlPreviewIframeUrl', 'shouldUpdateUrlPreview']
    const updatedKeys = keys.filter(key => item[key] !== previous[key] && !ignoreKeys.includes(key))
    if (!updatedKeys.length) { return }
    updatedKeys.unshift('id')
    const prev = {}
    const updates = {}
    updatedKeys.forEach(key => {
      prev[key] = previous[key]
      updates[key] = item[key]
    })
    return {
      action,
      prev,
      new: updates
    }
  }
}

export const useHistoryStore = defineStore('history', {
  actions: {

    addPatch (patch) {
      utils.typeCheck({ value: patch, type: 'array', origin: 'history/add' })
      patch = patch.filter(item => Boolean(item))
      if (!patch.length) { return }
      // remove patches above pointer
      patches = patches.slice(0, pointer)
      // add patch to pointer
      patches.splice(pointer, 0, patch)
      pointer = pointer + 1
      if (showLogMessages) {
        console.info('⏺ add history patch', { newPatch: patch, pointer })
      }
    },
    addToPrevPatch (patch) {
      const prevPatch = patches[patches.length - 1]
      const updatedPatch = prevPatch.concat(patch)
      patches[patches.length - 1] = updatedPatch
      console.info('⏺ updated prev history patch', { updatedPatch, pointer })
    },
    trimPatches () {
      if (patches.length > max) {
        patches.shift()
        pointer = pointer - 1
      }
    },
    clearHistory () {
      patches = []
      pointer = 0
      snapshots = { cards: {}, connections: {}, connectionTypes: {} }
      if (showLogMessages) {
        console.info('⏹ clear history')
      }
    },
    updateIsPaused (value) {
      isPaused = value
      if (showDebugMessages && showLogMessages) {
        console.info('⏸ history is paused', isPaused)
      }
    },
    updatePointer ({ increment, decrement, value }) {
      if (increment) {
        pointer = pointer + 1
        pointer = Math.min(patches.length, pointer)
      } else if (decrement) {
        pointer = pointer - 1
        pointer = Math.max(0, pointer)
      } else if (value) {
        pointer = value
      }
    },

    // History System State

    reset () {
      this.clearHistory()
      this.snapshots()
    },
    snapshots () {
      const spaceStore = useSpaceStore()
      const space = spaceStore.getSpaceAllItems
      const { cards, connections, connectionTypes, boxes } = space
      snapshots = { cards, connections, connectionTypes, boxes }
    },
    pause () {
      if (isPaused) { return }
      this.updateIsPaused(true)
      this.snapshots()
    },
    resume () {
      this.updateIsPaused(false)
    },

    // Add Patch

    add ({ cards, connections, connectionTypes, boxes, useSnapshot, isRemoved }) {
      const cardStore = useCardStore()
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()
      if (isPaused) { return }
      const groupTime = 1000
      const time = new Date()
      const timeDelta = time - prevPatchTime
      const shouldAddToPreviousPatch = timeDelta < groupTime
      let patch = []
      // cards
      if (cards) {
        cards = cards.map(card => {
          let previous = cardStore.getCard(card.id)
          if (useSnapshot) {
            previous = snapshots.cards[card.id]
          }
          return normalizeUpdates({ item: card, itemType: 'card', previous, isRemoved })
        })
        patch = patch.concat(cards)
      }
      // connections
      if (connections) {
        connections = connections.map(connection => {
          let previous = connectionStore.getConnection(connection.id)
          if (useSnapshot) {
            previous = snapshots.connections[connection.id]
          }
          return normalizeUpdates({ item: connection, itemType: 'connection', previous, isRemoved })
        })
        patch = patch.concat(connections)
      }
      // connection types
      if (connectionTypes) {
        connectionTypes = connectionTypes.map(type => {
          let previous = connectionStore.getConnectionType(type.id)
          if (useSnapshot) {
            previous = snapshots.connectionTypes[type.id]
          }
          return normalizeUpdates({ item: type, itemType: 'connectionType', previous, isRemoved })
        })
        patch = patch.concat(connectionTypes)
      }
      // boxes
      if (boxes) {
        boxes = boxes.map(box => {
          let previous = boxStore.getBox(box.id)
          if (useSnapshot) {
            previous = snapshots.boxes[box.id]
          }
          return normalizeUpdates({ item: box, itemType: 'box', previous, isRemoved })
        })
        patch = patch.concat(boxes)
      }
      patch = patch.filter(item => Boolean(item))
      if (patches.length && shouldAddToPreviousPatch) {
        this.addToPrevPatch(patch)
      } else {
        this.addPatch(patch)
      }
      this.trimPatches()
      prevPatchTime = time
    },

    // Undo

    undo () {
      const cardStore = useCardStore()
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()
      const toolbarIsDrawing = store.state.currentUserToolbar === 'drawing'
      if (toolbarIsDrawing) {
        store.commit('triggerDrawingUndo', null, { root: true })
        return
      }
      if (isPaused) { return }
      if (pointer <= 0) {
        this.updatePointer({ value: 0 })
        return
      }
      const index = pointer - 1
      const patch = patches[index]
      this.updateIsPaused(true)
      patch.forEach(item => {
        console.info('⏪ undo', item, { pointer, totalPatches: patches.length })
        const { action } = item
        let card, connection, type, box
        switch (action) {
          case 'cardUpdated':
            card = item.prev
            cardStore.updateCard(card)
            nextTick(() => {
              cardStore.resetDimensions({ cardId: card.id })
              connectionStore.updateConnectionPath(card.id)
            })
            break
          case 'cardCreated':
            card = item.new
            cardStore.removeCard(card)
            break
          case 'cardRemoved':
            card = item.new
            cardStore.restoreRemovedCard(card)
            break
          case 'connectionUpdated':
            connection = item.prev
            connectionStore.updateConnection(connection)
            break
          case 'connectionCreated':
            connection = item.new
            connectionStore.removeConnection(connection)
            break
          case 'connectionRemoved':
            connection = utils.clone(item.new)
            connection.connectionTypeId = connectionStore.getNewConnectionType
            if (!connection.connectionTypeId) {
              connectionStore.createConnectionType()
              connection.connectionTypeId = connectionStore.getNewConnectionType
            }
            connectionStore.createConnection(connection)
            break
          case 'connectionTypeUpdated':
            type = item.prev

            connectionStore.updateConnectionType(type)
            break
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
            nextTick(() => {
              connectionStore.updateConnectionPath(box.id)
            })
            break
        }
      })
      this.resume()
      this.updatePointer({ decrement: true })
    },

    // Redo

    redo (patch) {
      const cardStore = useCardStore()
      const connectionStore = useConnectionStore()
      const boxStore = useBoxStore()
      const toolbarIsDrawing = store.state.currentUserToolbar === 'drawing'
      if (toolbarIsDrawing) {
        store.commit('triggerDrawingRedo', null, { root: true })
        return
      }
      if (!patch) {
        if (isPaused) { return }
        const pointerIsNewest = pointer === patches.length
        if (pointerIsNewest) { return }
        patch = patches[pointer]
      }
      this.updateIsPaused(true)
      patch.forEach(item => {
        console.info('⏩ redo', item, { pointer, totalPatches: patches.length })
        const { action } = item
        let card, connection, type, box
        switch (action) {
          case 'cardUpdated':
            card = item.new
            cardStore.updateCard(card)
            // nextTick(() => {
            //   cardStore.resetDimensions({ cardId: card.id })
            //   connectionStore.updateConnectionPath(card.id)
            // })
            break
          case 'cardCreated':
            card = item.new
            cardStore.restoreRemovedCard(card)
            break
          case 'cardRemoved':
            card = item.new
            cardStore.removeCard(card)
            break
          case 'connectionUpdated':
            connection = item.new
            connectionStore.updateConnection(connection)
            break
          case 'connectionCreated':
            connection = utils.clone(item.new)
            connectionStore.createConnection(connection)
            break
          case 'connectionRemoved':
            connection = item.new
            connectionStore.removeConnection(connection)
            break
          case 'connectionTypeUpdated':
            type = item.new
            connectionStore.updateConnectionType(type)
            break
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
            break
        }
      })
      this.resume()
      this.updatePointer({ increment: true })
    },

    // Restore local changes over remote space
    // replays patches between the time local space is loaded to when remote space is loaded

    redoLocalUpdates () {
      patches.forEach(patch => {
        const actions = ['cardUpdated', 'boxUpdated']
        const isUpdate = actions.includes(patch[0].action)
        this.redo(patch)
      })
    }

  }
})
