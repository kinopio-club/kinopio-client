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

    // updateConnection updatedConnection
    // addConnection connection
    // removeConnection connectionToRemove
    // updateConnectionTypeForConnection { connectionId, connectionTypeId }
    // updateLabelIsVisibleForConnection { connectionId, labelIsVisible }

    // addConnectionType connectionType
    // removeConnectionType connectionType
    // updateConnectionType updatedType

    // magicpaint
    // paintCircle
    // ^ (circle = { color,x,y, username, userid })
    // // push into store.addMemberPaintCircles
    // ^ magicpaint.vue has to subscribe to addBroadcastedPaintCircles, which takes from array to file var like 'paintingCircles'
    // ^ add broadcast painting to all circle painting methods

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
