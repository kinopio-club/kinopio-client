// client ←→ [broadcast] ←→ websocket ←→ server

// sends and receives messages by calling mutations
// which are subscribed to by websocket.js

let reconnectAttempts = 1

const self = {
  namespaced: true,
  state: {
    currentSpaceRoom: ''
  },
  mutations: {
    connect: () => {},
    joinSpaceRoom: () => {}
    // canEditSpace: (state, canEditSpace) => {
    //   state.canEditSpace = canEditSpace

    // }
    // authorizeEdit: () => {
    //   this.canEditSpace = true
    // },
  },
  actions: {
    reconnect: (context) => {
      // if (context.state.isConnected) { return }
      setTimeout(() => {
        context.commit('connect')
        reconnectAttempts += 1
      }, 5000 * reconnectAttempts)
    }
    // send: (context, event) => {
    // event is json, feels like you're sending it to all space friends
    // }

    // receivedMessage: (context, data) => {
    //   console.log('🌛', data)
    // }
  }
}

export default self
