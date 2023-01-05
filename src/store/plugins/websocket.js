// broadcast/store ←→ [websocket] ←→ server

// handles websockets, and delegates events to broadcast

// 🌛 Send
// 🌜 Receive

import { nanoid } from 'nanoid'

import utils from '@/utils.js'

let websocket, currentSpaceRoom, currentUserIsConnected
const clientId = nanoid()

console.log('🌳 websocket clientId', clientId)
let showDebugMessages = true
if (import.meta.env.MODE === 'development') {
  showDebugMessages = false
}

const joinSpaceRoom = (store, mutation) => {
  console.log('🌙 joining', websocket)
  if (!websocket) { return }
  const space = utils.clone(store.state.currentSpace)
  const user = utils.clone(store.state.currentUser)
  const currentSpaceIsRemote = utils.currentSpaceIsRemote(space, user)
  if (!currentSpaceIsRemote) {
    store.commit('isJoiningSpace', false)
    return
  }
  if (currentSpaceRoom === space.id) {
    store.commit('isJoiningSpace', false)
    return
  }
  if (websocket.readyState === 0) {
    console.warn('🚑 joinSpaceRoom cancelled because websocket not ready', websocket.readyState)
    store.commit('isJoiningSpace', false)
    return
  }
  const spaceIsLoadedOrCached = Boolean(store.state.currentSpace.cards.length) // proxy for checking if user can view space
  if (!spaceIsLoadedOrCached) {
    store.commit('isJoiningSpace', false)
    return
  }
  currentSpaceRoom = space.id
  websocket.send(JSON.stringify({
    message: 'joinSpaceRoom',
    space: utils.spaceMeta(space),
    user: utils.userMeta(user, space),
    clientId
  }))
  console.log('🌜 joinSpaceRoom', space.name)
  store.commit('isJoiningSpace', false)
}

const sendEvent = (store, mutation, type) => {
  if (!websocket || !currentUserIsConnected) { return }
  const shouldBroadcast = store.getters['currentSpace/shouldBroadcast']
  if (!shouldBroadcast) { return }
  const { message, handler, updates } = utils.normalizeBroadcastUpdates(mutation.payload)
  const hidden = ['updateRemoteUserCursor', 'addRemotePaintingCircle', 'clearRemoteCardDetailsVisible', 'clearRemoteConnectionDetailsVisible']
  if (showDebugMessages && !hidden.includes(updates.type)) {
    console.log('🌜 sent', message, handler, updates, { clientId })
  }
  const space = store.state.currentSpace
  websocket.send(JSON.stringify({
    message,
    handler,
    updates,
    clientId,
    space: utils.spaceMeta(space),
    type
  }))
}

const checkIfShouldUpdateLinkToSpaceId = (store, { message, updates }) => {
  if (message === 'updateCard' && updates.linkToSpaceId) {
    store.dispatch('currentSpace/updateOtherSpaces', updates.linkToSpaceId)
  }
}

const checkIfShouldUpdateBackground = (store, { message, updates }) => {
  const updateKeys = Object.keys(updates)
  updateKeys.forEach(key => {
    const shouldUpdateBackground = key === 'background' || key === 'backgroundTint'
    if (message === 'updateSpace' && shouldUpdateBackground) {
      store.commit('triggerLoadBackground')
    }
  })
}

const closeWebsocket = (store) => {
  if (!websocket) { return }
  store.commit('isJoiningSpace', true)
  websocket.close()
}

export default function createWebSocketPlugin () {
  return store => {
    store.subscribe((mutation, state) => {
      if (mutation.type === 'broadcast/connect') {
        store.commit('isJoiningSpace', true)
        const host = utils.websocketHost()
        websocket = new WebSocket(host)
        websocket.onopen = (event) => {
          currentUserIsConnected = true
          store.commit('broadcast/joinSpaceRoom')
          if (store.state.isReconnectingToBroadcast) {
            store.commit('isReconnectingToBroadcast', false)
          }
        }
        websocket.onclose = (event) => {
          console.warn('🌚', event)
          store.commit('isJoiningSpace', true)
          store.dispatch('broadcast/reconnect')
        }
        websocket.onerror = (event) => {
          console.warn('🌌', event)
          store.commit('isReconnectingToBroadcast', true)
        }

        // receive 🌜

        websocket.onmessage = ({ data }) => {
          data = JSON.parse(data)
          if (data.clientId === clientId) { return }
          if (data.message !== 'updateRemoteUserCursor' && showDebugMessages) {
            console.log('🌛 received', data, data.clientId)
          }
          if (data.space) {
            if (data.space.id !== store.state.currentSpace.id) { return }
          }
          let { message, handler, user, updates } = data
          if (message === 'connected') {
          // presence
          } else if (handler) {
            store.commit(handler, updates)
            checkIfShouldUpdateLinkToSpaceId(store, data)
          // users
          } else if (message === 'userJoinedRoom') {
            store.dispatch('currentSpace/addUserToJoinedSpace', user)
          } else if (message === 'updateUserPresence') {
            store.dispatch('currentSpace/updateUserPresence', updates)
            store.commit('updateOtherUsers', updates.user, { root: true })
          } else if (message === 'userLeftRoom') {
            store.commit('currentSpace/removeSpectatorFromSpace', user || updates.user)
            store.commit('clearRemoteMultipleSelected', data)
          } else if (message === 'userLeftSpace') {
            store.commit('currentSpace/removeCollaboratorFromSpace', updates.user)
            if (updates.user.id === store.state.currentUser.id) {
              store.dispatch('currentSpace/removeCurrentUserFromSpace', updates.user)
            }
          // other
          } else if (data.type === 'store') {
            store.commit(`${message}`, updates)
          } else {
            store.commit(`currentSpace/${message}`, updates)
            checkIfShouldUpdateBackground(store, data)
          }
        }
      }

      // send 🌛

      if (mutation.type === 'broadcast/joinSpaceRoom') {
        if (!currentUserIsConnected) {
          store.commit('broadcast/connect')
          return
        }
        joinSpaceRoom(store, mutation)
      } else if (mutation.type === 'broadcast/leaveSpaceRoom') {
        store.commit('currentSpace/removeClientsFromSpace')
        sendEvent(store, mutation)
      } else if (mutation.type === 'broadcast/update') {
        const canEditSpace = store.getters['currentUser/canEditSpace']()
        if (!canEditSpace) { return }
        sendEvent(store, mutation)
      } else if (mutation.type === 'broadcast/updateUser') {
        sendEvent(store, mutation)
      } else if (mutation.type === 'broadcast/updateStore') {
        const canEditSpace = store.getters['currentUser/canEditSpace']()
        if (!canEditSpace) { return }
        sendEvent(store, mutation, 'store')
      } else if (mutation.type === 'broadcast/close') {
        closeWebsocket(store)
      } else if (mutation.type === 'broadcast/reconnect') {
        console.log('🌝 reconnecting')
        closeWebsocket(store)
        currentUserIsConnected = false
        currentSpaceRoom = null
        store.commit('broadcast/joinSpaceRoom')
      }
    })
  }
}
