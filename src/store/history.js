// adapted from https://twitter.com/steveruizok/status/1487052071685734410

// import utils from '@/utils.js'

let cardsSnapshot = {}

const self = {
  namespaced: true,
  state: {
    patches: [],
    pointer: 0,
    isPaused: false
  },
  mutations: {
    add: (state, patch) => {
      state.patches.push(patch)
      state.pointer = state.pointer + 1
    },
    clear: (state) => {
      state.patches = []
      state.pointer = 0
      cardsSnapshot = {}
    },
    isPaused: (state, value) => {
      state.isPaused = value
    }
  },
  actions: {
    moveCards: (context, cards) => {
      console.log('🐸', cards, cardsSnapshot)
      // Each time the document changes, we generate a "snapshot" and compare it with our previous snapshot in order to create a "patch" that describes how to get from the current snapshot back to the previous.
      // generate a http://jsonpatch.com

      // [
      //   { "op": "replace", "path": "/baz", "value": "boo" },
      //   { "op": "add", "path": "/hello", "value": ["world"] },
      //   { "op": "remove", "path": "/foo" }
      // ]

      // the patch describes all the steps to restore the previous version/snapshot

      // context.commit('add', patch)
    },
    undo: (context) => {
      const { isPaused, pointer, patches } = context.state
      if (isPaused) { return }
      if (pointer === 0) { return }
      console.log(patches)
      // take history patch before pointer
      // move pointer back one
    },
    redo: (context) => {
      const { isPaused, pointer, patches } = context.state
      if (isPaused) { return }
      if (pointer === patches.length) { }
      // move pointer
    },
    pause: (context) => {
      context.commit('isPaused', true)
      const cards = context.rootState.currentCards.cards
      cardsSnapshot = cards
    },
    resume: (context) => {
      context.commit('isPaused', false)
      console.log(cardsSnapshot)
    }
  }
}

export default self
