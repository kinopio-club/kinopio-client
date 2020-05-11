// broadcast/store ←→ [websocket] ←→ server

// handles websockets, and delegates events to broadcast

import nanoid from 'nanoid'

import utils from '@/utils.js'

let websocket, currentSpaceRoom, currentUserIsConnected
const clientId = nanoid()

const joinSpaceRoom = (store, mutation) => {
  const space = utils.clone(store.state.currentSpace)
  const currentSpaceHasUrl = utils.currentSpaceHasUrl(space)
  let user = utils.clone(store.state.currentUser)
  if (!currentSpaceHasUrl) { return }
  if (currentSpaceRoom === space.id) { return }
  console.log('🌜 joinSpaceRoom', space.name)
  currentSpaceRoom = space.id
  websocket.send(JSON.stringify({
    message: 'joinSpaceRoom',
    space: utils.spaceMeta(space),
    user: utils.userMeta(user, space),
    clientId
  }))
}

const sendEvent = (store, mutation) => {
  const message = mutation.payload.type
  let updates = mutation.payload
  updates = utils.normalizeBroadcastUpdates(updates)
  console.log('🌜', message, updates)
  const space = utils.clone(store.state.currentSpace)
  websocket.send(JSON.stringify({
    message,
    updates,
    clientId,
    space: utils.spaceMeta(space)
  }))
}

const checkIfShouldUpdateWindowUrlAndTitle = (store, data) => {
  const newName = data.updates.name
  if (data.message === 'updateSpace' && newName) {
    utils.updateWindowUrlAndTitle({
      space: utils.clone(store.state.currentSpace),
      shouldUpdateUrl: true
    })
  }
}

export default function createWebSocketPlugin () {
  return store => {
    store.subscribe((mutation, state) => {
      if (mutation.type === 'broadcast/connect') {
        const host = utils.websocketHost()
        websocket = new WebSocket(host)
        websocket.onopen = (event) => {
          currentUserIsConnected = true
          store.commit('broadcast/joinSpaceRoom')
        }
        websocket.onclose = (event) => {
          console.warn('🌚', event)
          store.dispatch('broadcast/reconnect')
        }
        websocket.onerror = (event) => {
          console.warn('🌌', event)
        }
        // receive
        websocket.onmessage = ({ data }) => {
          data = JSON.parse(data)
          if (data.clientId === clientId) { return }
          console.log('🌛', data)
          if (data.message === 'connected') {

          } else if (data.message === 'userJoinedRoom') {
            store.commit('currentSpace/addSpectatorToSpace', data.user)
          } else {
            store.commit(`currentSpace/${data.message}`, data.updates)
            checkIfShouldUpdateWindowUrlAndTitle(store, data)
          }
        }
      }

      // send
      if (mutation.type === 'broadcast/joinSpaceRoom') {
        if (!currentUserIsConnected) {
          store.commit('broadcast/connect')
          return
        }
        joinSpaceRoom(store, mutation)
      } else if (mutation.type === 'broadcast/update') {
        sendEvent(store, mutation)
      } else if (mutation.type === 'broadcast/close') {
        websocket.close()
      }
    })
  }
}
