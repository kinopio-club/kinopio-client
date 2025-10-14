// Space-scoped WebSocket controller
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
import { useCardStore } from '@/stores/useCardStore'
import { useBoxStore } from '@/stores/useBoxStore'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useBroadcastStore } from '@/stores/useBroadcastStore'

import { nanoid } from 'nanoid'
import throttle from 'lodash-es/throttle'
import debounce from 'lodash-es/debounce'

import utils from '@/utils.js'
import consts from '@/consts.js'

export default function SpaceWebsockets () {
  let websocket, currentSpaceRoom, isConnected
  const clientId = nanoid()
  let broadcastUnsubscribe

  console.info('🌳 websocket client initialized', clientId)

  const getPiniaStore = (store) => {
    const globalStore = useGlobalStore()
    const spaceStore = useSpaceStore()
    const userStore = useUserStore()
    const cardStore = useCardStore()
    const boxStore = useBoxStore()
    const connectionStore = useConnectionStore()
    if (store === 'globalStore') {
      return globalStore
    } else if (store === 'spaceStore') {
      return spaceStore
    } else if (store === 'userStore') {
      return userStore
    } else if (store === 'cardStore') {
      return cardStore
    } else if (store === 'boxStore') {
      return boxStore
    } else if (store === 'connectionStore') {
      return connectionStore
    } else {
      return globalStore
    }
  }

  // join

  const joinSpaceRoom = (payload) => {
    const globalStore = useGlobalStore()
    const spaceStore = useSpaceStore()
    const userStore = useUserStore()
    const spaceId = spaceStore.id
    const user = userStore.getUserPublicMeta
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
  // Delay reconnect to prevent rapid cycles
  const reconnectDebounce = debounce(() => {
    const broadcastStore = useBroadcastStore()
    broadcastStore.reconnect()
  }, 1000)

  // leave

  const closeWebsocket = () => {
    const globalStore = useGlobalStore()
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

  const checkIfShouldUpdateLinkToItem = ({ action, updates }) => {
    const spaceStore = useSpaceStore()
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
  const checkIfShouldNotifyOffscreenCardCreated = ({ action, updates }) => {
    const globalStore = useGlobalStore()
    if (action === 'createCard') {
      globalStore.triggerNotifyOffscreenCardCreated(updates)
    }
  }
  const checkIfShouldPreventBroadcast = () => {
    const spaceStore = useSpaceStore()
    return !spaceStore.getSpaceIsRemote
  }

  // init

  const connectToWebsocket = () => {
    const globalStore = useGlobalStore()
    const spaceStore = useSpaceStore()
    const userStore = useUserStore()
    const broadcastStore = useBroadcastStore()
    // prevent duplicate connections
    if (websocket || globalStore.isConnectingToBroadcast) {
      // console.info('🌙 websocket connection already in progress or established')
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
      console.warn('🌚 websocket connection closed', event.code, globalStore.isConnectingToBroadcast)
      isConnected = false
      globalStore.isJoiningSpace = true
      websocket = null
      // Only reconnect on unexpected closures
      if (event.code === 1000) { return }
      reconnectDebounce()
    }
    websocket.onerror = (event) => {
      const shouldPrevent = checkIfShouldPreventBroadcast()
      console.warn('🌌 websocket error', event, shouldPrevent)
      // reconnect on error
      globalStore.isConnectingToBroadcast = false
      if (shouldPrevent) { return }
      reconnectDebounce()
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
        receiveMessage(data)
      } catch (error) {
        console.error('Error processing WebSocket message:', error, data)
      }
    }
  }

  const receiveMessage = (data) => {
    const globalStore = useGlobalStore()
    const spaceStore = useSpaceStore()
    const userStore = useUserStore()
    const { message, user } = data
    const { name, updates = {}, action } = message
    updates.user = user
    const store = message.store || 'globalStore'
    const isAction = Boolean(action)
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
    } else if (name === 'updateSpaceClients') {
      spaceStore.updateSpaceClients()
    } else if (isAction) {
      updates.isFromBroadcast = true
      const piniaStore = getPiniaStore(store)
      if (piniaStore) {
        piniaStore[action](updates)
      }
      checkIfShouldUpdateLinkToItem({ action, updates })
      checkIfShouldNotifyOffscreenCardCreated({ action, updates })
    } else {
      console.warn('🌚 unhandled message', data)
    }
  }

  // 🌛 Send

  let sentActions, pendingMessages
  const sendMessageThrottle = throttle(() => {
    if (!websocket) { return }
    if (pendingMessages?.length) {
      pendingMessages.forEach(data => {
        websocket.send(JSON.stringify(data))
      })
      pendingMessages = []
      sentActions.clear()
    }
  }, 16) // 60fps
  const sendMessage = (message, type) => {
    const spaceStore = useSpaceStore()
    const userStore = useUserStore()
    if (!websocket || !isConnected) {
      return
    }
    if (!sentActions) {
      sentActions = new Set()
      sendMessageThrottle()
    }
    const data = {
      message,
      clientId,
      spaceId: spaceStore.id,
      user: userStore.getUserPublicMeta
    }
    if (message.action) {
      // only send unique actions per frame
      if (sentActions.has(message.action)) { return }
      sentActions.add(message.action)
      pendingMessages = pendingMessages || []
      pendingMessages.push(data)
      sendMessageThrottle()
    } else {
      websocket.send(JSON.stringify(data))
    }
  }

  // watch broadcastStore

  const broadcastHandler = (name, args) => {
    const globalStore = useGlobalStore()
    const broadcastStore = useBroadcastStore()
    const spaceStore = useSpaceStore()
    const userStore = useUserStore()
    if (!globalStore.isSpacePage) { return }
    const message = args[0]
    switch (name) {
      case 'connect':
        connectToWebsocket()
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
        joinSpaceRoom(message)
        break
      case 'leaveSpaceRoom':
        spaceStore.clients = []
        sendMessage(message)
        break
      case 'update':
        sendMessage(message)
        break
      case 'close':
        closeWebsocket()
        break
      case 'reconnect':
        console.info('🌚 Manual reconnect requested')
        if (!globalStore.isConnectingToBroadcast) {
          closeWebsocket()
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

  // Initialize - subscribe to broadcast store actions
  const broadcastStore = useBroadcastStore()
  if (!broadcastStore) {
    console.error('🚒 broadcastStore not found')
    return
  }

  // eslint-disable-next-line prefer-const
  broadcastUnsubscribe = broadcastStore.$onAction(({ name, args }) => {
    broadcastHandler(name, args)
  })

  // Connect immediately
  connectToWebsocket()

  // Return controller interface
  return {
    close: () => {
      console.info('🌳 SpaceWebsockets controller closing')
      if (broadcastUnsubscribe) {
        broadcastUnsubscribe()
      }
      closeWebsocket()
      currentSpaceRoom = null
      isConnected = false
    },
    reconnect: () => {
      const broadcastStore = useBroadcastStore()
      broadcastStore.reconnect()
    }
  }
}
