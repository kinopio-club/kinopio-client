import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// todo? seperate files into modules (w `export defaults and imports` instead of const)

const currentUser = {
  namespaced: true,
  state: {
    id: 1,
    color: 'cyan'
  },
  getters: {
    isMember (state, getters, rootState) {
      const inCurrentSpace = rootState.currentSpace.users.some(user => {
        return user.id === state.id
      })
      if (inCurrentSpace) {
        return true
      } else { return false }
    }
  }
  // actions: {
  // get users in a space from api
  // },
}

const currentSpace = {
  namespaced: true,
  state: {
    users: [
      {
        id: 1,
        color: 'cyan'
      },
      {
        id: 2,
        color: 'pink'
      }
    ],
    cards: [
      {
        id: 1,
        x: 80,
        y: 80,
        name: 'hello space and time'
      },
      {
        id: 2,
        x: 250,
        y: 250,
        name: 'connect me!'
      }
    ],
    connections: [
      // {
      //   id: 1,
      //   connectionType: 1,
      //   startCard: 1,
      //   endCard: 2
      // }
    ],
    connectionTypes: [
      {
        id: 1,
        name: 'connection 1'
      }
    ]
  },
  mutations: {
    addConnection: (state, connection) => {
      connection.id = 123 // temp
      connection.connectionType = 1 // temp
      state.connections.push(connection)
      console.log(state.connections)
    }
  }
}

const broadcast = {
  namespaced: true,
  state: {
    isBroadcasting: false
  },
  actions: {
    painting (context, circle) {
      // console.log('broadcast painting', circle)
    },
    connectingPaths (context, connectionPath) {
      // console.log('broadcast drawing connection path', connectionPath)
    }
  }
}

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {
    // user state
    currentUserIsDrawingConnection: false,
    currentUserIsPainting: false,
    // currentUserIsDraggingCard: false,

    // drawing connections
    currentConnectionOrigin: {},
    currentConnectionPath: '',
    currentConnection: {},

    // app state
    viewportIsLocked: false
  },
  mutations: {
    currentUserIsDrawingConnection: (state, value) => {
      state.currentUserIsDrawingConnection = value
    },
    currentUserIsPainting: (state, value) => {
      state.currentUserIsPainting = value
    },
    currentConnectionOrigin: (state, value) => {
      state.currentConnectionOrigin = value
    },
    currentConnectionPath: (state, value) => {
      state.currentConnectionPath = value
    },
    viewportIsLocked: (state, value) => {
      state.viewportIsLocked = value
    },
    currentConnection: (state, value) => {
      state.currentConnection = value
    }

  },
  modules: {
    currentUser,
    currentSpace,
    broadcast
  }
})
