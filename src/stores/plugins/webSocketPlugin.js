// watches and sends to broadcastStore actions
// connect → join space room → send/receive messages

// data
// ├── message
// │   ├── name
// │   ├── updates
// │       └── isFromBroadcast
// │   ├── store
// │   ├── user
// │   └── action
// ├── spaceId
// ├── user
// └── clientId

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import { nanoid } from 'nanoid'
import throttle from 'lodash-es/throttle'

import utils from '@/utils.js'
import consts from '@/consts.js'

export default function webSocketPlugin () {
  let websocket, currentSpaceRoom, isConnected
  const clientId = nanoid()

  console.info('🌳 websocket client initialized', clientId)

  const getPiniaStore = (store, pinia) => {
    const globalStore = useGlobalStore(pinia)
    const spaceStore = useSpaceStore(pinia)
    const userStore = useUserStore(pinia)
    if (store === 'globalStore') {
      return globalStore
    } else if (store === 'spaceStore') {
      return spaceStore
    } else if (store === 'userStore') {
      return userStore
    } else {
      return globalStore
    }
  }

  // join

  const joinSpaceRoom = (pinia, payload) => {
    const globalStore = useGlobalStore(pinia)
    const spaceStore = useSpaceStore(pinia)
    const userStore = useUserStore(pinia)
    const spaceId = spaceStore.id
    const user = utils.userMeta(userStore.getUserAllState, spaceStore.getSpaceAllState)
    // check if should join
    if (!websocket) {
      console.info('🌙 cannot join space room: no websocket connection', websocket)
      return
    }
    if (!spaceStore.getSpaceIsRemote) {
      globalStore.isJoiningSpace = false
      return
    }
    if (currentSpaceRoom === spaceId) {
      console.info('🌙 already in space room', spaceId)
      globalStore.isJoiningSpace = false
      return
    }
    if (websocket.readyState === 0) {
      console.warn('🚑 joinSpaceRoom cancelled: websocket not ready', websocket.readyState)
      globalStore.isJoiningSpace = false
      return
    }
    const spaceIsLoaded = !globalStore.isLoadingSpace
    if (!spaceIsLoaded) {
      console.info('🌙 cannot join space room: space not loaded', spaceId)
      globalStore.isJoiningSpace = false
      return
    }
    // Send join message
    currentSpaceRoom = spaceId
    websocket.send(JSON.stringify({
      message: {
        name: 'joinSpaceRoom'
      },
      spaceId,
      user,
      clientId
    }))
    console.info('🌜 joined space room', spaceId)
    globalStore.isJoiningSpace = false
  }

  // leave

  const closeWebsocket = (pinia) => {
    const globalStore = useGlobalStore(pinia)
    if (!websocket) {
      return
    }
    globalStore.isConnectingToBroadcast = false
    globalStore.isJoiningSpace = true
    try {
      websocket.close()
      websocket = null
    } catch (error) {
      console.error('🚒 closeWebsocket', error)
    }
  }

  // checks

  const checkIfShouldUpdateLinkToItem = (pinia, { action, updates }) => {
    const spaceStore = useSpaceStore(pinia)
    let options
    if (action !== 'updateCard') {
      return
    }
    if (updates.linkToCardId) {
      options = { cardId: updates.linkToCardId }
    } else if (updates.linkToSpaceId) {
      options = { cardId: updates.linkToSpaceId }
    }
    if (options) {
      spaceStore.updateOtherItems(options)
    }
  }
  const checkIfShouldNotifyOffscreenCardCreated = (pinia, { action, updates }) => {
    const globalStore = useGlobalStore(pinia)
    if (action === 'createCard') {
      globalStore.triggerNotifyOffscreenCardCreated(updates.card)
    }
  }
  const checkIfShouldPreventBroadcast = (pinia) => {
    const spaceStore = useSpaceStore(pinia)
    return !spaceStore.getSpaceIsRemote
  }

  // init

  const connectToWebsocket = (pinia) => {
    const globalStore = useGlobalStore(pinia)
    const spaceStore = useSpaceStore(pinia)
    const userStore = useUserStore(pinia)
    const broadcastStore = useBroadcastStore(pinia)
    // prevent duplicate connections
    if (websocket || globalStore.isConnectingToBroadcast) {
      console.info('🌙 websocket connection already in progress or established')
      return
    }
    globalStore.isConnectingToBroadcast = true
    globalStore.isJoiningSpace = true
    // create webocket
    const host = consts.websocketHost()
    console.info('🌜 connecting to websocket:', host)
    websocket = new WebSocket(host)
    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      if (globalStore.isConnectingToBroadcast && !isConnected) {
        console.warn('🌌 websocket connection attempt timed out')
        globalStore.isConnectingToBroadcast = false
        if (!websocket) { return }
        try {
          websocket.close()
        } catch (error) {
          console.error('🚒 error closing timed-out webocket', error)
        }
        websocket = null
      }
    }, 10000)
    // websocket event handlers
    websocket.onopen = (event) => {
      console.info('🌝 websocket connection established')
      clearTimeout(connectionTimeout)
      isConnected = true
      globalStore.isConnectingToBroadcast = false
      broadcastStore.joinSpaceRoom()
    }
    websocket.onclose = (event) => {
      console.warn('🌚 websocket connection closed', event.code)
      isConnected = false
      globalStore.isJoiningSpace = true
      websocket = null
      // Only reconnect on unexpected closures
      if (event.code !== 1000 && !globalStore.isConnectingToBroadcast) {
        setTimeout(() => {
          broadcastStore.reconnect()
        }, 1000) // Delay reconnect to prevent rapid cycles
      }
    }
    websocket.onerror = (event) => {
      const shouldPrevent = checkIfShouldPreventBroadcast(pinia)
      console.warn('🌌 websocket error', event, shouldPrevent)
      if (shouldPrevent) {
        globalStore.isConnectingToBroadcast = false
        return
      }
      globalStore.isConnectingToBroadcast = true
    }

    // 🌜 Receive

    websocket.onmessage = ({ data }) => {
      try {
        data = JSON.parse(data)
        // ignore messages from self
        if (data.clientId === clientId) {
          return
        }
        // validate space messages
        if (data.spaceId) {
          if (data.spaceId !== spaceStore.id) { return }
        }
        receiveMessage(pinia, data)
      } catch (error) {
        console.error('Error processing WebSocket message:', error, data)
      }
    }
  }

  const receiveMessage = (pinia, data) => {
    const globalStore = useGlobalStore(pinia)
    const spaceStore = useSpaceStore(pinia)
    const userStore = useUserStore(pinia)
    const { message, user } = data
    const { name, updates, action } = message
    const store = message.store || 'globalStore'
    const isAction = Boolean(action)
    console.log('♥️♥️♥️', message, user, updates, store, action)
    if (name === 'connected') {
      console.info('🌛 user connected', user)
    } else if (name === 'userJoinedRoom') {
      spaceStore.addUserToJoinedSpace(user)
    } else if (name === 'updateUserPresence') {
      spaceStore.updateUserPresence(updates.user)
      globalStore.updateOtherUsers(updates.user)
    } else if (name === 'userLeftRoom') {
      spaceStore.removeIdleClientFromSpace(user || updates.user)
      globalStore.clearRemoteMultipleSelected(updates)
    } else if (name === 'userLeftSpace') {
      spaceStore.removeCollaboratorFromSpace(updates.user, true)
      if (updates.user.id === userStore.id) {
        spaceStore.removeCurrentUserFromSpace()
      }
    } else if (isAction) {
      updates.isFromBroadcast = true
      const piniaStore = getPiniaStore(store, pinia)
      if (piniaStore) {
        piniaStore[action](updates)
      }
      checkIfShouldUpdateLinkToItem(pinia, { action, updates })
      checkIfShouldNotifyOffscreenCardCreated(pinia, { action, updates })
    } else {
      console.warn('🌚 unhandled message', data)
    }
  }

  // 🌛 Send

  const sendMessage = throttle((pinia, message, type) => {
    const spaceStore = useSpaceStore(pinia)
    const shouldBroadcast = spaceStore.getSpaceShouldBroadcast
    if (!websocket || !isConnected) {
      return
    }
    if (!shouldBroadcast) {
      return
    }
    // send message
    websocket.send(JSON.stringify({
      message,
      clientId,
      spaceId: spaceStore.id
      // user
    }))
  }, 5)
  const broadcastHandler = (pinia, name, args) => {
    const globalStore = useGlobalStore(pinia)
    const broadcastStore = useBroadcastStore(pinia)
    const spaceStore = useSpaceStore(pinia)
    const userStore = useUserStore(pinia)
    const message = args[0]
    switch (name) {
      case 'connect':
        connectToWebsocket(pinia)
        break
      case 'joinSpaceRoom':
        if (!isConnected) {
          // Only attempt to connect if not already connecting
          if (!globalStore.isConnectingToBroadcast && !websocket) {
            console.info('🔄 Not connected, initiating connection')
            broadcastStore.connect()
          } else {
            console.info('🕒 Connection in progress, waiting...')
          }
          return
        }
        joinSpaceRoom(pinia, message)
        break
      case 'leaveSpaceRoom':
        spaceStore.clients = []
        sendMessage(pinia, message)
        break
      case 'update':
        if (userStore.getUserCanEditSpace) {
          sendMessage(pinia, message)
        }
        break
      case 'close':
        closeWebsocket(pinia)
        break
      case 'reconnect':
        console.info('🌚 Manual reconnect requested')
        if (!globalStore.isConnectingToBroadcast) {
          closeWebsocket(pinia)
          isConnected = false
          currentSpaceRoom = null
          // Delay reconnect to prevent rapid cycles
          setTimeout(() => {
            broadcastStore.joinSpaceRoom()
          }, 1000)
        } else {
          console.info('⏭️ Ignoring reconnect - already connecting')
        }
        break
    }
  }

  // Return the Pinia plugin
  return ({ pinia }) => {
    // Get the broadcast store
    const broadcastStore = useBroadcastStore(pinia)
    if (!broadcastStore) {
      console.error('🚒 broadcastStore not found')
      return
    }
    // Subscribe to broadcast store actions
    broadcastStore.$onAction(({ name, args }) => {
      broadcastHandler(pinia, name, args)
    })
  }
}
