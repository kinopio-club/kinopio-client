import { nextTick } from 'vue'
import { defineStore } from 'pinia'

import { useGlobalStore } from '@/stores/useGlobalStore'
import { useUserStore } from '@/stores/useUserStore'
import { useSpaceStore } from '@/stores/useSpaceStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useThemeStore } from '@/stores/useThemeStore'

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'

import debounce from 'lodash-es/debounce'
import mergeWith from 'lodash-es/mergeWith'
import uniq from 'lodash-es/uniq'
import { nanoid } from 'nanoid'

let sessionQueue = []
const restoreSessionQueue = async () => {
  sessionQueue = await cache.queue()
}
restoreSessionQueue()

let otherItemsQueue
const clearOtherItemsQueue = () => {
  otherItemsQueue = {
    cardIds: [],
    spaceIds: [],
    invites: []
  }
}
clearOtherItemsQueue()

// request handlers

const shouldRequest = ({ shouldRequestRemote, apiKey, isOnline }) => {
  if (utils.isUndefinedOrNull(isOnline)) {
    isOnline = true
  }
  const currentUserIsSignedIn = Boolean(apiKey)
  if (isOnline && shouldRequestRemote) {
    return true
  }
  if (isOnline && currentUserIsSignedIn) {
    return true
  }
}
const normalizeResponse = async (response) => {
  const success = [200, 201, 202, 204]
  if (success.includes(response.status)) {
    const data = await response.json()
    return data
  } else {
    throw { response, status: response.status }
  }
}

// normalize data

const normalizeRemovedCards = (space) => {
  if (!space.removedCards) { return space }
  space.removedCards.forEach(card => {
    card.isRemoved = true
    space.cards.push(card)
  })
  return space
}
const normalizeCollaboratorKey = (space) => {
  if (!space.collaboratorKey) { return }
  if (typeof space.collaboratorKey === 'string') {
    return space.collaboratorKey
  } else {
    return space.collaboratorKey.collaboratorKey
  }
}

export const useApiStore = defineStore('api', {
  actions: {
    handleServerError ({ name, error, shouldNotNotifyUser }) {
      const globalStore = useGlobalStore()
      console.error('🚒 handleServerError', name, error)
      if (!shouldNotNotifyUser) { return }
      globalStore.updateNotifyConnectionError(true)
      globalStore.updateNotifyConnectionErrorName(name)
    },

    // adds auth credentials to fetch options
    requestOptions (options) {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': 'must-revalidate, no-store, no-cache, private'
      })
      const space = options.space || spaceStore.getSpaceAllState
      const collaboratorKey = normalizeCollaboratorKey(space)
      const apiKey = userStore.apiKey
      if (collaboratorKey) {
        headers.append('Space-Authorization', collaboratorKey)
      }
      if (apiKey) {
        headers.append('Authorization', apiKey)
      }
      if (options.spaceReadOnlyKey) {
        headers.append('Read-Only-Authorization', options.spaceReadOnlyKey)
      }
      const requestId = options.requestId || nanoid()
      headers.append('Request-Id', requestId)
      headers.append('User-Id', userStore.id)
      return {
        method: options.method,
        headers,
        body: JSON.stringify(options.body)
      }
    },

    // Queue Operations

    async handleServerOperationsError ({ error, response }) {
      const globalStore = useGlobalStore()
      if (!response) {
        console.error('🚒 handleServerOperationsError', error, response)
        globalStore.updateNotifyServerCouldNotSave(true)
        return
      }
      const data = await response.json()
      const operations = data.operations
      console.warn('🚑 serverOperationsError', data)
      const nonCriticalErrorStatusCodes = [400, 401, 404]
      operations.forEach(operation => {
        const error = operation.error
        if (!error) { return }
        const isCritical = !nonCriticalErrorStatusCodes.includes(error.status)
        if (isCritical) {
          console.error('🚒 critical serverOperationsError operation', operation)
          globalStore.updateNotifyServerCouldNotSave(true)
        } else {
          console.warn('🚑 non-critical serverOperationsError operation', operation)
        }
        // globalStore.moveFailedSendingQueueOperationBackIntoQueue(operation)
      })
      globalStore.clearSendingQueue()
    },
    async sendQueue () {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const globalStore = useGlobalStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      const queue = utils.clone(sessionQueue)
      await cache.saveQueue(queue)
      if (!shouldRequest({ apiKey, isOnline }) || !queue.length) { return } // offline check
      // empty queue into sendingQueue
      globalStore.sendingQueue = queue
      sessionQueue = []
      cache.clearQueue()
      // send
      let response
      try {
        const requestId = nanoid()
        console.warn('🛫 sending operations', queue, `●requestId=${requestId}`)
        if (!spaceStore.id) { throw 'operation missing spaceId' }
        const options = await this.requestOptions({ body: queue, method: 'POST', requestId })
        response = await fetch(`${consts.apiHost()}/operations`, options)
        if (response.ok) {
          console.info('🛬 operations ok', queue)
          globalStore.clearSendingQueue()
        } else {
          throw response.statusText
        }
        if (globalStore.notifyServerCouldNotSave) {
          globalStore.addNotification({ message: 'Reconnected to server', type: 'success' })
        }
      } catch (error) {
        console.error('🚑 sendQueue', error)
        // move failed sendingQueue operations back into queue
        this.handleServerOperationsError({ error, response })
      }
    },

    debouncedSendQueue: debounce(function () {
      this.sendQueue()
    }, 500),

    async addToQueue ({ name, body, spaceId }) {
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      if (!userStore.getUserCanEditSpace) { return }
      body = utils.clone(body)
      body.operationId = nanoid()
      body.spaceId = spaceId || spaceStore.id
      body.userId = userStore.id
      body.clientCreatedAt = new Date()
      const isSignedIn = userStore.getUserIsSignedIn
      if (!isSignedIn) { return }
      const newItem = {
        name,
        body
      }
      // try to to merge new item into matching prev one
      const cumulativeDeltaOperations = ['updateUserCardsCreatedCount', 'updateUserCardsCreatedCountRaw']
      const shouldNotMergeOperations = ['createCard', 'createBox', 'createConnection', 'createDrawingStroke', 'removeDrawingStroke']
      let isPrevItem
      const newQueue = sessionQueue.map(prevItem => {
        const isOperationName = prevItem.name === newItem.name
        const isOperationDelta = cumulativeDeltaOperations.includes(newItem.name)
        const isItemId = prevItem.body.id === newItem.body.id
        const shouldIncrement = isOperationName && isOperationDelta
        const shouldMerge = isOperationName && isItemId && !shouldNotMergeOperations.includes(newItem.name)
        if (shouldIncrement) {
          newItem.body.delta += prevItem.body.delta
          return newItem
        } else if (shouldMerge) {
          isPrevItem = true
          newItem.body = { ...prevItem.body, ...newItem.body } // { a: 1, b: 2 }, { a: 1, b: 3, c:2 } → { a: 1, b: 3, c:2 }
          return newItem
        } else {
          return prevItem
        }
      })
      // if no matching prev item, add new item to the queue
      if (!isPrevItem) {
        newQueue.push(newItem)
      }
      sessionQueue = newQueue
      this.debouncedSendQueue()
    },

    // Meta

    async getStatus () {
      try {
        const response = await fetch(`${consts.apiHost()}/`)
        return normalizeResponse(response)
      } catch (error) {
        console.info('🚒 getStatus', error)
        return false
      }
    },
    async getDate () {
      try {
        const response = await fetch(`${consts.apiHost()}/meta/date`)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getDate', error })
      }
    },
    async getChangelog () {
      const globalStore = useGlobalStore()
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ shouldRequestRemote: true, isOnline })) { return }
      const isSpacePage = globalStore.getIsSpacePage
      if (!isSpacePage) { return }
      try {
        const response = await fetch(`${consts.apiHost()}/meta/changelog`)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getChangelog', error })
      }
    },
    async updateDateImage () {
      const globalStore = useGlobalStore()
      try {
        const response = await fetch(`${consts.apiHost()}/space/date-image`)
        const data = await normalizeResponse(response)
        globalStore.dateImageUrl = data.url
        return data.url
      } catch (error) {
        this.handleServerError({ name: 'updateDateImage', error })
      }
    },
    async getEmojis () {
      try {
        const response = await fetch(`${consts.apiHost()}/meta/emojis`)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getEmojis', error })
      }
    },

    // Session Token (sign up spam mitigation)

    async createSessionToken (token) {
      const body = { token }
      const options = await this.requestOptions({ body, method: 'POST' })
      return fetch(`${consts.apiHost()}/session-token/create`, options)
    },

    // Sign Up or In

    async signUp ({ email, password, currentUser, sessionToken }) {
      const body = currentUser
      body.email = email
      body.password = password
      body.sessionToken = sessionToken
      const options = await this.requestOptions({ body, method: 'POST' })
      return fetch(`${consts.apiHost()}/user/sign-up`, options)
    },
    async signIn ({ email, password }) {
      const body = {
        email,
        password
      }
      const options = await this.requestOptions({ body, method: 'POST' })
      return fetch(`${consts.apiHost()}/user/sign-in`, options)
    },
    async resetPassword (email) {
      const body = { email }
      const options = await this.requestOptions({ body, method: 'POST' })
      return fetch(`${consts.apiHost()}/user/reset-password`, options)
    },
    async updatePassword ({ password, apiKey }) {
      const body = { password, apiKey }
      const options = await this.requestOptions({ body, method: 'PATCH', apiKey })
      return fetch(`${consts.apiHost()}/user/update-password`, options)
    },
    async updateEmail (email) {
      const body = { email }
      const options = await this.requestOptions({ body, method: 'PATCH' })
      return fetch(`${consts.apiHost()}/user/update-email`, options)
    },

    // User

    async getUser () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getUser', error })
      }
    },
    async getUserFavoriteSpaces () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/favorite-spaces`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getUserFavoriteSpaces', error })
      }
    },
    async getUserFavoriteUsers () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/favorite-users`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getUserFavoriteUsers', error })
      }
    },
    async getUserFavoriteColors () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/favorite-colors`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getUserFavoriteUsers', error })
      }
    },
    async getUserHiddenSpaces () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/hidden-spaces`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getUserHiddenSpaces', error })
      }
    },
    async getFollowingUsersSpaces () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isSpacePage = globalStore.getIsSpacePage
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      if (!isSpacePage) { return }
      try {
        console.info('🛬 getting following users spaces')
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/favorite-users-spaces`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getFollowingUsersSpaces', error })
      }
    },
    async getUserSpaces () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/spaces`, options)
        const currentUser = userStore
        const spaces = await normalizeResponse(response)
        return utils.addCurrentUserIsCollaboratorToSpaces(spaces, currentUser)
      } catch (error) {
        this.handleServerError({ name: 'getUserSpaces', error })
      }
    },
    async getUserGroupSpaces () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const groupStore = useGroupStore()
      const groups = groupStore.getCurrentUserGroups
      if (!groups.length) { return }
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/group-spaces`, options)
        const currentUser = userStore
        const spaces = await normalizeResponse(response)
        return utils.addCurrentUserIsCollaboratorToSpaces(spaces, currentUser)
      } catch (error) {
        this.handleServerError({ name: 'getUserGroupSpaces', error })
      }
    },
    async getUserRemovedSpaces () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/removed-spaces`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getUserRemovedSpaces', error })
      }
    },
    async getUserInboxSpace () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/inbox-space`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getUserInboxSpace', error })
      }
    },
    async getSpacesNotificationUnsubscribed () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/spaces-notification-unsubscribed`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getSpacesNotificationUnsubscribed', error })
      }
    },
    async getGroupsNotificationUnsubscribed () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/groups-notification-unsubscribed`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getGroupsNotificationUnsubscribed', error })
      }
    },
    async spaceNotificationResubscribe (space) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const user = userStore
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/space/${space.id}/notification-resubscribe?userId=${user.id}`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'spaceNotificationResubscribe', error })
      }
    },
    async groupNotificationResubscribe (group) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const user = userStore
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/group/${group.id}/notification-resubscribe?userId=${user.id}`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'groupNotificationResubscribe', error })
      }
    },
    async deleteUserPermanent () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'DELETE' })
        const response = await fetch(`${consts.apiHost()}/user/permanent`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'deleteUserPermanent', error })
      }
    },
    async getPublicUser (user) {
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/public/${user.id}`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getPublicUser', error })
      }
    },
    async getPublicUsers (userIds) {
      const max = 60
      try {
        userIds = userIds.slice(0, max)
        userIds = userIds.join(',')
        if (!userIds) { return }
        console.info('🛬🛬 getting remote public users', userIds)
        const options = await this.requestOptions({ method: 'GET' })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/user/public/multiple?userIds=${userIds}`, options))
        // notifyConnectionError
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getPublicUsers', error })
      }
    },
    async getPublicUserExploreSpaces (user) {
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/public/explore-spaces/${user.id}`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getPublicUserExploreSpaces', error })
      }
    },
    async updateUserFavorites (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'PATCH' })
        const response = await fetch(`${consts.apiHost()}/user/favorites`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'updateUserFavorites', error, shouldNotNotifyUser: true })
      }
    },

    // Space

    async getExploreSpaces () {
      const globalStore = useGlobalStore()
      const isSpacePage = globalStore.getIsSpacePage
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ shouldRequestRemote: true, isOnline })) { return }
      if (!isSpacePage) { return }
      try {
        console.info('🛬 getting explore spaces')
        const options = await this.requestOptions({ method: 'GET' })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/explore-spaces`, options))
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getExploreSpaces', error })
      }
    },

    async getEveryoneSpaces () {
      const globalStore = useGlobalStore()
      const isSpacePage = globalStore.getIsSpacePage
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ shouldRequestRemote: true, isOnline })) { return }
      if (!isSpacePage) { return }
      try {
        console.info('🛬 getting everyone spaces')
        const options = await this.requestOptions({ method: 'GET' })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/everyone-spaces`, options))
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getEveryoneSpaces', error })
      }
    },
    async getLiveSpaces () {
      const globalStore = useGlobalStore()
      const isSpacePage = globalStore.getIsSpacePage
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ shouldRequestRemote: true, isOnline })) { return }
      if (!isSpacePage) { return }
      try {
        console.info('🛬 getting live spaces')
        const options = await this.requestOptions({ method: 'GET' })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/live-spaces`, options))
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getLiveSpaces', error })
      }
    },
    async getSpace ({ space, shouldRequestRemote, spaceReadOnlyKey }) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      try {
        const apiKey = userStore.apiKey
        const isOnline = globalStore.isOnline
        if (!shouldRequest({ shouldRequestRemote, apiKey, isOnline })) { return }
        const spaceReadOnlyKey = spaceStore.getSpaceReadOnlyKey(space)
        console.info('🛬 getting remote space', space.id)
        const options = await this.requestOptions({ method: 'GET', space, spaceReadOnlyKey })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/${space.id}`, options))
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getSpace', error })
      }
    },
    async getSpaceUpdatedAt (space) {
      const globalStore = useGlobalStore()
      try {
        const isOnline = globalStore.isOnline
        if (!isOnline) { return }
        // console.info('🛬 getting remote space updatedAt', space.id)
        const options = await this.requestOptions({ method: 'GET' })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/updated-at/${space.id}`, options))
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getSpace', error })
      }
    },
    async getSpaceFavorites () {
      const globalStore = useGlobalStore()
      const spaceStore = useSpaceStore()
      try {
        const isOnline = globalStore.isOnline
        if (!isOnline) { return }
        const spaceId = spaceStore.id
        console.info('🛬 getting remote space favorites', spaceId)
        const options = await this.requestOptions({ method: 'GET' })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/${spaceId}/favorites`, options))
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getSpaceFavorites', error })
      }
    },
    async getSpaceHistory () {
      const globalStore = useGlobalStore()
      const spaceStore = useSpaceStore()
      try {
        const isOnline = globalStore.isOnline
        if (!isOnline) { return }
        const spaceId = spaceStore.id
        console.info('🛬 getting remote space history', spaceId)
        const options = await this.requestOptions({ method: 'GET' })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/${spaceId}/history`, options))
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getSpaceFavorites', error })
      }
    },
    async getSpaceAnonymously (space) {
      const globalStore = useGlobalStore()
      const spaceStore = useSpaceStore()
      const isOnline = globalStore.isOnline
      if (!isOnline) { return }
      const invitedSpaces = await cache.invitedSpaces()
      const invite = invitedSpaces.find(invitedSpace => invitedSpace.id === space.id) || {}
      space.collaboratorKey = space.collaboratorKey || invite.collaboratorKey
      const spaceReadOnlyKey = spaceStore.getSpaceReadOnlyKey(space)
      try {
        console.info('🛬 getting remote space anonymously', space.id, space.collaboratorKey, spaceReadOnlyKey)
        const options = await this.requestOptions({ method: 'GET', space, spaceReadOnlyKey })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/${space.id}`, options))
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getSpaceAnonymously', error })
      }
    },
    async getInboxSpace () {
      try {
        console.info('🛬 getting inbox space')
        const options = await this.requestOptions({ method: 'GET' })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/inbox`, options))
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getInboxSpace', error })
      }
    },
    async searchExploreSpaces (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/space/search-explore-spaces`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'search', error })
      }
    },
    async createSpaces () {
      const userStore = useUserStore()
      try {
        let spaces = await cache.getAllSpaces()
        if (!spaces.length) { return }
        const drawingImages = []
        spaces = spaces.map(space => {
          space = normalizeRemovedCards(space)
          if (space.drawingImage) {
            drawingImages.push({
              spaceId: space.id,
              dataUrl: space.drawingImage
            })
            delete space.drawingImage
          }
          return space
        })
        let removedSpaces = await cache.getAllRemovedSpaces()
        removedSpaces = removedSpaces.map(space => {
          space.isRemoved = true
          space.removedByUserId = userStore.id
          delete space.drawingImage
          return space
        })
        removedSpaces.forEach(space => spaces.push(space))
        spaces = spaces.filter(space => space)
        const options = await this.requestOptions({ body: spaces, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/space/multiple`, options)
        // upload drawing images
        for (const body of drawingImages) {
          const isDataUrl = body.dataUrl.startsWith('data:')
          if (!isDataUrl) { continue }
          try {
            const imageOptions = await this.requestOptions({ body, method: 'POST', space: { id: body.spaceId } })
            const imageResponse = await fetch(`${consts.apiHost()}/space/drawing-image`, imageOptions)
            const imageData = await imageResponse.json()
          } catch (error) {
            console.error('🚒 createSpaces', error, body.dataUrl)
          }
        }
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'createSpaces', error })
      }
    },
    async createSpace (space) {
      try {
        space = normalizeRemovedCards(space)
        const body = space
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/space`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'createSpace', error })
      }
    },
    async updateSpacePreviewImage (spaceId) {
      const spaceStore = useSpaceStore()
      const themeStore = useThemeStore()
      try {
        spaceId = spaceId || spaceStore.id
        const themeOptions = themeStore.previewImageThemeOptions()
        const body = { spaceId, themeOptions }
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/space/preview-image`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'updateSpacePreviewImage', error, shouldNotNotifyUser: false })
      }
    },
    async updateSpace (space) {
      try {
        const body = space
        const options = await this.requestOptions({ body, method: 'PATCH', space })
        const response = await fetch(`${consts.apiHost()}/space`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'updateSpace', error })
      }
    },
    async getSpaceRemovedCards (space) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/space/${space.id}/removed-cards`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getSpaceRemovedCards', error })
      }
    },
    async getSpaceCollaboratorKey (space) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/space/${space.id}/collaborator-key`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getSpaceCollaboratorKey', error })
      }
    },
    async addSpaceCollaborator ({ spaceId, collaboratorKey }) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      const userId = userStore.id
      try {
        const body = { userId, spaceId, collaboratorKey }
        const space = { id: spaceId, collaboratorKey }
        const options = await this.requestOptions({ body, method: 'PATCH', space })
        const response = await fetch(`${consts.apiHost()}/space/collaborator`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'addSpaceCollaborator', error })
      }
    },
    async removeSpaceCollaborator ({ space, user }) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const spaceStore = useSpaceStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const body = {
          spaceId: space.id,
          userId: user.id
        }
        const options = await this.requestOptions({ body, method: 'DELETE' })
        const response = await fetch(`${consts.apiHost()}/space/collaborator`, options)
        const data = await normalizeResponse(response)
        const collaboratorKey = data.collaboratorKey
        spaceStore.updateSpace({ collaboratorKey })
      } catch (error) {
        this.handleServerError({ name: 'removeSpaceCollaborator', error })
      }
    },
    async restoreRemovedSpace (space) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'PATCH' })
        const response = await fetch(`${consts.apiHost()}/space/restore/${space.id}`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'restoreRemovedSpace', error })
      }
    },
    async sendSpaceInviteEmails (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/space/email-invites/${body.spaceId}`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'sendSpaceInviteEmails', error })
      }
    },

    // Other Items Queue

    async addToGetOtherItemsQueue ({ cardIds, spaceIds, invites }) {
      const globalStore = useGlobalStore()
      const isOnline = globalStore.isOnline
      if (!isOnline) { return }
      otherItemsQueue = {
        cardIds: uniq(otherItemsQueue.cardIds.concat(cardIds)),
        spaceIds: uniq(otherItemsQueue.spaceIds.concat(spaceIds)),
        invites: uniq(otherItemsQueue.invites.concat(invites))
      }
      this.debouncedSendOtherItemsQueue()
    },

    debouncedSendOtherItemsQueue: debounce(async function () {
      this.sendOtherItemsQueue()
    }, 500),

    // Get Other Items Queue

    async sendOtherItemsQueue () {
      const globalStore = useGlobalStore()
      globalStore.isLoadingOtherItems = true
      const { cardIds, spaceIds, invites } = otherItemsQueue
      clearOtherItemsQueue()
      const body = { cardIds, spaceIds, invites }
      try {
        console.info('🛬🛬 getting remote other items', { cardIds, spaceIds, invites })
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/item/multiple`, options))
        const data = await normalizeResponse(response)
        globalStore.updateOtherItems(data)
      } catch (error) {
        this.handleServerError({ name: 'getSpaces', error })
      }
      clearOtherItemsQueue()
      globalStore.isLoadingOtherItems = false
    },

    // Card

    async getCardsWithLinkToSpaceId (spaceId) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/card/by-link-to-space/${spaceId}`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getCardsWithLinkToSpaceId', error })
      }
    },
    async updateCards (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'PATCH' })
        const response = await fetch(`${consts.apiHost()}/card/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'updateCards', error })
      }
    },
    async createCards (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/card/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'createCards', error })
      }
    },
    async createCard (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/card`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'createCard', error })
      }
    },
    async createCardInInbox (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/card/to-inbox`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'createCardInInbox', error })
      }
    },
    async searchCards (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/card/search`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'search', error })
      }
    },
    async updateCardCounter (body) {
      try {
        const options = await this.requestOptions({ body, method: 'PATCH' })
        const response = await fetch(`${consts.apiHost()}/card/update-counter`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'update-counter', error })
      }
    },
    async updateUrlPreviewImage (body) {
      try {
        const options = await this.requestOptions({ body, method: 'PATCH' })
        const response = await fetch(`${consts.apiHost()}/card/update-url-preview-image`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'update-counter', error })
      }
    },

    // ConnectionType

    async updateConnectionTypes (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'PATCH' })
        const response = await fetch(`${consts.apiHost()}/connection-type/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'updateConnectionTypes', error })
      }
    },
    async createConnectionTypes (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/connection-type/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'createConnectionTypes', error })
      }
    },

    // Connection

    async updateConnections (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'PATCH' })
        const response = await fetch(`${consts.apiHost()}/connection/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'updateConnections', error })
      }
    },
    async createConnections (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/connection/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'createConnections', error })
      }
    },

    // Boxes

    async createBoxes (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/box/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'createBoxes', error })
      }
    },

    // Tag

    async getCardsWithTag (name) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      name = encodeURI(name)
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/card/by-tag-name/${name}`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getCardsWithTag', error })
      }
    },
    async getUserTags (removeUnusedTags) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return [] }
      try {
        let params = ''
        if (removeUnusedTags) {
          params = '?removeUnusedTags=true'
        }
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/tags${params}`, options)
        return normalizeResponse(response) || []
      } catch (error) {
        this.handleServerError({ name: 'getUserTags', error })
      }
    },
    // async updateUserTagsColor (tag) {
    // const apiKey = userStore.apiKey
    //   if (!shouldRequest({apiKey})) { return }
    //   try {
    //     const options = await this.requestOptions({ method: 'PATCH', tag })
    //     const response = await fetch(`${consts.apiHost()}/tags/color`, options)
    //     return normalizeResponse(response)
    //   } catch (error) {
    //     console.error('🚒 updateUserTagsColor', error)
    //   }
    // },

    // Billing Stripe

    async checkoutUrl (body) {
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/billing/stripe/checkout-url`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'subscriptionUrl', error })
      }
    },
    async subscriptionUrl (body) {
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/billing/stripe/subscription-url`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'subscriptionUrl', error })
      }
    },
    async customerPortalUrl (body) {
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/billing/stripe/customer-portal-url`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'customerPortalUrl', error })
      }
    },
    async donationUrl (body) {
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/billing/stripe/donation-url`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'donationUrl', error })
      }
    },

    // Upload

    async createPresignedPost (body) {
      const spaceStore = useSpaceStore()
      try {
        body.requestSpaceId = spaceStore.id
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/upload/presigned-post`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'createPresignedPost', error })
      }
    },
    async createMultiplePresignedPosts (body) {
      const spaceStore = useSpaceStore()
      try {
        body.requestSpaceId = spaceStore.id
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/upload/presigned-post/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'createMultiplePresignedPosts', error })
      }
    },

    // Notifications

    async getNotifications () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/notification`, options)
        const notifications = await normalizeResponse(response)
        console.log('🛤️🛤️getNotifications', response, notifications)

        return notifications
      } catch (error) {
        this.handleServerError({ name: 'getNotifications', error })
      }
    },
    async deleteAllNotifications () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'DELETE' })
        const response = await fetch(`${consts.apiHost()}/notification/all`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'deleteGroupPermanent', error })
      }
    },

    // Services

    async updateArenaAccessToken (arenaReturnedCode) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      try {
        const currentUserIsSignedIn = userStore.getUserIsSignedIn
        let userId
        if (currentUserIsSignedIn) {
          userId = userStore.id
        }
        const body = {
          userId,
          arenaReturnedCode
        }
        const options = await this.requestOptions({ body, method: 'PATCH' })
        const response = await fetch(`${consts.apiHost()}/user/update-arena-access-token`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒 updateArenaAccessToken', error)
        globalStore.triggerArenaAuthenticationError()
        globalStore.isAuthenticatingWithArena = false
      }
    },
    async urlPreview ({ url, card }) {
      try {
        const body = { url, card }
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/services/url-preview`, options)
        if (response.status !== 200) {
          throw new Error(response.status)
        }
        const data = await normalizeResponse(response)
        return { url, data, response }
      } catch (error) {
        this.handleServerError({ name: 'urlPreview', error })
      }
    },
    async imageSearch (search) {
      try {
        const body = { search }
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/services/image-search`, options)
        const data = await normalizeResponse(response)
        return data
      } catch (error) {
        this.handleServerError({ name: 'imageSearch', error })
      }
    },
    async gifImageSearch (body) {
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/services/gif-image-search`, options)
        const data = await normalizeResponse(response)
        return data
      } catch (error) {
        this.handleServerError({ name: 'imageSearch', error })
      }
    },
    async communityBackgrounds () {
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/services/community-backgrounds`, options)
        const data = await normalizeResponse(response)
        return data
      } catch (error) {
        console.error('🚒 communityBackgrounds', error)
      }
    },
    async pdf () {
      const spaceStore = useSpaceStore()
      const spaceId = spaceStore.id
      try {
        const options = await this.requestOptions({ method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/services/pdf/${spaceId}`, options)
        let url = await normalizeResponse(response)
        url = url.url
        return url
      } catch (error) {
        this.handleServerError({ name: 'pdf', error })
      }
    },
    async generateSpace (prompt) {
      try {
        const body = { prompt }
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/services/generate-space`, options)
        const data = await normalizeResponse(response)
        return data
      } catch (error) {
        console.error('🚒 generateSpace', error)
        throw new Error(error)
      }
    },

    // Downloads

    async downloadAllSpaces () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/space/download-all`, options)
        return response.blob()
      } catch (error) {
        this.handleServerError({ name: 'downloadAllSpaces', error })
      }
    },

    // Group

    async getUserGroups () {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        globalStore.isLoadingGroups = true
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/user/groups`, options)
        globalStore.isLoadingGroups = false
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getUserGroups', error })
      }
      globalStore.isLoadingGroups = false
    },
    async getGroup (groupId) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        console.info('🛬 getting remote group', groupId)
        const options = await this.requestOptions({ method: 'GET' })
        const response = await fetch(`${consts.apiHost()}/group/${groupId}`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'getGroup', error })
      }
    },
    async createGroup (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/group/`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'createGroup', error })
      }
    },
    async createGroupUser (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'POST' })
        const response = await fetch(`${consts.apiHost()}/group/group-user`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'createGroupUser', error })
      }
    },
    async removeGroupUser (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'DELETE' })
        const response = await fetch(`${consts.apiHost()}/group/group-user`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'removeGroupUser', error })
      }
    },
    async deleteGroupPermanent (body) {
      const globalStore = useGlobalStore()
      const userStore = useUserStore()
      const apiKey = userStore.apiKey
      const isOnline = globalStore.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await this.requestOptions({ body, method: 'DELETE' })
        const response = await fetch(`${consts.apiHost()}/group/`, options)
        return normalizeResponse(response)
      } catch (error) {
        this.handleServerError({ name: 'deleteGroupPermanent', error })
      }
    },
    async sendAnalyticsEvent (body) {
      try {
        const headers = new Headers({
          'Content-Type': 'application/json'
        })
        const response = await fetch(`${consts.apiHost()}/services/analytics-event`, {
          headers,
          method: 'POST',
          body: JSON.stringify(body)
        })
      } catch (error) {
        console.error('🚒 sendAnalyticsEvent', error)
      }
    }
  }
})
