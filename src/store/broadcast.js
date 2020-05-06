// sends and receives messages by calling mutations
// which are subscribed to by websocket.js

const self = {
  namespaced: true,
  // state: {
  // isConnected: false
  // },
  mutations: {
    connect: () => {}
    // TODO add mutations subscribed to by websocket UPDATE_DATA
  },
  actions: {
    connectionOpened: (context, event) => {
      console.log('🔮 broadcast/websocket oopennnn', event.target)
    },
    receivedMessage: (context, data) => {
      console.log('🌍 got broadcast message', data)
    }
  }
}

export default self
