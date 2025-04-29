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

import utils from '@/utils.js'
import { nextTick } from 'vue'

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

const self = {
  namespaced: true,
  mutations: {
    add: (state, patch) => {
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
    addToPrevPatch: (state, patch) => {
      const prevPatch = patches[patches.length - 1]
      const updatedPatch = prevPatch.concat(patch)
      patches[patches.length - 1] = updatedPatch
      console.info('⏺ updated prev history patch', { updatedPatch, pointer })
    },
    trim: (state) => {
      if (patches.length > max) {
        patches.shift()
        pointer = pointer - 1
      }
    },
    clear: (state) => {
      patches = []
      pointer = 0
      snapshots = { cards: {}, connections: {}, connectionTypes: {} }
      if (showLogMessages) {
        console.info('⏹ clear history')
      }
    },
    isPaused: (state, value) => {
      isPaused = value
      if (showDebugMessages && showLogMessages) {
        console.info('⏸ history is paused', isPaused)
      }
    },
    pointer: (state, { increment, decrement, value }) => {
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
    snapshots: (state, object) => {
      snapshots = object
    }
  },
  actions: {

    // History System State

    reset: (context) => {
      context.commit('clear')
      context.dispatch('snapshots')
    },
    snapshots: (context) => {
      const cards = utils.clone(context.rootState.currentCards.cards)
      const connections = utils.clone(context.rootState.currentConnections.connections)
      const connectionTypes = utils.clone(context.rootState.currentConnections.types)
      const boxes = utils.clone(context.rootState.currentBoxes.boxes)
      context.commit('snapshots', { cards, connections, connectionTypes, boxes })
    },
    pause: (context) => {
      if (isPaused) { return }
      context.commit('isPaused', true)
      context.dispatch('snapshots')
    },
    resume: (context) => {
      context.commit('isPaused', false)
    },

    // Add Patch

    add: (context, { cards, connections, connectionTypes, boxes, useSnapshot, isRemoved }) => {
      if (isPaused) { return }
      const groupTime = 1000
      const time = new Date()
      const timeDelta = time - prevPatchTime
      const shouldAddToPreviousPatch = timeDelta < groupTime
      let patch = []
      // cards
      if (cards) {
        cards = cards.map(card => {
          let previous = context.rootGetters['currentCards/byId'](card.id)
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
          let previous = context.rootGetters['currentConnections/byId'](connection.id)
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
          let previous = context.rootGetters['currentConnections/typeByTypeId'](type.id)
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
          let previous = context.rootGetters['currentBoxes/byId'](box.id)
          if (useSnapshot) {
            previous = snapshots.boxes[box.id]
          }
          return normalizeUpdates({ item: box, itemType: 'box', previous, isRemoved })
        })
        patch = patch.concat(boxes)
      }
      patch = patch.filter(item => Boolean(item))
      if (patches.length && shouldAddToPreviousPatch) {
        context.commit('addToPrevPatch', patch)
      } else {
        context.commit('add', patch)
      }
      context.commit('trim')
      prevPatchTime = time
    },

    // Undo

    undo: (context) => {
      const toolbarIsDrawing = context.rootState.currentUserToolbar === 'drawing'
      if (toolbarIsDrawing) {
        context.commit('triggerDrawingUndo', null, { root: true })
        return
      }
      if (isPaused) { return }
      if (pointer <= 0) {
        context.commit('pointer', { value: 0 })
        return
      }
      const index = pointer - 1
      const patch = patches[index]
      context.commit('isPaused', true)
      patch.forEach(item => {
        console.info('⏪ undo', item, { pointer, totalPatches: patches.length })
        const { action } = item
        let card, connection, type, box
        switch (action) {
          case 'cardUpdated':
            card = item.prev
            context.dispatch('currentCards/update', { card }, { root: true })
            nextTick(() => {
              context.dispatch('currentCards/resetDimensions', { cardId: card.id }, { root: true })
              context.dispatch('currentConnections/updatePaths', { itemId: card.id }, { root: true })
            })
            break
          case 'cardCreated':
            card = item.new
            context.dispatch('currentCards/remove', card, { root: true })
            break
          case 'cardRemoved':
            card = item.new
            context.dispatch('currentCards/restoreRemoved', card, { root: true })
            break
          case 'connectionUpdated':
            connection = item.prev
            context.dispatch('currentConnections/update', connection, { root: true })
            break
          case 'connectionCreated':
            connection = item.new
            context.dispatch('currentConnections/remove', connection, { root: true })
            break
          case 'connectionRemoved':
            connection = utils.clone(item.new)
            connection.connectionTypeId = context.rootGetters['currentConnections/typeOrTypeForNewConnections'](connection.connectionTypeId)
            if (!connection.connectionTypeId) {
              context.dispatch('currentConnections/addType', null, { root: true })
              connection.connectionTypeId = context.rootGetters['currentConnections/typeForNewConnections']
            }
            context.dispatch('currentConnections/add', { connection }, { root: true })
            break
          case 'connectionTypeUpdated':
            type = item.prev
            context.dispatch('currentConnections/updateType', type, { root: true })
            break
          case 'boxCreated':
            box = item.new
            context.dispatch('currentBoxes/remove', box, { root: true })
            break
          case 'boxRemoved':
            box = item.new
            context.dispatch('currentBoxes/add', { box }, { root: true })
            break
          case 'boxUpdated':
            box = item.prev
            context.dispatch('currentBoxes/update', box, { root: true })
            nextTick(() => {
              context.dispatch('currentConnections/updatePaths', { itemId: box.id }, { root: true })
            })
            break
        }
      })
      context.dispatch('resume')
      context.commit('pointer', { decrement: true })
    },

    // Redo

    redo: (context, patch) => {
      const toolbarIsDrawing = context.rootState.currentUserToolbar === 'drawing'
      if (toolbarIsDrawing) {
        context.commit('triggerDrawingRedo', null, { root: true })
        return
      }
      if (!patch) {
        if (isPaused) { return }
        const pointerIsNewest = pointer === patches.length
        if (pointerIsNewest) { return }
        patch = patches[pointer]
      }
      context.commit('isPaused', true)
      patch.forEach(item => {
        console.info('⏩ redo', item, { pointer, totalPatches: patches.length })
        const { action } = item
        let card, connection, type, box
        switch (action) {
          case 'cardUpdated':
            card = item.new
            context.dispatch('currentCards/update', { card }, { root: true })
            // nextTick(() => {
            //   context.dispatch('currentCards/resetDimensions', { cardId: card.id }, { root: true })
            //   context.dispatch('currentConnections/updatePaths', { itemId: card.id }, { root: true })
            // })
            break
          case 'cardCreated':
            card = item.new
            context.dispatch('currentCards/restoreRemoved', card, { root: true })
            break
          case 'cardRemoved':
            card = item.new
            context.dispatch('currentCards/remove', card, { root: true })
            break
          case 'connectionUpdated':
            connection = item.new
            context.dispatch('currentConnections/update', connection, { root: true })
            break
          case 'connectionCreated':
            connection = utils.clone(item.new)
            context.dispatch('currentConnections/add', { connection }, { root: true })
            break
          case 'connectionRemoved':
            connection = item.new
            context.dispatch('currentConnections/remove', connection, { root: true })
            break
          case 'connectionTypeUpdated':
            type = item.new
            context.dispatch('currentConnections/updateType', type, { root: true })
            break
          case 'boxCreated':
            box = item.new
            context.dispatch('currentBoxes/add', { box }, { root: true })
            break
          case 'boxRemoved':
            box = item.new
            context.dispatch('currentBoxes/remove', box, { root: true })
            break
          case 'boxUpdated':
            box = item.new
            context.dispatch('currentBoxes/update', box, { root: true })
            break
        }
      })
      context.dispatch('resume')
      context.commit('pointer', { increment: true })
    },

    // Restore local changes over remote space
    // replays patches between the time local space is loaded to when remote space is loaded

    redoLocalUpdates: (context) => {
      patches.forEach(patch => {
        const actions = ['cardUpdated', 'boxUpdated']
        const isUpdate = actions.includes(patch[0].action)
        context.dispatch('redo', patch)
      })
    }
  }
}

export default self
