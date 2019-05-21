import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// can make these seperate files with `export default {}` instead of const
const users = {
  namespaced: true,
  state: {
    inSpace: [
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
    paint (context, { x, y, size, color }) {
      // console.log('broadcast paint', x,y,size,color)
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
  // bool states for visibility etc
  strict: process.env.NODE_ENV !== 'production',
  state: {
    lollipops: 'lollipops',
    currentSpace: {},
    currentUser () {
      // TODO get current user id from localstorage
      return this.users.inSpace.find(user => user.id === 1)
    }
  },
  // use these for helper methods that take params
  // eg increment: state => state.count++
  // You cannot directly call a mutation handler
  // store.commit('increment') // https://vuex.vuejs.org/guide/mutations.html
  // mutations: {
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
  actions: {
    // paint(x, y, size, color) {
    //   console.log('asldfkjasdf', this)
    //   // broadcast.actions.paint(x, y, size, color)
    // }
  },
  // can add helper module utils for additional global methods https://vuex.vuejs.org/guide/modules.html
  // maybe use a module for each model type? users Module, spaces Module etc.
  modules: {
    users,
    broadcast
  }
})
