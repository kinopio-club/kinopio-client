// client ←→ [broadcast] ←→ websocket ←→ server

// sends and receives messages by calling mutations
// which are subscribed to by websocket.js

const self = {
  namespaced: true,
  // state: {
  //   canEditSpace: false
  // },
  mutations: {
    connect: () => {},
    joinSpaceRoom: () => {}
    // authorizeEdit: () => {
    //   this.canEditSpace = true
    // },
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
