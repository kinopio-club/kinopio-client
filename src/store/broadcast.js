// client → [broadcast] → websocket → server

// triggers websocket senders

let reconnectAttempts = 0

const self = {
  namespaced: true,
  mutations: {
    connect: () => {},
    joinSpaceRoom: () => {},
    update: () => {},
    close: () => {}

    // currentuser -> currentspace: IN STASH
    // NEW updateCollaborator updatedCollaborator
    // NEW updateUser updatedUser

    // - 👀 how to do user left room (heartbeat? server sees disconnect sends msg to all clients on spaceid)

  },
  actions: {
    reconnect: (context) => {
      setTimeout(() => {
        context.commit('connect')
        reconnectAttempts += 1
      }, 5000 * reconnectAttempts)
    }
  }
}

export default self
