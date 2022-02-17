// adapted from https://twitter.com/steveruizok/status/1487052071685734410

// import utils from '@/utils.js'

let pausedCurrentCards = {}

const self = {
  namespaced: true,
  state: {
    items: [],
    pointer: 0,
    isPaused: false
  },
  mutations: {
    add: (state, item) => {
      state.items.push(item)
      state.pointer = state.items.length
    },
    clear: (state) => {
      state.items = []
      state.pointer = 0
      pausedCurrentCards = {}
    },
    isPaused: (state, value) => {
      state.isPaused = value
    }
  },
  actions: {
    add: (context, item) => {
      console.log('🐸', item)
      // context.commit('add', item)
    },
    undo: (context) => {
      const { isPaused, pointer, items } = context.state
      if (isPaused) { return }
      if (pointer === 0) { return }
      console.log(items)
      // take history item before pointer
      // move pointer back one
    },
    redo: (context) => {
      const { isPaused, pointer, items } = context.state
      if (isPaused) { return }
      if (pointer === items.length) { }
      // move pointer
    },
    pause: (context) => {
      context.commit('isPaused', true)
      const cards = context.rootState.currentCards.cards
      pausedCurrentCards = cards
    },
    resume: (context) => {
      context.commit('isPaused', false)
      console.log(pausedCurrentCards)
    }
  }
}

export default self
