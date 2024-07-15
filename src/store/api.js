import cache from '@/cache.js'
import utils from '@/utils.js'
import consts from '@/consts.js'

import debounce from 'lodash-es/debounce'
import merge from 'lodash-es/merge'
import uniq from 'lodash-es/uniq'
import { nanoid } from 'nanoid'

const squashCardsCreatedCount = (queue, request, isRaw) => {
  let isSquashed
  let name = 'updateUserCardsCreatedCount'
  if (isRaw) {
    name = 'updateUserCardsCreatedCountRaw'
  }
  queue = queue.map(queueItem => {
    if (queueItem.name === name) {
      queueItem.body.delta += request.body.delta
      isSquashed = true
    }
    return queueItem
  })
  if (!isSquashed) {
    queue.push(request)
  }
  return queue
}

const sortQueueItems = (queue) => {
  // sort create connectiontype operations first
  let createConnectionTypes = []
  queue = queue.filter(request => {
    if (request.name === 'createConnectionType') {
      createConnectionTypes.push(request)
    } else {
      return true
    }
  })
  queue = createConnectionTypes.concat(queue)
  // sort createCard operations first
  let createCards = []
  queue = queue.filter(request => {
    if (request.name === 'createCard') {
      createCards.push(request)
    } else {
      return true
    }
  })
  queue = createCards.concat(queue)
  return queue
}

const squashQueue = (queue) => {
  let squashed = []
  queue.forEach(request => {
    // check if request has already been squashed
    const isSquashed = squashed.find(queueItem => {
      return queueItem.name === request.name && queueItem.body.id === request.body.id
    })
    if (isSquashed) { return }
    // merge queue items with the same operation name and matching entity id
    const matches = queue.filter(queueItem => {
      return queueItem.name === request.name && queueItem.body.id === request.body.id
    })
    const reduced = matches.reduce((accumulator, currentValue) => merge(accumulator, currentValue))
    reduced.name = request.name
    squashed.push(reduced)
  })
  squashed = sortQueueItems(squashed)
  return squashed
}

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

const normalizeSpaceToRemote = (space) => {
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

const self = {
  namespaced: true,
  state: {},
  mutations: {},
  actions: {

    handleServerError: (context, { name, error, shouldNotNotifyUser }) => {
      console.error('🚒 handleServerError', name, error)
      if (!shouldNotNotifyUser) { return }
      context.commit('notifyConnectionError', true, { root: true })
      context.commit('notifyConnectionErrorName', name, { root: true })
    },

    requestOptions: (context, options) => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': 'must-revalidate, no-store, no-cache, private'
      })
      const collaboratorKey = normalizeCollaboratorKey(options.space)
      const apiKey = context.rootState.currentUser.apiKey
      if (collaboratorKey) {
        headers.append('Space-Authorization', collaboratorKey)
      }
      if (apiKey) {
        headers.append('Authorization', apiKey)
      }
      if (options.spaceReadOnlyKey) {
        headers.append('Read-Only-Authorization', options.spaceReadOnlyKey)
      }
      headers.append('User-Id', context.rootState.currentUser.id)
      return {
        method: options.method,
        headers,
        body: JSON.stringify(options.body)
      }
    },

    // Queue

    handleServerOperationsError: async (context, { error, response }) => {
      const data = await response.json()
      const operations = data.operations
      console.warn('🚑 serverOperationsError', data)
      const nonErrorStatusCodes = [400, 401, 404, 422]
      operations.forEach(operation => {
        const error = operation.error
        if (!error) { return }
        const isCritical = !nonErrorStatusCodes.includes(error.status)
        if (isCritical) {
          console.error('🚒 critical serverOperationsError operation', operation)
          context.commit('notifyServerCouldNotSave', true, { root: true })
        } else {
          console.warn('🚑 non-critical serverOperationsError operation', operation)
        }
        cache.removeSendingInProgressQueueOperationById(operation.body.operationId)
      })
    },

    addToQueue: (context, { name, body, spaceId }) => {
      body = utils.clone(body)
      body.spaceId = spaceId || context.rootState.currentSpace.id
      body.operationId = nanoid()
      const isSignedIn = context.rootGetters['currentUser/isSignedIn']
      const canEditSpace = context.rootGetters['currentUser/canEditSpace']()
      if (!isSignedIn) { return }
      let queue = cache.queue()
      const request = {
        name,
        body
      }
      if (name === 'updateMultipleCards' && !canEditSpace) { return }
      if (name === 'updateUserCardsCreatedCount') {
        queue = squashCardsCreatedCount(queue, request)
      } else if (name === 'updateUserCardsCreatedCountRaw') {
        queue = squashCardsCreatedCount(queue, request, true)
      } else {
        queue.push(request)
      }
      cache.saveQueue(queue)
      context.dispatch('debouncedSendQueue')
    },

    debouncedSendQueue: debounce(({ dispatch }) => {
      dispatch('sendQueue')
    }, 500),

    sendQueue: async (context) => {
      let body
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      const queue = cache.queue()
      const sendingInProgressQueue = cache.sendingInProgressQueue()
      if (!shouldRequest({ apiKey, isOnline }) || !queue.length) { return }
      if (sendingInProgressQueue.length) {
        body = sendingInProgressQueue
        body = sortQueueItems(body)
        console.log('🛃 sending operations from sendingInProgressQueue', body)
      } else {
        body = squashQueue(queue)
        cache.saveSendingInProgressQueue(body)
        cache.clearQueue()
      }
      let response
      try {
        console.warn(`🛫 sending operations`, body)
        const space = context.rootState.currentSpace
        if (!space.id) { throw 'operation missing spaceId' }
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space })
        response = await fetch(`${consts.apiHost()}/operations`, options)
        if (response.ok) {
          console.log('🛬 operations ok')
          cache.clearSendingInProgressQueue()
        } else {
          throw Error(response.statusText)
        }
        if (context.rootState.notifyServerCouldNotSave) {
          // context.commit('notifyServerCouldNotSave', false, { root: true })
          context.commit('addNotification', { message: 'Reconnected to server', type: 'success' }, { root: true })
        }
      } catch (error) {
        context.dispatch('handleServerOperationsError', { error, response })
      }
    },

    // Meta

    getStatus: async (context) => {
      try {
        const response = await fetch(`${consts.apiHost()}/`)
        return normalizeResponse(response)
      } catch (error) {
        console.log('🚒 getStatus', error)
        return false
      }
    },
    getDate: async (context) => {
      try {
        const response = await fetch(`${consts.apiHost()}/meta/date`)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getDate', error })
      }
    },
    getCountries: async (context) => {
      try {
        const response = await fetch(`${consts.apiHost()}/meta/countries`)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getCountries', error })
      }
    },
    getBlogPosts: async (context) => {
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ shouldRequestRemote: true, isOnline })) { return }
      const isSpacePage = context.rootGetters.isSpacePage
      if (!isSpacePage) { return }
      try {
        const response = await fetch(`${consts.apiHost()}/meta/blog`)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getBlogPosts', error })
      }
    },

    // Session Token (sign up spam mitigation)

    createSessionToken: async (context, token) => {
      const body = { token }
      const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
      return fetch(`${consts.apiHost()}/session-token/create`, options)
    },

    // Sign Up or In

    signUp: async (context, { email, password, currentUser, sessionToken }) => {
      const body = currentUser
      body.email = email
      body.password = password
      body.sessionToken = sessionToken
      const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
      return fetch(`${consts.apiHost()}/user/sign-up`, options)
    },
    signIn: async (context, { email, password }) => {
      const body = {
        email: email,
        password: password
      }
      const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
      return fetch(`${consts.apiHost()}/user/sign-in`, options)
    },
    resetPassword: async (context, email) => {
      const body = { email }
      const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
      return fetch(`${consts.apiHost()}/user/reset-password`, options)
    },
    updatePassword: async (context, { password, apiKey }) => {
      const body = { password, apiKey }
      const options = await context.dispatch('requestOptions', { body, method: 'PATCH', apiKey, space: context.rootState.currentSpace })
      return fetch(`${consts.apiHost()}/user/update-password`, options)
    },
    updateEmail: async (context, email) => {
      const body = { email }
      const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
      return fetch(`${consts.apiHost()}/user/update-email`, options)
    },

    // User

    getUser: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getUser', error })
      }
    },
    getUserAIImages: async (context, limit) => {
      const isSpacePage = context.rootGetters.isSpacePage
      if (!isSpacePage) { return }
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        limit = limit || 100
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/ai-images?limit=${limit}`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getUserAIImages', error })
      }
    },
    getUserFavoriteSpaces: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/favorite-spaces`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getUserFavoriteSpaces', error })
      }
    },
    getUserFavoriteUsers: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/favorite-users`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getUserFavoriteUsers', error })
      }
    },
    getUserFavoriteColors: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/favorite-colors`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getUserFavoriteUsers', error })
      }
    },
    getFollowingUsersSpaces: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isSpacePage = context.rootGetters.isSpacePage
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      if (!isSpacePage) { return }
      try {
        console.log('🛬 getting following users spaces')
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/favorite-users-spaces`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getFollowingUsersSpaces', error })
      }
    },
    getUserSpaces: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/spaces`, options)
        const currentUser = context.rootState.currentUser
        let spaces = await normalizeResponse(response)
        return utils.AddCurrentUserIsCollaboratorToSpaces(spaces, currentUser)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getUserSpaces', error })
      }
    },
    getUserRemovedSpaces: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/removed-spaces`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getUserRemovedSpaces', error })
      }
    },
    getUserInboxSpace: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/inbox-space`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getUserInboxSpace', error })
      }
    },
    getSpacesNotificationUnsubscribed: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/spaces-notification-unsubscribed`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getSpacesNotificationUnsubscribed', error })
      }
    },
    spaceNotificationResubscribe: async (context, space) => {
      const apiKey = context.rootState.currentUser.apiKey
      const user = context.rootState.currentUser
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/space/${space.id}/notification-resubscribe?userId=${user.id}`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'spaceNotificationResubscribe', error })
      }
    },
    deleteUserPermanent: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'DELETE', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/permanent`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'deleteUserPermanent', error })
      }
    },
    getPublicUser: async (context, user) => {
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/public/${user.id}`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getPublicUser', error })
      }
    },
    getPublicUsers: async (context, userIds) => {
      const max = 60
      try {
        userIds = userIds.slice(0, max)
        userIds = userIds.join(',')
        console.log('🛬🛬 getting remote public users', userIds)
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/user/public/multiple?userIds=${userIds}`, options))
        // notifyConnectionError
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getPublicUsers', error })
      }
    },
    getPublicUserExploreSpaces: async (context, user) => {
      console.log(user)
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/public/explore-spaces/${user.id}`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getPublicUserExploreSpaces', error })
      }
    },
    updateUserFavorites: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/favorites`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'updateUserFavorites', error, shouldNotNotifyUser: true })
      }
    },

    // Space

    getExploreSpaces: async (context) => {
      const isSpacePage = context.rootGetters.isSpacePage
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ shouldRequestRemote: true, isOnline })) { return }
      if (!isSpacePage) { return }
      try {
        console.log('🛬 getting explore spaces')
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/explore-spaces`, options))
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getExploreSpaces', error })
      }
    },

    getEveryoneSpaces: async (context) => {
      const isSpacePage = context.rootGetters.isSpacePage
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ shouldRequestRemote: true, isOnline })) { return }
      if (!isSpacePage) { return }
      try {
        console.log('🛬 getting everyone spaces')
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/everyone-spaces`, options))
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getEveryoneSpaces', error })
      }
    },
    getLiveSpaces: async (context) => {
      const isSpacePage = context.rootGetters.isSpacePage
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ shouldRequestRemote: true, isOnline })) { return }
      if (!isSpacePage) { return }
      try {
        console.log('🛬 getting live spaces')
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/live-spaces`, options))
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getLiveSpaces', error })
      }
    },
    getSpace: async (context, { space, shouldRequestRemote, spaceReadOnlyKey }) => {
      try {
        const apiKey = context.rootState.currentUser.apiKey
        const isOnline = context.rootState.isOnline
        if (!shouldRequest({ shouldRequestRemote, apiKey, isOnline })) { return }
        let spaceReadOnlyKey = context.rootGetters['currentSpace/readOnlyKey'](space)
        console.log('🛬 getting remote space', space.id)
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace, spaceReadOnlyKey })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/${space.id}`, options))
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getSpace', error })
      }
    },
    getSpaceUpdatedAt: async (context, space) => {
      try {
        const isOnline = context.rootState.isOnline
        if (!isOnline) { return }
        console.log('🛬 getting remote space updatedAt', space.id)
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/updated-at/${space.id}`, options))
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getSpace', error })
      }
    },
    getSpaceFavorites: async (context) => {
      try {
        const isOnline = context.rootState.isOnline
        if (!isOnline) { return }
        const spaceId = context.rootState.currentSpace.id
        console.log('🛬 getting remote space favorites', spaceId)
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/${spaceId}/favorites`, options))
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getSpaceFavorites', error })
      }
    },
    getOtherItems: async (context, { cardIds, spaceIds, invites }) => {
      const max = 60
      try {
        const isOnline = context.rootState.isOnline
        if (!isOnline) { return }
        // normalize
        cardIds = uniq(cardIds)
        cardIds = cardIds.slice(0, max)
        spaceIds = uniq(spaceIds)
        spaceIds = spaceIds.slice(0, max)
        console.log('🛬🛬 getting remote other items', { cardIds, spaceIds, invites })
        // request
        const body = { cardIds, spaceIds, invites }
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/item/multiple`, options))
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getSpaces', error })
      }
    },
    getSpaceAnonymously: async (context, space) => {
      const isOnline = context.rootState.isOnline
      if (!isOnline) { return }
      const invite = cache.invitedSpaces().find(invitedSpace => invitedSpace.id === space.id) || {}
      space.collaboratorKey = space.collaboratorKey || invite.collaboratorKey
      let spaceReadOnlyKey = context.rootGetters['currentSpace/readOnlyKey'](space)
      try {
        console.log('🛬 getting remote space anonymously', space.id, space.collaboratorKey, spaceReadOnlyKey)
        const options = await context.dispatch('requestOptions', { method: 'GET', space: space, spaceReadOnlyKey })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/${space.id}`, options))
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getSpaceAnonymously', error })
      }
    },
    getInboxSpace: async (context) => {
      try {
        console.log('🛬 getting inbox space')
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${consts.apiHost()}/space/inbox`, options))
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getInboxSpace', error })
      }
    },
    createSpaces: async (context) => {
      try {
        let spaces = cache.getAllSpaces()
        if (!spaces.length) { return }
        spaces = spaces.map(space => normalizeSpaceToRemote(space))
        let removedSpaces = cache.getAllRemovedSpaces()
        removedSpaces = removedSpaces.map(space => {
          space.isRemoved = true
          space.removedByUserId = context.rootState.currentUser.id
          return space
        })
        removedSpaces.forEach(space => spaces.push(space))
        spaces = spaces.filter(space => space)
        const body = spaces
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/space/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createSpaces', error })
      }
    },
    createSpace: async (context, space) => {
      try {
        space = normalizeSpaceToRemote(space)
        const body = space
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/space`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createSpace', error })
      }
    },
    createSpacePreviewImage: async (context, spaceId) => {
      try {
        spaceId = spaceId || context.rootState.currentSpace.id
        const themeOptions = context.rootGetters['themes/previewImageThemeOptions']
        const body = { spaceId, themeOptions }
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/space/preview-image`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createSpacePreviewImage', error, shouldNotNotifyUser: false })
      }
    },
    updateSpace: async (context, space) => {
      try {
        const body = space
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space })
        const response = await fetch(`${consts.apiHost()}/space`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'updateSpace', error })
      }
    },
    getSpaceRemovedCards: async (context, space) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/space/${space.id}/removed-cards`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getSpaceRemovedCards', error })
      }
    },
    getSpaceCollaboratorKey: async (context, space) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/space/${space.id}/collaborator-key`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getSpaceCollaboratorKey', error })
      }
    },
    addSpaceCollaborator: async (context, { spaceId, collaboratorKey }) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      const userId = context.rootState.currentUser.id
      try {
        const body = { userId, spaceId }
        const space = { collaboratorKey: collaboratorKey }
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space })
        const response = await fetch(`${consts.apiHost()}/space/collaborator`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'addSpaceCollaborator', error })
      }
    },
    removeSpaceCollaborator: async (context, { space, user }) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const body = {
          spaceId: space.id,
          userId: user.id
        }
        const options = await context.dispatch('requestOptions', { body, method: 'DELETE', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/space/collaborator`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'removeSpaceCollaborator', error })
      }
    },
    restoreRemovedSpace: async (context, space) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/space/restore/${space.id}`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'restoreRemovedSpace', error })
      }
    },
    sendSpaceInviteEmails: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/space/email-invites/${body.spaceId}`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'sendSpaceInviteEmails', error })
      }
    },

    // Card

    getCardsWithLinkToSpaceId: async (context, spaceId) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/card/by-link-to-space/${spaceId}`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getCardsWithLinkToSpaceId', error })
      }
    },
    updateCards: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/card/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'updateCards', error })
      }
    },
    createCards: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/card/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createCards', error })
      }
    },
    createCard: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/card`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createCard', error })
      }
    },
    createCardInInbox: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/card/to-inbox`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createCardInInbox', error })
      }
    },
    searchCards: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/card/search`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'search', error })
      }
    },
    updateCardCounter: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/card/update-counter`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'update-counter', error })
      }
    },
    updateUrlPreviewImage: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/card/update-url-preview-image`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'update-counter', error })
      }
    },

    // ConnectionType

    updateConnectionTypes: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/connection-type/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'updateConnectionTypes', error })
      }
    },
    createConnectionTypes: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/connection-type/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createConnectionTypes', error })
      }
    },

    // Connection

    updateConnections: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/connection/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'updateConnections', error })
      }
    },
    createConnections: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/connection/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createConnections', error })
      }
    },

    // Boxes

    createBoxes: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/box/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createBoxes', error })
      }
    },

    // Tag

    getCardsWithTag: async (context, name) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      name = encodeURI(name)
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/card/by-tag-name/${name}`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getCardsWithTag', error })
      }
    },
    getUserTags: async (context, removeUnusedTags) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        let params = ''
        if (removeUnusedTags) {
          params = '?removeUnusedTags=true'
        }
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/tags${params}`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getUserTags', error })
      }
    },
    // updateUserTagsColor: async (context, tag) => {
    // const apiKey = context.rootState.currentUser.apiKey
    //   if (!shouldRequest({apiKey})) { return }
    //   try {
    //     const options = await context.dispatch('requestOptions', { method: 'PATCH', space: context.rootState.currentSpace, tag })
    //     const response = await fetch(`${consts.apiHost()}/tags/color`, options)
    //     return normalizeResponse(response)
    //   } catch (error) {
    //     console.error('🚒 updateUserTagsColor', error)
    //   }
    // },

    // Billing Stripe

    checkoutUrl: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/billing/stripe/checkout-url`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'subscriptionUrl', error })
      }
    },
    subscriptionUrl: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/billing/stripe/subscription-url`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'subscriptionUrl', error })
      }
    },
    customerPortalUrl: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/billing/stripe/customer-portal-url`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'customerPortalUrl', error })
      }
    },
    donationUrl: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/billing/stripe/donation-url`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'donationUrl', error })
      }
    },

    // Upload

    createPresignedPost: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/upload/presigned-post`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createPresignedPost', error })
      }
    },
    createMultiplePresignedPosts: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/upload/presigned-post/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createMultiplePresignedPosts', error })
      }
    },
    pdf: async (context) => {
      const spaceId = context.rootState.currentSpace.id
      try {
        const options = await context.dispatch('requestOptions', { method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/space/pdf/${spaceId}`, options)
        let url = await normalizeResponse(response)
        url = url.url
        return url
      } catch (error) {
        context.dispatch('handleServerError', { name: 'pdf', error })
      }
    },

    // Notifications

    getNotifications: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/notification`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getNotifications', error })
      }
    },

    // Services

    updateArenaAccessToken: async (context, arenaReturnedCode) => {
      try {
        const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
        let userId
        if (currentUserIsSignedIn) {
          userId = context.rootState.currentUser.id
        }
        const body = {
          userId,
          arenaReturnedCode: arenaReturnedCode
        }
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/user/update-arena-access-token`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒 updateArenaAccessToken', error)
        context.commit('triggerArenaAuthenticationError', null, { root: true })
        context.commit('isAuthenticatingWithArena', false, { root: true })
      }
    },
    urlPreview: async (context, { url, card }) => {
      try {
        const body = { url, card }
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/services/url-preview`, options)
        if (response.status !== 200) {
          throw new Error(response.status)
        }
        const data = await normalizeResponse(response)
        return { url, data, response }
      } catch (error) {
        context.dispatch('handleServerError', { name: 'urlPreview', error })
      }
    },
    imageSearch: async (context, search) => {
      try {
        const body = { search }
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/services/image-search`, options)
        const data = await normalizeResponse(response)
        return data
      } catch (error) {
        context.dispatch('handleServerError', { name: 'imageSearch', error })
      }
    },
    gifImageSearch: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/services/gif-image-search`, options)
        const data = await normalizeResponse(response)
        return data
      } catch (error) {
        context.dispatch('handleServerError', { name: 'imageSearch', error })
      }
    },

    weather: async (context) => {
      const showWeather = context.rootState.currentUser.showWeather
      if (!showWeather) { return }
      const body = { weatherLocation: context.rootState.currentUser.weatherLocation }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/services/weather`, options)
        const data = await normalizeResponse(response)
        return data.weather
      } catch (error) {
        context.dispatch('handleServerError', { name: 'weather', error })
      }
    },
    journalDailyPrompt: async (context) => {
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/journal-daily-prompt`, options)
        const data = await normalizeResponse(response)
        return data
      } catch (error) {
        console.error('🚒 journalDailyPrompt', error)
      }
    },
    createAIImage: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/services/ai-image`, options)
        const data = await normalizeResponse(response)
        return data
      } catch (error) {
        console.error('🚒 createAIImage', error)
        throw new Error(error)
      }
    },
    communityBackgrounds: async (context) => {
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/services/community-backgrounds`, options)
        const data = await normalizeResponse(response)
        return data
      } catch (error) {
        console.error('🚒 communityBackgrounds', error)
      }
    },

    // Downloads

    downloadAllSpaces: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${consts.apiHost()}/space/download-all`, options)
        return response.blob()
      } catch (error) {
        context.dispatch('handleServerError', { name: 'downloadAllSpaces', error })
      }
    }

  }
}

export default self
