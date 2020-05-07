// client ←→ [broadcast] ←→ websocket ←→ server

// mutations send websocket events,
// actions respond to received websocket events

let reconnectAttempts = 1

const self = {
  namespaced: true,
  // state: {
  //   xyz: ''
  // },
  mutations: {
    connect: () => {},
    joinSpaceRoom: () => {}
    // updateUserMeta: () => {}
  },
  actions: {
    reconnect: (context) => {
      setTimeout(() => {
        context.commit('connect')
        reconnectAttempts += 1
      }, 5000 * reconnectAttempts)
    },
    userJoinedRoom: (context, data) => {
      console.log('💐', data)
      // add data.user to currentSpace state
      // method checks that user isn't already in space
    }
    // userUpdatedMeta
  }
}

export default self
