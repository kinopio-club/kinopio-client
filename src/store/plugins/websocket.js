import utils from '@/utils.js'

export default function createWebSocketPlugin () {
  return store => {
    store.subscribe((mutation, state) => {
      if (mutation.type === 'broadcast/connect') {
        const host = utils.websocketHost()
        // TODO need to disable existing websocket connection before making a new one?
        console.log('🌿connect time', store.state.currentUser, store.state.currentSpace)
        const websocket = new WebSocket(host) // + /:spaceId w user info to auth, if private only a member can connect (using user or contributorid). public viewing is reqd for teaching/demo-ing scenarios to users w/o accounts
        websocket.onopen = (event) => {
          store.dispatch('broadcast/connectionOpened', event)
        }
        websocket.onmessage = ({ data }) => {
          store.dispatch('broadcast/receivedMessage', data)
        }
        // onclose
        // onerror
        // ??reconnect
      }

      // if (mutation.type === 'UPDATE_DATA') {
      // socket.emit('update', mutation.payload)
      // }
    })
  }
}
