// listens and delegates to broadcastStore actions
// connect → join space room → send/receive messages

// 🌛 Send
// 🌜 Receive

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import { nanoid } from 'nanoid'

import utils from '@/utils.js'
import consts from '@/consts.js'

export default function webSocketPlugin () {
  let websocket, currentSpaceRoom, isConnected
  const clientId = nanoid()
  const showDebugMessages = false
  const debugMessageTypes = [
    'updateRemoteUserCursor',
    'addRemotePaintingCircle',
    'clearRemoteCardDetailsVisible',
    'clearRemoteConnectionDetailsVisible',
    'addRemoteDrawingStroke',
    'removeRemoteDrawingStroke'
  ]

  console.info('🌳 websocket client initialized', clientId)

  // join

  const joinSpaceRoom = (pinia, payload) => {
    const globalStore = useGlobalStore(pinia)
    const spaceStore = useSpaceStore(pinia)
    const userStore = useUserStore(pinia)
    const space = utils.spaceMeta(spaceStore.getSpaceAllState)
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
    if (currentSpaceRoom === space.id) {
      console.info('🌙 already in space room', space.id)
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
      console.info('🌙 cannot join space room: space not loaded', space.id)
      globalStore.isJoiningSpace = false
      return
    }
    // Send join message
    currentSpaceRoom = space.id
    websocket.send(JSON.stringify({
      message: 'joinSpaceRoom',
      space,
      user,
      clientId
    }))
    console.info('🌜 joined space room', space.name)
    globalStore.isJoiningSpace = false
  }

  // send

  const sendMessage = (pinia, payload, type) => {
    const spaceStore = useSpaceStore(pinia)
    const shouldBroadcast = spaceStore.getSpaceShouldBroadcast
    if (!websocket || !isConnected) {
      return
    }
    if (!shouldBroadcast) {
      return
    }
    const { message, handler, updates } = utils.normalizeBroadcastUpdates(payload)
    // debug logging
    if (showDebugMessages && !debugMessageTypes.includes(updates.type)) {
      console.info('🌜 sending:', message, handler, updates, { clientId })
    }
    // send message
    const space = utils.spaceMeta(spaceStore.getSpaceAllState)
    websocket.send(JSON.stringify({
      message,
      handler,
      updates,
      clientId,
      space,
      type
    }))
  }

  // check messages

  const checkIfShouldUpdateLinkToItem = (pinia, { message, updates }) => {
    const spaceStore = useSpaceStore(pinia)
    let options
    if (message !== 'updateCard') {
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

  const checkIfShouldNotifyOffscreenCardCreated = (pinia, data) => {
    const globalStore = useGlobalStore(pinia)
    if (data.message === 'createCard') {
      globalStore.triggerNotifyOffscreenCardCreated(data.updates.card)
    }
  }

  const checkIfShouldPreventBroadcast = (pinia) => {
    const spaceStore = useSpaceStore(pinia)
    return !spaceStore.getSpaceIsRemote
  }

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

  const piniaStoreByName = (storeName, pinia) => {
    const globalStore = useGlobalStore(pinia)
    const spaceStore = useSpaceStore(pinia)
    const userStore = useUserStore(pinia)
    if (storeName === 'globalStore') {
      return globalStore
    } else if (storeName === 'spaceStore') {
      return spaceStore
    } else if (storeName === 'userStore') {
      return userStore
    } else {
      return globalStore
    }
  }

  const handleMessage = (pinia, data) => {
    const globalStore = useGlobalStore(pinia)
    const spaceStore = useSpaceStore(pinia)
    const userStore = useUserStore(pinia)
    const { message, handler, user, updates, storeName, actionName } = data
    if (message === 'connected') {
      console.info('🌛 user connected', user)
    // global store actions
    } else if (handler) {
      // TODO replace handler w storename storeaction
      globalStore[handler](updates)
      checkIfShouldUpdateLinkToItem(pinia, data)
      checkIfShouldNotifyOffscreenCardCreated(pinia, data)
    // store actions
    } else if (storeName && actionName) {
      updates.isBroadcast = true
      const piniaStore = piniaStoreByName(storeName, pinia)
      if (piniaStore) {
        piniaStore[actionName](updates)
      }
    } else if (message === 'userJoinedRoom') {
      spaceStore.addUserToJoinedSpace(user)
    } else if (message === 'updateUserPresence') {
      spaceStore.updateUserPresence(updates)
      globalStore.updateOtherUsers(updates.user)
    } else if (message === 'userLeftRoom') {
      spaceStore.removeIdleClientFromSpace(user || updates.user)
      globalStore.clearRemoteMultipleSelected(data)
    } else if (message === 'userLeftSpace') {
      spaceStore.removeCollaboratorFromSpace(updates.user)
      if (updates.user.id === userStore.id) {
        spaceStore.removeCurrentUserFromSpace()
      }
    // global actions
    } else if (data.type === 'store') {
      // TODO remove non store name updates
      // TODO rename to store? are these needed , can be replaced w handlers param?
      globalStore[message](updates)
    // space actions
    } else {
      // TODO remove non store name updates
      spaceStore[message](updates)
    }
  }

  // initialize

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

    // WebSocket event handlers
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

    // Handle incoming messages
    websocket.onmessage = ({ data }) => {
      try {
        data = JSON.parse(data)
        // ignore messages from self
        if (data.clientId === clientId) {
          return
        }
        // debug logs
        if (showDebugMessages && data.message !== 'updateRemoteUserCursor') {
          console.info('🌛 received', data, data.clientId)
        }
        // validate space messages
        if (data.space) {
          if (data.space.id !== spaceStore.id) { return }
        }
        handleMessage(pinia, data)
      } catch (error) {
        console.error('Error processing WebSocket message:', error)
      }
    }
  }

  const broadcastHandler = (pinia, name, args) => {
    const globalStore = useGlobalStore(pinia)
    const broadcastStore = useBroadcastStore(pinia)
    const spaceStore = useSpaceStore(pinia)
    const userStore = useUserStore(pinia)
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
        joinSpaceRoom(pinia, args[0])
        break

      case 'leaveSpaceRoom':
        spaceStore.clients = []
        sendMessage(pinia, args[0])
        break

      case 'update':
        sendMessage(pinia, args[0])
        break

      case 'updateUser':
        sendMessage(pinia, args[0])
        break

      case 'updateStore':
        if (userStore.getUserCanEditSpace) {
          sendMessage(pinia, args[0], 'store')
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
      console.error('❌ Broadcast store not found')
      return
    }

    // Subscribe to broadcast store actions
    broadcastStore.$onAction(({ name, args }) => {
      broadcastHandler(pinia, name, args)
    })
  }
}
