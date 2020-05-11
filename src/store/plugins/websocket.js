// broadcast ←→ [websocket] ←→ server

// handles websockets, and delegates events to broadcast

import nanoid from 'nanoid'

import utils from '@/utils.js'

let websocket, currentSpaceRoom, currentUserIsConnected
const clientId = nanoid()

export default function createWebSocketPlugin () {
  return store => {
    store.subscribe((mutation, state) => {
      // connect
      if (mutation.type === 'broadcast/connect') {
        const host = utils.websocketHost()
        websocket = new WebSocket(host)
        websocket.onopen = (event) => {
          console.log('💐', event.target)
          currentUserIsConnected = true
          store.commit('broadcast/joinSpaceRoom')
        }
        websocket.onclose = (event) => {
          console.warn('🌚', event)
          store.dispatch('broadcast/reconnect')
        }
        websocket.onerror = (event) => {
          console.warn('🚑', event)
        }

        // responders
        websocket.onmessage = ({ data }) => {
          data = JSON.parse(data)
          if (data.clientId === clientId) { return }
          console.log('💐', data)
          if (data.message === 'userJoinedRoom') {
            store.commit('currentSpace/addSpectatorToSpace', data.user)
          } else if (data.message === 'updateSpace') {
            store.commit('currentSpace/updateSpace', data.updates)
          }
        }
      }

      // join
      if (mutation.type === 'broadcast/joinSpaceRoom') {
        if (!currentUserIsConnected) {
          store.commit('broadcast/connect')
          return
        }
        const space = utils.clone(store.state.currentSpace)
        let user = utils.clone(store.state.currentUser)
        const currentSpaceHasUrl = utils.currentSpaceHasUrl(space)
        if (!currentSpaceHasUrl) { return }
        if (currentSpaceRoom === space.id) { return }
        console.log('🌱 joining space room', space.name)
        currentSpaceRoom = space.id
        websocket.send(JSON.stringify({
          message: 'joinSpaceRoom',
          space: utils.spaceMeta(space),
          user: utils.userMeta(user, space),
          clientId
        }))
      }

      // updateSpace
      if (mutation.type === 'broadcast/updateSpace') {
        console.log(mutation.payload)
        const space = utils.clone(store.state.currentSpace)
        websocket.send(JSON.stringify({
          message: 'updateSpace',
          space: utils.spaceMeta(space),
          updates: mutation.payload,
          clientId
        }))
      }
    })
  }
}
