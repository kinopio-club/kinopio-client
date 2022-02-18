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

let showDebugMessages = true
let snapshots = { cards: {}, connections: {}, connectionTypes: {} }

const normalizeCardUpdates = (card) => {
  const snapshot = snapshots.cards[card.id]
  // createdCard
  if (!snapshot) {
    return {
      action: 'createdCard',
      new: card
    }
  // updatedCard
  } else {
    let keys = Object.keys(card)
    let updatedKeys = keys.filter(key => card[key] !== snapshot[key] && key !== 'nameUpdatedAt')
    if (!updatedKeys.length) { return }
    updatedKeys.unshift('id')
    let prev = {}
    let updates = {}
    updatedKeys.forEach(key => {
      prev[key] = snapshot[key]
      updates[key] = card[key]
    })
    return {
      action: 'updatedCard',
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
    isPaused: false
  },
  mutations: {
    add: (state, patch) => {
      utils.typeCheck({ value: patch, type: 'array', origin: 'history/add' })
      patch = patch.filter(item => Boolean(item))
      if (!patch.length) { return }
      // TODO remove patches above pointer
      // add patch and update pointer
      state.patches.push(patch)
      state.pointer = state.pointer + 1
      // TODO trim the earlier patches once state.patches.length > max (30)
      if (showDebugMessages) {
        console.log('▶️ new patch, patches, pointer', patch, state.patches, state.pointer)
      }
    },
    clear: (state) => {
      state.patches = []
      state.pointer = 0
      snapshots = { cards: {}, connections: {}, connectionTypes: {} }
    },
    isPaused: (state, value) => {
      state.isPaused = value
      console.log('⏸', state.isPaused)
    },
    pointer: (state, { increment, decrement }) => {
      if (increment) {
        state.pointer = state.pointer + 1
        state.pointer = Math.min(state.patches.length, state.pointer)
      } else if (decrement) {
        state.pointer = state.pointer - 1
        state.pointer = Math.max(0, state.pointer)
      }
    }
  },
  actions: {
    snapshots: (context) => {
      const cards = utils.clone(context.rootState.currentCards.cards)
      snapshots.cards = cards
    },
    pause: (context) => {
      context.commit('isPaused', true)
      context.dispatch('snapshots')
    },
    resume: (context) => {
      context.commit('isPaused', false)
    },
    patch: (context, { cards, connections, connectionTypes }) => {
      if (context.state.isPaused) { return }
      let patch = []
      cards = cards.map(card => {
        return normalizeCardUpdates(card)
      })
      patch = patch.concat(cards)
      context.commit('add', patch)
    },
    // Playback
    // ..todo playback methods here..
    undo: (context) => {
      const { isPaused, pointer, patches } = context.state
      if (isPaused) { return }
      const pointerIsMin = pointer === 0
      if (pointerIsMin) { return }
      // TODO apply prev history patch at pointer
      console.log('TODO undo', patches, pointer)
      context.commit(pointer, { decrement: true })
    },
    redo: (context) => {
      const { isPaused, pointer, patches } = context.state
      if (isPaused) { return }
      const pointerIsMax = pointer === patches.length
      if (pointerIsMax) { return }
      context.commit(pointer, { increment: true })
      console.log('TODO redo', patches, pointer)
      // TODO apply new history patch at next context.state.pointer
    }
  }
}

export default self
