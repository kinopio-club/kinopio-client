import utils from '@/utils.js'

const self = {
  namespaced: true,
  state: {
    history: []
  },
  mutations: {
    add: (state, item) => {
      utils.typeCheck(item, 'object')
      state.history.push(item)
    },
    clear: (state) => {
      state.history = []
    },
  },
  actions: {

    // clear, restore, undo , redo

    restore: (context) => {
      // const history = context.state.history
      console.log(context.state.history)
      context.state.history.forEach(item => {
        console.log(item)
        // call the currentspace mutation in name, with the body payload
      })
    }

  }
}

export default self
