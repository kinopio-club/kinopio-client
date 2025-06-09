// broadcast ←→ websocket ←→ server

// handles websockets, and delegates events to broadcast
// 🌛 Send
// 🌜 Receive

// TODO convert to pinia action subscriber plugin

import { useGlobalStore } from '@/stores/useGlobalStore'
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

const joinSpaceRoom = (store, payload) => {
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

const sendEvent = (store, payload, type) => {
  const spaceStore = useSpaceStore()
  if (!websocket || !currentUserIsConnected) { return }
  const shouldBroadcast = spaceStore.getSpaceShouldBroadcast
  if (!shouldBroadcast) { return }
  const { message, handler, updates } = utils.normalizeBroadcastUpdates(payload)
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
    const globalStore = useGlobalStore()
    const userStore = useUserStore()
    const spaceStore = useSpaceStore()
    const broadcastStore = useBroadcastStore()
    broadcastStore.$onAction(
      ({ name, args }) => {
      // on connect
        if (name === 'connect') {
          store.commit('isJoiningSpace', true)
          const host = consts.websocketHost()
          websocket = new WebSocket(host)
          websocket.onopen = (event) => {
            currentUserIsConnected = true
            broadcastStore.joinSpaceRoom()
            if (globalStore.isReconnectingToBroadcast) {
              globalStore.isReconnectingToBroadcast = false
            }
          }
          websocket.onclose = (event) => {
            console.warn('🌚', event)
            store.commit('isJoiningSpace', true)
            broadcastStore.reconnect()
          }
          websocket.onerror = (event) => {
            const shouldPrevent = checkIfShouldPreventBroadcast(store)
            console.warn('🌌', event, shouldPrevent)
            if (shouldPrevent) { return }
            globalStore.isReconnectingToBroadcast = true
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
              globalStore.updateOtherUsers(updates.user)
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

        if (name === 'joinSpaceRoom') {
          if (!currentUserIsConnected) {
            broadcastStore.connect()
            return
          }
          joinSpaceRoom(store, args[0])
        } else if (name === 'leaveSpaceRoom') {
          spaceStore.clients = []
          sendEvent(store, args[0])
        } else if (name === 'update') {
          sendEvent(store, args[0])
        } else if (name === 'updateUser') {
          sendEvent(store, args[0])
        } else if (name === 'updateStore') {
          const canEditSpace = userStore.getUserCanEditSpace
          if (!canEditSpace) { return }
          sendEvent(store, args[0], 'store')
        } else if (name === 'close') {
          closeWebsocket(store)
        } else if (name === 'reconnect') {
          console.info('🌝 reconnecting')
          closeWebsocket(store)
          currentUserIsConnected = false
          currentSpaceRoom = null
          broadcastStore.joinSpaceRoom()
        }
      })
  }
}
