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
      context.commit('currentSpace/addSpectatorToSpace', data.user, { root: true })
    }
    // userUpdatedMeta
  }
}

export default self
