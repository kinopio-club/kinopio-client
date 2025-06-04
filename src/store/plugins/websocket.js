// broadcast/store ←→ [websocket] ←→ server

// handles websockets, and delegates events to broadcast

// 🌛 Send
// 🌜 Receive

import { getActivePinia } from 'pinia'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import { nanoid } from 'nanoid'

import utils from '@/utils.js'
import consts from '@/consts.js'

let websocket, currentSpaceRoom, currentUserIsConnected
const clientId = nanoid()

console.info('🌳 websocket clientId', clientId)
const showDebugMessages = false

const joinSpaceRoom = (store, mutation) => {
  const spaceStore = useSpaceStore()
  const userStore = useUserStore()
  console.info('🌙 joining', websocket)
  if (!websocket) { return }
  const space = spaceStore.getSpaceAllState
  const user = userStore.getUserAllState
  const currentSpaceIsRemote = spaceStore.getSpaceIsRemote
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
  const spaceIsLoadedOrCached = Boolean(spaceStore.cards.length) // proxy for checking if user can view space
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
  console.info('🌜 joinSpaceRoom', space.name)
  store.commit('isJoiningSpace', false)
}

const sendEvent = (store, mutation, type) => {
  const spaceStore = useSpaceStore()
  if (!websocket || !currentUserIsConnected) { return }
  const shouldBroadcast = spaceStore.getSpaceShouldBroadcast
  if (!shouldBroadcast) { return }
  const { message, handler, updates } = utils.normalizeBroadcastUpdates(mutation.payload)
  const hidden = ['updateRemoteUserCursor', 'addRemotePaintingCircle', 'clearRemoteCardDetailsVisible', 'clearRemoteConnectionDetailsVisible', 'addRemoteDrawingStroke', 'removeRemoteDrawingStroke']
  if (showDebugMessages && !hidden.includes(updates.type)) {
    console.info('🌜 sent', message, handler, updates, { clientId })
  }
  const space = spaceStore.getSpaceAllState
  websocket.send(JSON.stringify({
    message,
    handler,
    updates,
    clientId,
    space: utils.spaceMeta(space),
    type
  }))
}
const checkIfShouldUpdateLinkToItem = (store, { message, updates }) => {
  const spaceStore = useSpaceStore()
  if (message !== 'updateCard') { return }
  let options
  if (updates.linkToCardId) {
    options = { cardId: updates.linkToCardId }
  } else if (updates.linkToSpaceId) {
    options = { cardId: updates.linkToSpaceId }
  }
  if (!options) { return }
  spaceStore.updateOtherItems(options)
}
const checkIfShouldNotifyOffscreenCardCreated = (store, data) => {
  if (data.message === 'createCard') {
    store.commit('triggerNotifyOffscreenCardCreated', data.updates.card)
  }
}
const checkIfShouldPreventBroadcast = (store) => {
  const spaceStore = useSpaceStore()
  const spaceIsRemote = spaceStore.getSpaceIsRemote
  return !spaceIsRemote
}
const closeWebsocket = (store) => {
  if (!websocket) { return }
  store.commit('isJoiningSpace', true)
  websocket.close()
}

export default function createWebSocketPlugin () {
  return store => {
    store.subscribe((mutation, state) => {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const broadcastStore = useBroadcastStore()
      if (mutation.type === 'broadcast/connect') {
        store.commit('isJoiningSpace', true)
        const host = consts.websocketHost()
        websocket = new WebSocket(host)
        websocket.onopen = (event) => {
          currentUserIsConnected = true
          broadcastStore.joinSpaceRoom()
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
          const shouldPrevent = checkIfShouldPreventBroadcast(store)
          console.warn('🌌', event, shouldPrevent)
          if (shouldPrevent) { return }
          store.commit('isReconnectingToBroadcast', true)
        }

        // receive 🌜

        websocket.onmessage = ({ data }) => {
          data = JSON.parse(data)
          if (data.clientId === clientId) { return }
          if (data.message !== 'updateRemoteUserCursor' && showDebugMessages) {
            console.info('🌛 received', data, data.clientId)
          }
          if (data.space) {
            if (data.space.id !== spaceStore.id) { return }
          }
          const { message, handler, user, updates, storeName, actionName } = data // TODO deprecate unused
          if (message === 'connected') {
          // presence
          } else if (handler) {
            store.commit(handler, updates)
            checkIfShouldUpdateLinkToItem(store, data)
            checkIfShouldNotifyOffscreenCardCreated(store, data)

          // pinia
          } else if (storeName && actionName) {
            updates.isBroadcast = true
            const pinia = getActivePinia()
            if (!pinia) return
            const piniaStore = pinia._s.get(storeName)
            piniaStore[actionName](updates)
          // users
          } else if (message === 'userJoinedRoom') {
            spaceStore.addUserToJoinedSpace(user)
          } else if (message === 'updateUserPresence') {
            spaceStore.updateUserPresence(updates)
            store.commit('updateOtherUsers', updates.user, { root: true })
          } else if (message === 'userLeftRoom') {
            spaceStore.removeIdleClientFromSpace(user || updates.user)
            store.commit('clearRemoteMultipleSelected', data)
          } else if (message === 'userLeftSpace') {
            spaceStore.removeCollaboratorFromSpace(updates.user)
            if (updates.user.id === userStore.id) {
              spaceStore.removeCurrentUserFromSpace()
            }
          // other
          } else if (data.type === 'store') {
            store.commit(`${message}`, updates)
          } else {
            spaceStore[message](updates)
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
        spaceStore.clients = []
        sendEvent(store, mutation)
      } else if (mutation.type === 'broadcast/update') {
        sendEvent(store, mutation)
      } else if (mutation.type === 'broadcast/updateUser') {
        sendEvent(store, mutation)
      } else if (mutation.type === 'broadcast/updateStore') {
        const canEditSpace = userStore.getUserCanEditSpace
        if (!canEditSpace) { return }
        sendEvent(store, mutation, 'store')
      } else if (mutation.type === 'broadcast/close') {
        closeWebsocket(store)
      } else if (mutation.type === 'broadcast/reconnect') {
        console.info('🌝 reconnecting')
        closeWebsocket(store)
        currentUserIsConnected = false
        currentSpaceRoom = null
        broadcastStore.joinSpaceRoom()
      }
    })
  }
}
