import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// can make these seperate files with `export default {}` instead of const

const currentUser = {
  namespaced: true,
  state: {
    id: 1,
    color: 'cyan'
  },
  actions: {
    // get users in a space from api
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
        x: 200,
        y: 250,
        name: 'connect me!'
      }
    ],
    connectors: [
      {
        id: 1,
        name: 'connection 1',
        color: 'pink'
      }
    ],
    connections: [
      {
        id: 1,
        connector: 1,
        startCard: 1,
        endCard: 2
      }
    ]
  },
  actions: {
    // get space from api, then muttate
    // get card convo details on click, then mutate
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

// const api = {
//   namespaced: true,
//   actions: {
//     updatePaint
//   }
// }

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {
    currentUserIsDrawingConnection: false,
    currentUserIsPainting: false,
    drawingConnectionOrigin: {}
    // currentUserIsDraggingCard: false
  },
  mutations: {
    currentUserIsDrawingConnection: (state, value) => {
      state.currentUserIsDrawingConnection = value
    },
    currentUserIsPainting: (state, value) => {
      state.currentUserIsPainting = value
    },
    drawingConnectionOrigin: (state, value) => {
      state.drawingConnectionOrigin = value
    }
  },
  //   toggleIsPainting(state) {
  //     console.log('🌍',state)
  //     // let isPainting = this.state.isPainting
  //     state.isPainting = !state.isPainting
  //   }
  // },
  // actions can be async
  // used these to boot and do server things
  // Actions are similar to mutations, the differences being that:
  // Instead of mutating the state, actions commit mutations.
  // Actions can contain arbitrary asynchronous operations. https://vuex.vuejs.org/guide/actions.html
  // getters: {
  // currentUserIsInteracting: state => {
  //   if (
  //     state.currentUserIsDrawingConnection ||
  //     state.currentUserIsPainting ||
  //     state.currentUserIsDraggingCard
  //   ) {
  //     return true
  //   }
  // }
  // },
  // actions: {
  // paint(x, y, size, color) {
  //   console.log('asldfkjasdf', this)
  //   // broadcast.actions.paint(x, y, size, color)
  // }
  // },
  // can add helper module utils for additional global methods https://vuex.vuejs.org/guide/modules.html
  // maybe use a module for each model type? users Module, spaces Module etc.
  modules: {
    currentUser,
    currentSpace,
    broadcast
  }
})
