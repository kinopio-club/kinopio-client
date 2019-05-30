import Vue from 'vue'
import Vuex from 'vuex'
import utils from '@/utils.js'

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
      },
      {
        id: 3,
        x: 400,
        y: 150,
        name: 'click and drag me'
      }
    ],
    connections: [
      // {
      //   id: 1,
      //   connectionType: 1,
      //   startCardId: 1,
      //   endCardId: 2,
      //   path: ''
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
      connection.id = 123 // temp hardcoded, nanoid
      connection.connectionTypeId = 1 // temp hardcoded
      state.connections.push(connection)
    },
    updateCardPosition: (state, { cardId, delta }) => {
      state.cards.map(card => {
        if (card.id === cardId) {
          card.x += delta.x
          card.y += delta.y
        }
      })
      const connections = state.connections.filter(connection => {
        return (connection.startCardId === cardId || connection.endCardId === cardId)
      })
      connections.forEach(connection => {
        connection.path = utils.connectionBetweenCards(connection.startCardId, connection.endCardId)
      })
    }
  },
  actions: {
    dragCard: (rootState, endPosition) => {
      const startPosition = rootState.rootState.currentDragCardStartPosition
      const cardId = rootState.rootState.currentDraggingCardId
      const deltaX = endPosition.x - startPosition.x
      const deltaY = endPosition.y - startPosition.y
      const delta = { x: deltaX, y: deltaY }
      rootState.commit('updateCardPosition', { cardId, delta })
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
    },
    addConnection (context, connection) {
      // console.log('broadcast add connection', connection)
    }
  }
}

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {
    // user state
    currentUserIsDrawingConnection: false,
    currentUserIsPainting: false,
    currentUserIsDraggingCard: false,

    // drawing connections
    currentConnectionStart: {},
    currentConnectionPath: '',
    currentConnection: {},

    // dragging card
    currentDraggingCardId: '',
    currentDragCardStartPosition: {},
    preventDraggedCardFromClicking: false,

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
    currentConnectionStart: (state, value) => {
      state.currentConnectionStart = value
    },
    currentConnectionPath: (state, value) => {
      state.currentConnectionPath = value
    },
    viewportIsLocked: (state, value) => {
      state.viewportIsLocked = value
    },
    currentConnection: (state, value) => {
      state.currentConnection = value
    },
    currentUserIsDraggingCard: (state, value) => {
      state.currentUserIsDraggingCard = value
    },
    currentDraggingCardId: (state, value) => {
      state.currentDraggingCardId = value
    },
    currentDragCardStartPosition: (state, value) => {
      state.currentDragCardStartPosition = value
    },
    preventDraggedCardFromClicking: (state, value) => {
      state.preventDraggedCardFromClicking = value
    }
  },
  modules: {
    currentUser,
    currentSpace,
    broadcast
  }
})
