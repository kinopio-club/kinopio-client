// client ←→ [broadcast] ←→ websocket ←→ server

// actions respond to received websocket events

let reconnectAttempts = 0

const self = {
  namespaced: true,
  mutations: {
    // sends websocket event
    connect: () => {},
    joinSpaceRoom: () => {},
    updateSpace: () => {}

    // paintCircle
    // ^ (circle = { color,x,y, username, userid })
    // // push into store.addMemberPaintCircles
    // ^ magicpaint.vue has to subscribe to addBroadcastedPaintCircles, which takes from array to file var like 'paintingCircles'
    // ^ add broadcast painting to all circle painting methods

  },
  actions: {
    reconnect: (context) => {
      setTimeout(() => {
        context.commit('connect')
        reconnectAttempts += 1
      }, 5000 * reconnectAttempts)
    }

    // handles received websocket event
    // userJoinedRoom: (context, data) => {
    //   context.commit('currentSpace/addSpectatorToSpace', data.user, { root: true })
    // },
    // updateSpace: (context, data) => {
    //   context.commit('currentSpace/updateSpace', data.updates, { root: true })
    // },

    // currentSpace/:

    // updateSpace updatedSpace

    // NEW updateCollaborator updatedCollaborator
    // NEW updateUser updatedUser

    // incrementCardZ cardId
    // updateCard updatedCard
    // moveCard { cardId, delta }
    // createCard card
    // removeCard cardToRemove
    // restoreRemovedCard cardToRestore

    // updateConnection updatedConnection
    // addConnection connection
    // removeConnection connectionToRemove
    // updateConnectionTypeForConnection { connectionId, connectionTypeId }
    // updateLabelIsVisibleForConnection { connectionId, labelIsVisible }

    // addConnectionType connectionType
    // removeConnectionType connectionType
    // updateConnectionType updatedType

    // magicpaint

    // - 👀 how to do user left room (heartbeat? server sees disconnect sends msg to all clients on spaceid)

  }
}

export default self
