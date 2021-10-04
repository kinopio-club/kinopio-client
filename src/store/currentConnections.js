// import utils from '@/utils.js'
// import cache from '@/cache.js'

// import debounce from 'lodash-es/debounce'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

export default {
  namespaced: true,
  state: {
    ids: [],
    connections: {}
  },
  mutations: {
    clear: (state) => {
      state.ids = []
      state.connections = {}
    },
    update: (state, connection) => {
      const keys = Object.keys(connection)
      keys.forEach(key => {
        state.connections[connection.id] = connection[key]
      })
      // debounce ls?
    },
    restore: (state, connections) => {
      let connectionIds = []
      connections.forEach(connection => {
        connectionIds.push(connection.id)
        state.connections[connection.id] = connection
      })
      state.ids = state.ids.concat(connectionIds)
      console.log('🍅', state.connections, state.ids)
    }

    // add: (state, item) => {
    //   utils.typeCheck({ value: item, type: 'object', origin: 'history add' })
    //   items.push(item)
    // },
  },
  actions: {
    // drag: (context, { xyz }) => {
    // }
  },
  getters: {
    byId: (state) => (id) => {
      console.log(id)
      return state.connections[id]
    },
    all: (state) => {
      return state.ids.map(id => state.connections[id])
    }
  }
}
