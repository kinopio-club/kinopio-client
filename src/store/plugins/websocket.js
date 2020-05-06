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
          console.log('🌛', data)
          // sends to the right dispatch broadcast depending on the message - ?(or direct to currentspcae/user stores?)
          // store.dispatch('broadcast/receivedMessage', )
        }
        // websocket.onclose 🌚
        // websocket.onerror 🚒
        // ??reconnect, increasing time outs
      }

      // join space room
      if (mutation.type === 'broadcast/joinSpaceRoom') {
        console.log('🌜 joining space room', store.state.currentSpace.name, store.state.currentSpace.id) // temp
        websocket.send(JSON.stringify({
          message: 'joinSpaceRoom',
          spaceId: store.state.currentSpace.id,
          userApiKey: store.state.currentUser.apiKey,
          userCollaboratorKey: store.state.anonymousCollaboratorKey
        }))
      }
    })
  }
}
