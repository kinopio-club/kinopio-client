import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  // bool states for visibility etc
  state: {
    lollipops: 'lollipops',
    isPainting: false,
    currentSpace: {},
    users: [
      {
        id: 1,
        color: 'cyan'
      }
    ],
    currentUser () {
      return this.users.find(user => user.id === 1)
    }

  },
  // use these for helper methods that take params
  // eg increment: state => state.count++
  // You cannot directly call a mutation handler
  // store.commit('increment') // https://vuex.vuejs.org/guide/mutations.html
  mutations: {
  },
  // actions can be async
  // used these to boot and do server things
  // Actions are similar to mutations, the differences being that:
  // Instead of mutating the state, actions commit mutations.
  // Actions can contain arbitrary asynchronous operations. https://vuex.vuejs.org/guide/actions.html
  actions: {
  }
  // can add helper module utils for additional global methods https://vuex.vuejs.org/guide/modules.html
})
