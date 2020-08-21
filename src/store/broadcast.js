// client → [broadcast] → websocket → server

let reconnectAttempts = 0

const self = {
  namespaced: true,
  // triggers websocket
  mutations: {
    connect: () => {},
    reconnect: () => {},
    joinSpaceRoom: () => {},
    leaveSpaceRoom: () => {},
    update: () => {},
    updateUser: () => {},
    updateStore: () => {},
    close: () => {}
  },
  actions: {
    reconnect: (context) => {
      setTimeout(() => {
        context.commit('reconnect')
        reconnectAttempts += 1
      }, Math.min(5000 * reconnectAttempts), 30 * 1000)
    }
  }
}

export default self
