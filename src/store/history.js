import utils from '@/utils.js'

const self = {
  namespaced: true,
  state: {
    items: []
  },
  mutations: {
    add: (state, item) => {
      console.log('💚', item, item.body)
      utils.typeCheck(item, 'object')
      state.items.push(item)
    },
    clear: (state) => {
      state.items = []
    },
  },
  actions: {

    // clear, restore, undo(restoreToLastSignificantItem) , redo

    playback: (context) => {
      // const history = context.state.history
      console.log('🍄', context.state.items)
      context.state.items.forEach(item => {
        console.log(item)
        // call the currentspace mutation in name, with the body payload
      })
      // upate all paths
    }

  }
}

export default self
