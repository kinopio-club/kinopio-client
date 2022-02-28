// client → [broadcast] → websocket → server

let reconnectAttempts = 0
let reconnectTime
const maxTime = 30 * 1000 // 30 seconds

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
        reconnectTime = 5000 * reconnectAttempts // 5 seconds * n
      }, Math.min(reconnectTime, maxTime))
    },
    update: (context, update) => {
      context.commit('update', update)
    }
  }
}

export default self
