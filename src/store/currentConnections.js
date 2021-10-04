// import utils from '@/utils.js'
// import cache from '@/cache.js'

// import debounce from 'lodash-es/debounce'

// normalized state
// https://github.com/vuejs/vuejs.org/issues/1636

export default {
  namespaced: true,
  state: {
    connectionIds: [],
    connections: {}
  },
  mutations: {
    clear: (state) => {
      state.connectionIds = []
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
      state.connectionIds = state.connectionIds.concat(connectionIds)
      // console.log('🍅',state.connections, state.connectionIds)
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
      return state.connectionIds.map(id => state.connections[id])
    }
  }
}
