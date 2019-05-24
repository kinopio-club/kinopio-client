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
    // get users in a space?
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
    ]
  },
  actions: {
    // get users in a space?
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
