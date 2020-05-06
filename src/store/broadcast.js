// sends and receives messages by calling mutations
// which are subscribed to by websocket.js

const self = {
  namespaced: true,
  // state: {
  // isConnected: false
  // },
  mutations: {
    connect: () => {},
    joinSpaceRoom: () => {}
  },
  actions: {
    // send (context, event) => {
    // event is json, feels like you're sending it to all space friends
    // }

    // receivedMessage: (context, data) => {
    //   console.log('🌛', data)
    // }
  }
}

export default self
