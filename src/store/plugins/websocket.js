// broadcast/store ←→ [websocket] ←→ server

// handles websockets, and delegates events to broadcast

import nanoid from 'nanoid'

import utils from '@/utils.js'

let websocket, currentSpaceRoom, currentUserIsConnected
const clientId = nanoid()
let showDebugMessages = true
if (process.env.NODE_ENV === 'development') {
  showDebugMessages = false
}

const joinSpaceRoom = (store, mutation) => {
  if (!websocket) { return }
  const space = utils.clone(store.state.currentSpace)
  const currentSpaceHasUrl = utils.currentSpaceHasUrl(space)
  const user = utils.clone(store.state.currentUser)
  if (!currentSpaceHasUrl) { return }
  if (currentSpaceRoom === space.id) { return }
  if (websocket.readyState === 0) {
    console.warn('🚑 joinSpaceRoom cancelled because websocket not ready', websocket.readyState)
    return
  }
  const spaceIsLoadedOrCached = Boolean(store.state.currentSpace.cards.length) // proxy for checking if user can view space
  if (!spaceIsLoadedOrCached) { return }
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
  const message = mutation.payload.type
  let updates = mutation.payload
  updates = utils.normalizeBroadcastUpdates(updates)
  const hidden = ['updateRemoteUserCursor', 'addRemotePaintingCircle', 'clearRemoteCardDetailsVisible', 'clearRemoteConnectionDetailsVisible']
  if (showDebugMessages && !hidden.includes(updates.type)) {
    console.log('🌜', updates)
  }
  const space = utils.clone(store.state.currentSpace)
  websocket.send(JSON.stringify({
    message,
    updates,
    clientId,
    space: utils.spaceMeta(space),
    type
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

const checkIfShouldUpdateLinkToSpaceId = (store, { message, updates }) => {
  if (message === 'updateCard' && updates.linkToSpaceId) {
    store.dispatch('currentSpace/updateOtherSpaces', updates.linkToSpaceId)
  }
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
        // receive
        websocket.onmessage = ({ data }) => {
          data = JSON.parse(data)
          if (data.clientId === clientId) { return }
          if (data.message !== 'updateRemoteUserCursor' && showDebugMessages) {
            console.log('🌛', data)
          }
          let { message, user, updates } = data
          if (message === 'connected') {
          // presence
          } else if (message === 'userJoinedRoom') {
            store.dispatch('currentSpace/addUserToJoinedSpace', user)
          } else if (message === 'addSpectatorToSpace') {
            store.dispatch('currentSpace/addSpectatorToSpace', updates)
            store.commit('updateOtherUsers', updates.user, { root: true })
          } else if (message === 'userLeftRoom') {
            store.commit('currentSpace/removeSpectatorFromSpace', user || updates.user)
            store.commit('clearRemoteMultipleSelected', data)
          } else if (message === 'userLeftSpace') {
            store.commit('currentSpace/removeCollaboratorFromSpace', updates.user)
            if (updates.user.id === store.state.currentUser.id) {
              store.dispatch('currentSpace/removeCurrentUserFromSpace', updates.user)
            }
          // circles and position
          } else if (message === 'addRemotePaintingCircle') {
            store.commit('triggerAddRemotePaintingCircle', updates)
          } else if (message === 'updateRemoteUserCursor') {
            store.commit('triggerUpdateRemoteUserCursor', updates)
          // drop guide lines
          } else if (message === 'updateRemoteUserDropGuideLine') {
            store.commit('triggerUpdateRemoteDropGuideLine', updates)
          } else if (message === 'updateStopRemoteUserDropGuideLine') {
            store.commit('triggerUpdateStopRemoteUserDropGuideLine', updates)
          // other
          } else if (data.type === 'store') {
            store.commit(`${message}`, updates)
          } else {
            store.commit(`currentSpace/${message}`, updates)
            checkIfShouldUpdateWindowUrlAndTitle(store, data)
            checkIfShouldUpdateLinkToSpaceId(store, data)
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
        closeWebsocket(store)
        currentUserIsConnected = false
        currentSpaceRoom = null
        store.commit('broadcast/joinSpaceRoom')
      }
    })
  }
}
