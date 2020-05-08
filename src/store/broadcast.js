// client ←→ [broadcast] ←→ websocket ←→ server

// actions respond to received websocket events

let reconnectAttempts = 0

const self = {
  namespaced: true,
  mutations: {
    // watched by websocket.js
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
