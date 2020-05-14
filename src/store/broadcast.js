// client → [broadcast] → websocket → server

// triggers websocket senders

let reconnectAttempts = 0

const self = {
  namespaced: true,
  mutations: {
    connect: () => {},
    reconnect: () => {},
    joinSpaceRoom: () => {},
    update: () => {},
    close: () => {}

    // - 👀 how to do user left room (heartbeat? server sees disconnect sends msg to all clients on spaceid)

    // currentuser -> currentspace: IN STASH
    // NEW updateCollaborator updatedCollaborator
    // NEW updateUser updatedUser

  },
  actions: {
    reconnect: (context) => {
      setTimeout(() => {
        context.commit('reconnect')
        reconnectAttempts += 1
      }, Math.min(5000 * reconnectAttempts), 60 * 1000)
    }
  }
}

export default self
