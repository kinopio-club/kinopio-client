import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  // bool states for visibility etc
  state: {
    rainbows: true,
    lollipops: 'lollipops'
  },
  // use these for helper methods that take params
  // eg increment: state => state.count++
  mutations: {

  },
  // actions can be async
  // used these to boot and do server things
  actions: {

  }
})
