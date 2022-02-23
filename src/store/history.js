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

let showDebugMessages = false

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
    const ignoreKeys = ['nameUpdatedAt', 'height', 'width', 'z', 'urlPreviewDescription', 'urlPreviewFavicon', 'urlPreviewImage', 'urlPreviewTitle', 'urlPreviewUrl']
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
    snapshots: { cards: {}, connections: {}, connectionTypes: {} }
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
      // TODO
      // trim history
      // const max = 30
      // if (state.patches.length > max) {
      //   state.patches.shift()
      //   state.pointer = state.pointer - 1
      // }
      console.log('⏺ new patch, patches, pointer', patch, state.patches, state.pointer)
      // console.log('⏺ history', { newPatch: patch, patches: state.patches, pointer: state.pointer })
    },
    clear: (state) => {
      state.patches = []
      state.pointer = 0
      state.snapshots = { cards: {}, connections: {}, connectionTypes: {} }
      if (showDebugMessages) {
        console.log('⏹ history cleared')
      }
    },
    isPaused: (state, value) => {
      state.isPaused = value
      if (showDebugMessages) {
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
      context.commit('snapshots', { cards, connections, connectionTypes })
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

    add: (context, { cards, connections, connectionTypes, useSnapshot, isRemoved }) => {
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
      context.commit('add', patch)
    },

    // Undo or Redo Patch

    undo: (context) => {
      let { isPaused, pointer, patches } = context.state
      console.log('⏮ undo patch called', isPaused, pointer, patches)

      if (isPaused) { return }
      if (pointer <= 0) {
        context.commit('pointer', { value: 0 })
        return
      }
      const index = pointer - 1
      const patch = patches[index]

      patch.forEach(item => {
        // console.log('⏮', item)
        console.log('⏮', item.action, item.new, item.prev)
        const { action } = item
        if (action === 'cardUpdated') {
          context.commit('isPaused', true)
          context.dispatch('currentCards/update', item.prev, { root: true })
          context.dispatch('currentCards/updateDimensionsAndMap', item.prev.id, { root: true })
          context.dispatch('currentConnections/updatePaths', { cardId: item.prev.id }, { root: true })
          context.commit('triggerUpdateCardOverlaps', null, { root: true })
          context.dispatch('resume')
        }
        // else if () {}
      })
      // TODO if card isRemoved then look for the card in currentCards.removedCards []
      context.commit('pointer', { decrement: true })
    },
    redo: (context) => {
      const { isPaused, pointer, patches } = context.state
      if (isPaused) { return }
      const pointerIsMax = pointer === patches.length
      if (pointerIsMax) { return }
      // context.commit('pointer', { increment: true })
      console.log('⏭ Redo', patches, pointer)
      // TODO apply new history patch at next context.state.pointer
    }
  }
}

export default self
