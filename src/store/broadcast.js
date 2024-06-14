// client → [broadcast] → websocket → server

let reconnectAttempts = 0
let reconnectTime
const maxTime = 30 * 1000 // 30 seconds

const updateCreateCard = (update, context) => {
  if (update.type === 'createCard') {
    const zoom = context.rootGetters.spaceZoomDecimal
    update.updates.card.zoom = zoom
  }
  return update
}

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
      update = updateCreateCard(update, context)
      context.commit('update', update)
    }
  }
}

export default self
