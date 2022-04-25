// import debounce from 'lodash-es/debounce'

// import utils from '@/utils.js'

// const updateErrorMessage = '🚑 could not updateSpace cache because cachedSpace does not exist (ignore if space is read-only or open)'
// let showDebugMessages = false

export default {
  namespaced: true,
  // state: {
  //   ids: [],
  //   connections: {},
  //   typeIds: [],
  //   types: {}
  // },
  mutations: {
    // clear: (state) => {
    //   state.ids = []
    //   state.connections = {}
    //   state.typeIds = []
    //   state.types = {}
    // },
  },
  actions: {

    // updateSpaceId: (context, spaceId) => {
    //   currentSpaceId = spaceId
    // },

  },
  getters: {
    space: (state, getters) => (spaceId) => {
      return getters.getLocal(`space-${spaceId}`) || {}
    },
    getLocal: (state) => (key) => {
      try {
        return JSON.parse(window.localStorage[key])
      } catch (error) {}
    }
    // all: (state) => {
    //   return state.ids.map(id => state.connections[id])
    // },
    // byId: (state, getters, rootState, rootGetters) => (id) => {
    //   let type = state.types[id]
    //   return type
    // },
  }
}
