// adapted from https://twitter.com/steveruizok/status/1487052071685734410

// each `patch` contains `new` and `prev` updates
// the current position in history is a patch index `pointer`
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

let cardsSnapshot = {}
let showDebugMessages = true

// const cardUpdate = (card) => {
// return {
//   action: 'updatedCard',
//   prev,
//   new: updates
// }
// }

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
      cardsSnapshot = {}
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
    // Recording

    pause: (context) => {
      context.commit('isPaused', true)
      const cards = utils.clone(context.rootState.currentCards.cards)
      cardsSnapshot = cards
    },
    resume: (context) => {
      context.commit('isPaused', false)
    },

    // Patching

    patch: (context, { cards, connections, connectionTypes }) => {
      if (context.state.isPaused) { return }
      let patch = cards.map(card => {
        // TODO return cardUpdate(card)
        const snapshot = cardsSnapshot[card.id]
        // + create patch
        if (!snapshot) {
          return {
            action: 'createdCard',
            new: card
          }
        }
        // + update patch
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
      })
      context.commit('add', patch)
    },

    // Playback

    // ..todo playback methods here..

    // Undo and Redo

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
