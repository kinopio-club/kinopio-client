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
        id: '1',
        color: 'cyan'
      },
      {
        id: '2',
        color: 'pink'
      }
    ],
    blocks: [
      {
        id: '1',
        x: 80,
        y: 80,
        name: 'hello space and time'
      },
      {
        id: '2',
        x: 20,
        y: 250,
        name: 'connect me!'
      },
      {
        id: '3',
        x: 500,
        y: 150,
        name: 'click and drag me'
      },
      {
        id: '4',
        x: 600,
        y: 500,
        name: 'eat your vegetables'
      },
      {
        id: '5',
        x: 280,
        y: 280,
        name: 'go to summer bbq'
      }
    ],
    connections: [
      // {
      //   id: '1',
      //   connectionType: '1',
      //   startBlockId: '1',
      //   endBlockId: '2',
      //   path: ''
      // }
    ],
    connectionTypes: [
      {
        id: '1',
        name: 'connection 1'
      }
    ]
  },
  mutations: {
    addConnection: (state, connection) => {
      connection.id = '123' // temp hardcoded, nanoid
      connection.connectionTypeId = '1' // temp hardcoded
      state.connections.push(connection)
    },
    updateBlockPosition: (state, { blockId, delta }) => {
      state.blocks.map(block => {
        if (block.id === blockId) {
          block.x += delta.x
          block.y += delta.y
        }
      })
      const connections = state.connections.filter(connection => {
        return (connection.startBlockId === blockId || connection.endBlockId === blockId)
      })
      connections.forEach(connection => {
        connection.path = utils.connectionBetweenBlocks(connection.startBlockId, connection.endBlockId)
      })
    }
  },
  actions: {
    dragBlock: (rootState, endPosition) => {
      const startPosition = rootState.rootState.currentDragBlockStartPosition
      const blockId = rootState.rootState.currentDraggingBlockId
      const deltaX = endPosition.x - startPosition.x
      const deltaY = endPosition.y - startPosition.y
      const delta = { x: deltaX, y: deltaY }
      rootState.commit('updateBlockPosition', { blockId, delta })
    }
  }
}

const broadcast = {
  namespaced: true,
  state: {
    isBroadcasting: false
  },
  actions: {
    inking (context, circle) {
      // console.log('broadcast inking', circle)
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
    // current user state
    currentUserIsDrawingConnection: false,
    currentUserIsInking: false,
    currentUserIsInkingLocked: false,
    currentUserIsDraggingBlock: false,

    // current connection
    currentConnectionStart: undefined, // {} // redundant? if use a setter to update the currentConnectionObject
    currentConnectionPath: undefined, // '' // redundant
    currentConnection: undefined, // {}

    // dragging block
    currentDraggingBlockId: undefined, // ''
    currentDragBlockStartPosition: undefined, // {}
    preventDraggedBlockFromClicking: false
  },
  mutations: {
    currentUserIsDrawingConnection: (state, value) => {
      state.currentUserIsDrawingConnection = value
    },
    currentUserIsInking: (state, value) => {
      state.currentUserIsInking = value
    },
    currentConnectionStart: (state, value) => {
      state.currentConnectionStart = value
    },
    currentConnectionPath: (state, value) => {
      state.currentConnectionPath = value
    },
    currentConnection: (state, value) => {
      state.currentConnection = value
    },
    currentUserIsDraggingBlock: (state, value) => {
      state.currentUserIsDraggingBlock = value
    },
    currentDraggingBlockId: (state, value) => {
      state.currentDraggingBlockId = value
    },
    currentDragBlockStartPosition: (state, value) => {
      state.currentDragBlockStartPosition = value
    },
    preventDraggedBlockFromClicking: (state, value) => {
      state.preventDraggedBlockFromClicking = value
    },
    currentUserIsInkingLocked: (state, value) => {
      state.currentUserIsInkingLocked = value
    }
  },
  modules: {
    currentUser,
    currentSpace,
    broadcast
  }
})
