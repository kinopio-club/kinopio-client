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
        x: 1600,
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
      // connection.connectionTypeId = '1' // TODO: create new connections each time or use last def on user prefs
      connection.connectionDetailsVisible = false
      state.connections.push(connection)
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
    },

    moveBlock: (state, { blockId, delta }) => {
      const maxOffset = 0
      state.blocks.map(block => {
        if (block.id === blockId) {
          block.x += delta.x || 0
          block.y += delta.y || 0
          block.x = Math.max(block.x, maxOffset)
          block.y = Math.max(block.y, maxOffset)
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
    dragBlocks: (context, { endCursor, prevCursor, delta }) => {
      const multipleBlocksSelected = context.rootState.multipleBlocksSelected
      const currentDraggingBlockId = context.rootState.currentDraggingBlockId
      const blocks = context.rootState.currentSpace.blocks
      if (!delta) {
        delta = {
          x: endCursor.x - prevCursor.x,
          y: endCursor.y - prevCursor.y
        }
      }
      if (multipleBlocksSelected.length) {
        blocks.map(block => {
          if (multipleBlocksSelected.includes(block.id)) {
            context.commit('moveBlock', { blockId: block.id, delta })
          }
        })
      } else {
        context.commit('moveBlock', { blockId: currentDraggingBlockId, delta })
      }
    },
    incrementSelectedBlocksZ: (context) => {
      const multipleBlocksSelected = context.rootState.multipleBlocksSelected
      const currentDraggingBlockId = context.rootState.currentDraggingBlockId
      const blocks = context.state.blocks
      if (multipleBlocksSelected.length) {
        blocks.forEach(blockId => {
          context.commit('incrementBlockZ', blockId)
        })
      } else {
        context.commit('incrementBlockZ', currentDraggingBlockId)
      }
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
    currentConnectionCursorStart: {},
    connectionDetailsIsVisible: false,
    connectionDetailsPosition: {},

    // dragging
    currentDraggingBlockId: '', // id
    preventDraggedBlockFromShowingDetails: false,

    // multiple blocks
    multipleBlocksSelected: [], // ids
    multipleBlockActionsIsVisible: false,
    multipleBlockActionsPosition: {},
    blockMap: []
  },
  mutations: {
    closeAllPopOvers: (state) => {
      state.currentSpace.blocks.map(block => {
        block.blockDetailsVisible = false
      })
      state.currentSpace.connections.map(connection => {
        connection.connectionDetailsVisible = false
      })
      state.connectionDetailsIsVisible = false
      state.multipleBlockActionsIsVisible = false
    },

    // connecting
    currentUserIsDrawingConnection: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.currentUserIsDrawingConnection = value
    },
    currentConnectionSuccess: (state, object) => {
      utils.typeCheck(object, 'object', true)
      state.currentConnectionSuccess = object
    },
    currentConnectionCursorStart: (state, object) => {
      utils.typeCheck(object, 'object')
      state.currentConnectionCursorStart = object
    },
    currentConnection: (state, updates) => {
      let object = state.currentConnection
      object = utils.updateObject(object, updates)
      state.currentConnection = object
    },

    // inking
    currentUserIsInking: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.currentUserIsInking = value
    },
    currentUserIsInkingLocked: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.currentUserIsInkingLocked = value
    },

    // dragging
    currentUserIsDraggingBlock: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.currentUserIsDraggingBlock = value
    },
    preventDraggedBlockFromShowingDetails: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.preventDraggedBlockFromShowingDetails = value
    },
    currentDraggingBlockId: (state, blockId) => {
      utils.typeCheck(blockId, 'string')
      state.currentDraggingBlockId = blockId
    },

    // connection details
    connectionDetailsIsVisible: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.connectionDetailsIsVisible = value
    },
    connectionDetailsPosition: (state, position) => {
      utils.typeCheck(position, 'object')
      state.connectionDetailsPosition = position
    },

    // multiple blocks
    multipleBlocksSelected: (state, blocks) => {
      utils.typeCheck(blocks, 'array')
      state.multipleBlocksSelected = blocks
    },
    addToMultipleBlocksSelected: (state, blockId) => {
      utils.typeCheck(blockId, 'string')
      if (!state.multipleBlocksSelected.includes(blockId)) {
        state.multipleBlocksSelected.push(blockId)
      }
    },
    multipleBlockActionsIsVisible: (state, value) => {
      utils.typeCheck(value, 'boolean')
      state.multipleBlockActionsIsVisible = value
    },
    generateBlockMap: (state) => {
      const blocks = document.querySelectorAll('.block')
      state.blockMap = []
      blocks.forEach(block => {
        const article = block.closest('article')
        const rect = block.getBoundingClientRect()
        state.blockMap.push({
          blockId: block.dataset.blockId,
          x: parseInt(article.style.left),
          y: parseInt(article.style.top),
          width: rect.width,
          height: rect.height
        })
      })
    },
    multipleBlockActionsPosition: (state, position) => {
      utils.typeCheck(position, 'object')
      state.multipleBlockActionsPosition = position
    }
  },
  modules: {
    currentUser,
    currentSpace,
    broadcast
  }
})
