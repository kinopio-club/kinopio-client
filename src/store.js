import Vue from 'vue'
import Vuex from 'vuex'
import utils from '@/utils.js'
import randomcolor from 'randomcolor'
// import nanoid from 'nanoid'

Vue.use(Vuex)

const currentUser = {
  namespaced: true,
  state: {
    id: 1,
    color: randomcolor({ luminosity: 'light' })
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
        z: 0,
        name: 'hello space and time'
      },
      {
        id: '2',
        x: 20,
        y: 250,
        z: 1,
        name: 'connect me!'
      },
      {
        id: '3',
        x: 500,
        y: 150,
        z: 2,
        name: 'click and drag me'
      },
      {
        id: '4',
        x: 600,
        y: 500,
        z: 3,
        name: 'eat your vegetables'
      },
      {
        id: '5',
        x: 280,
        y: 280,
        z: 4,
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
    moveBlock: (state, { blockId, delta }) => {
      const maxOffset = 0
      state.blocks.map(block => {
        if (block.id === blockId) {
          block.x += delta.x || 0
          block.y += delta.y || 0
          block.x = Math.max(block.x, maxOffset)
          block.y = Math.max(block.y, maxOffset)
          // console.log(block.x, block.y, delta.x, delta.y)
        }
      })
      const connections = state.connections.filter(connection => {
        return (connection.startBlockId === blockId || connection.endBlockId === blockId)
      })
      connections.forEach(connection => {
        connection.path = utils.connectionBetweenBlocks(connection.startBlockId, connection.endBlockId)
      })
    },
    incrementBlockZ (state, blockId) {
      state.blocks.map((block, index) => {
        block.z = index
        if (block.id === blockId) {
          block.z = state.blocks.length + 1
        }
      })
    }
  },
  actions: {
    dragBlock: (rootState, endPosition) => {
      const block = rootState.rootState.currentDraggingBlock
      const blockId = block.id
      const deltaX = endPosition.x - block.x
      const deltaY = endPosition.y - block.y
      const delta = { x: deltaX, y: deltaY }
      rootState.commit('moveBlock', { blockId, delta })
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
    // currentConnectionStart: undefined,
    currentConnectionEnd: undefined,

    currentConnectionPath: undefined,

    currentConnection: {}, // startId, x, y, endId // startBlockId,, endBlockId
    // start:
    // blockId,
    // x
    // y
    // end
    // blockId

    // dragging
    currentDraggingBlock: {}, // id, x, y
    preventDraggedBlockFromOpeningAfterDrag: false
  },
  mutations: {
    currentUserIsDrawingConnection: (state, value) => {
      state.currentUserIsDrawingConnection = value
    },
    currentUserIsInking: (state, value) => {
      state.currentUserIsInking = value
    },

    // currentConnectionStart: (state, value) => {
    //   state.currentConnectionStart = value
    // },
    currentConnectionEnd: (state, value) => {
      state.currentConnectionEnd = value
    },
    currentConnectionPath: (state, value) => {
      state.currentConnectionPath = value
    },

    currentUserIsDraggingBlock: (state, value) => {
      state.currentUserIsDraggingBlock = value
    },
    preventDraggedBlockFromOpeningAfterDrag: (state, value) => {
      state.preventDraggedBlockFromOpeningAfterDrag = value
    },
    currentUserIsInkingLocked: (state, value) => {
      state.currentUserIsInkingLocked = value
    },
    currentDraggingBlock: (state, value) => {
      utils.typeCheck(value, 'object')
      const keys = Object.keys(value)
      keys.forEach(key => {
        state.currentDraggingBlock[key] = value[key]
      })
    },
    currentConnection: (state, value) => {
      utils.typeCheck(value, 'object')
      const keys = Object.keys(value)
      keys.forEach(key => {
        state.currentConnection[key] = value[key]
      })
    }

  },
  modules: {
    currentUser,
    currentSpace,
    broadcast
  }
})
