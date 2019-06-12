import Vue from 'vue'
import Vuex from 'vuex'
import utils from '@/utils.js'
import randomcolor from 'randomcolor'
import nanoid from 'nanoid'

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
        name: 'hello space and time',
        blockDetailsVisible: false,
        archived: false
      },
      {
        id: '2',
        x: 20,
        y: 250,
        z: 1,
        name: 'connect me!',
        blockDetailsVisible: false,
        archived: false
      },
      {
        id: '3',
        x: 500,
        y: 150,
        z: 2,
        name: 'click and drag me',
        blockDetailsVisible: false,
        archived: false
      },
      {
        id: '4',
        x: 600,
        y: 500,
        z: 3,
        name: 'eat your vegetables',
        blockDetailsVisible: false,
        archived: false
      },
      {
        id: '5',
        x: 280,
        y: 280,
        z: 4,
        name: 'go to summer bbq',
        blockDetailsVisible: false,
        archived: false
      }
    ],
    connections: [
      // {
      //   id: '1',
      //   connectionType: '1',
      //   startBlockId: '1',
      //   endBlockId: '2',
      //   path: ''
      //   connectionDetailsVisible: false,
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
      connection.id = nanoid()
      // connection.connectionTypeId = '1' // temp hardcoded
      connection.connectionDetailsVisible = false
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
    },
    blockDetailsVisible: (state, blockId) => {
      state.blocks.map(block => {
        if (block.id === blockId) {
          block.blockDetailsVisible = true
        }
      })
    },
    updateBlockDetails: (state, { type, value, blockId }) => {
      utils.typeCheck(type, 'string')
      state.blocks.map(block => {
        if (block.id === blockId) {
          block[type] = value
        }
      })
    },
    connectionDetailsVisible: (state, connectionId) => {
      state.connections.map(connection => {
        if (connection.id === connectionId) {
          connection.connectionDetailsVisible = true
        }
      })
    }
    // updateConnectionDetails: (state, { type, value, connectionId }) => {
    //   utils.typeCheck(type, 'string')
    //   state.connections.map(connection => {
    //     if (connection.id === connectionId) {
    //       console.log('old',connection[type], 'new', value)
    //       connection[type] = value
    //     }
    //   })
    //   console.log('🦚', state.connections)
    // },

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

    // connecting
    currentConnection: {}, // startBlockId, startConnectorRect
    currentConnectionSuccess: {},
    connectionDetailsIsVisible: false,

    // dragging
    currentDraggingBlock: {}, // id, x, y
    preventDraggedBlockFromOpeningAfterDrag: false
  },
  mutations: {
    currentUserIsDrawingConnection: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.currentUserIsDrawingConnection = value
    },
    currentUserIsInking: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.currentUserIsInking = value
    },
    currentUserIsDraggingBlock: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.currentUserIsDraggingBlock = value
    },
    preventDraggedBlockFromOpeningAfterDrag: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.preventDraggedBlockFromOpeningAfterDrag = value
    },
    currentUserIsInkingLocked: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.currentUserIsInkingLocked = value
    },
    currentConnectionSuccess: (state, value) => {
      const allowUndefined = true
      utils.typeCheck(value, 'object', allowUndefined)
      state.currentConnectionSuccess = value
    },
    connectionDetailsIsVisible: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.connectionDetailsIsVisible = value
    },
    currentDraggingBlock: (state, value) => {
      let object = state.currentConnection
      object = utils.updateObject(object, value)
      state.currentDraggingBlock = object
    },
    currentConnection: (state, value) => {
      let object = state.currentConnection
      object = utils.updateObject(object, value)
      state.currentConnection = object
    },
    closeAllPopOvers: (state) => {
      state.currentSpace.blocks.map(block => {
        block.blockDetailsVisible = false
      })
      state.currentSpace.connections.map(connection => {
        connection.connectionDetailsVisible = false
      })
    }
  },
  modules: {
    currentUser,
    currentSpace,
    broadcast
  }
})
