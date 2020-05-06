// broadcast ←→ [websocket] ←→ server

// handles websockets, and delegates events to broadcast

import utils from '@/utils.js'

let websocket

export default function createWebSocketPlugin () {
  return store => {
    store.subscribe((mutation, state) => {
      // connect
      if (mutation.type === 'broadcast/connect') {
        const host = utils.websocketHost()
        websocket = new WebSocket(host)
        websocket.onopen = (event) => {
          console.log('🌝', event.target)
        }
        websocket.onmessage = ({ data }) => {
          data = JSON.parse(data)
          if (data.userId === store.state.currentUser.id) { return }
          console.log('🌛', data)
          // store.dispatch('broadcast/canEditSpace', data.canEditSpace)
        }
        websocket.onclose = (event) => {
          console.error('🌚', event)
          // ??reconnect, increasing time outs
        }
        websocket.onerror = (event) => {
          console.error('🚒', event)
          // ??reconnect, increasing time outs
        }
      }

      // join space room
      if (mutation.type === 'broadcast/joinSpaceRoom') {
        console.log('send joinSpaceRoom')
        websocket.send(JSON.stringify({
          message: 'joinSpaceRoom',
          spaceId: store.state.currentSpace.id,
          userId: store.state.currentUser.id
          // space: {
          //   id: store.state.currentSpace.id,
          //   name: store.state.currentSpace.name
          // },
          // user: {
          //   id: store.state.currentUser.id,
          //   name: store.state.currentUser.name,
          //   color: store.state.currentUser.color
          //   // collaboratorKey: store.state.anonymousCollaboratorKey
          // }
        }))
      }
    })
  }
}
