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

let showDebugMessages = false
const showLogMessages = true // true

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
    let keys = Object.keys(item)
    const ignoreKeys = ['nameUpdatedAt', 'height', 'width', 'z', 'urlPreviewDescription', 'urlPreviewFavicon', 'urlPreviewImage', 'urlPreviewTitle', 'urlPreviewUrl', 'urlPreviewEmbedHtml', 'shouldUpdateUrlPreview']
    let updatedKeys = keys.filter(key => item[key] !== previous[key] && !ignoreKeys.includes(key))
    if (!updatedKeys.length) { return }
    updatedKeys.unshift('id')
    let prev = {}
    let updates = {}
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
  state: {
    patches: [],
    pointer: 0,
    isPaused: false,
    snapshots: { cards: {}, connections: {}, connectionTypes: {}, boxes: {} }
  },
  mutations: {
    add: (state, patch) => {
      utils.typeCheck({ value: patch, type: 'array', origin: 'history/add' })
      patch = patch.filter(item => Boolean(item))
      if (!patch.length) { return }
      // remove patches above pointer
      state.patches = state.patches.slice(0, state.pointer)
      // add patch to pointer
      state.patches.splice(state.pointer, 0, patch)
      state.pointer = state.pointer + 1
      if (showLogMessages) {
        console.log('⏺ history', { newPatch: patch, pointer: state.pointer })
      }
    },
    // trim: (state) => {
    // TODO trim history from pointer as seperate commit method
    // const max = 30
    // if (state.patches.length > max) {
    //   state.patches.shift()
    //   state.pointer = state.pointer - 1
    // }
    // },
    clear: (state) => {
      state.patches = []
      state.pointer = 0
      state.snapshots = { cards: {}, connections: {}, connectionTypes: {} }
      if (showLogMessages) {
        console.log('⏹ clear history')
      }
    },
    isPaused: (state, value) => {
      state.isPaused = value
      if (showDebugMessages && showLogMessages) {
        console.log('⏸ history is paused', state.isPaused)
      }
    },
    pointer: (state, { increment, decrement, value }) => {
      if (increment) {
        state.pointer = state.pointer + 1
        state.pointer = Math.min(state.patches.length, state.pointer)
      } else if (decrement) {
        state.pointer = state.pointer - 1
        state.pointer = Math.max(0, state.pointer)
      } else if (value) {
        state.pointer = value
      }
    },
    snapshots: (state, object) => {
      state.snapshots = object
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
      if (context.state.isPaused) { return }
      context.commit('isPaused', true)
      context.dispatch('snapshots')
    },
    resume: (context) => {
      context.commit('isPaused', false)
    },

    // Add Patch

    add: (context, { cards, connections, connectionTypes, boxes, useSnapshot, isRemoved }) => {
      if (context.state.isPaused) { return }
      let patch = []
      // cards
      if (cards) {
        cards = cards.map(card => {
          let previous = context.rootGetters['currentCards/byId'](card.id)
          if (useSnapshot) {
            previous = context.state.snapshots['cards'][card.id]
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
            previous = context.state.snapshots['connections'][connection.id]
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
            previous = context.state.snapshots['connectionTypes'][type.id]
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
            previous = context.state.snapshots['boxes'][box.id]
          }
          return normalizeUpdates({ item: box, itemType: 'box', previous, isRemoved })
        })
        patch = patch.concat(boxes)
      }
      context.commit('add', patch)
      // context.commit('trim')
    },

    // Undo

    undo: (context) => {
      let { isPaused, pointer, patches } = context.state
      if (isPaused) { return }
      if (pointer <= 0) {
        context.commit('pointer', { value: 0 })
        return
      }
      const index = pointer - 1
      const patch = patches[index]
      context.commit('isPaused', true)
      patch.forEach(item => {
        console.log('⏪', item, { pointer, totalPatches: patches.length })
        const { action } = item
        let card, connection, type, box
        switch (action) {
          case 'cardUpdated':
            card = item.prev
            context.dispatch('currentCards/update', card, { root: true })
            nextTick(() => {
              context.dispatch('currentCards/resetDimensions', { cardId: card.id }, { root: true })
              context.dispatch('currentConnections/updatePaths', { cardId: card.id }, { root: true })
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
            break
        }
      })
      context.dispatch('resume')
      context.commit('pointer', { decrement: true })
    },

    // Redo

    redo: (context) => {
      const { isPaused, pointer, patches } = context.state
      if (isPaused) { return }
      const pointerIsNewest = pointer === patches.length
      if (pointerIsNewest) { return }
      const patch = patches[pointer]
      context.commit('isPaused', true)
      patch.forEach(item => {
        console.log('⏩', item, { pointer, totalPatches: patches.length })
        const { action } = item
        let card, connection, type, box
        switch (action) {
          case 'cardUpdated':
            card = item.new
            context.dispatch('currentCards/update', card, { root: true })
            nextTick(() => {
              context.dispatch('currentCards/resetDimensions', { cardId: card.id }, { root: true })
              context.dispatch('currentConnections/updatePaths', { cardId: card.id }, { root: true })
            })
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
    }
  }
}

export default self
