import cache from '@/cache.js'
import utils from '@/utils.js'
import consts from '@/consts.js'

import debounce from 'lodash-es/debounce'
import merge from 'lodash-es/merge'
import uniq from 'lodash-es/uniq'
import { nanoid } from 'nanoid'

let host = 'https://api.kinopio.club'
if (import.meta.env.MODE === 'development') {
  host = 'https://kinopio.local:3000'
}

const squashCardsCreatedCount = (queue, request) => {
  let isSquashed
  queue = queue.map(queueItem => {
    if (queueItem.name === 'updateUserCardsCreatedCount') {
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

    addToQueue: (context, { name, body, spaceId }) => {
      body = utils.clone(body)
      body.spaceId = spaceId || context.rootState.currentSpace.id
      const currentUserIsSignedIn = context.rootGetters['currentUser/isSignedIn']
      if (!currentUserIsSignedIn) { return }
      let queue = cache.queue()
      const request = {
        name,
        body
      }
      if (name === 'updateUserCardsCreatedCount') {
        queue = squashCardsCreatedCount(queue, request)
      } else {
        queue.push(request)
      }
      cache.saveQueue(queue)
      context.dispatch('debouncedProcessQueueOperations')
    },

    debouncedProcessQueueOperations: debounce(({ dispatch }) => {
      dispatch('processQueueOperations')
    }, 500),

    processQueueOperations: async (context) => {
      let body
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      const queue = cache.queue()
      const queueBuffer = cache.queueBuffer()
      if (!shouldRequest({ apiKey, isOnline }) || !queue.length) { return }
      if (queueBuffer.length) {
        body = queueBuffer
      } else {
        body = squashQueue(queue)
        cache.saveQueueBuffer(body)
        cache.clearQueue()
      }
      body = body.map(item => {
        item.operationId = nanoid()
        return item
      })
      try {
        console.log(`🛫 sending operations`, body)
        const space = context.rootState.currentSpace
        if (!space.id) { throw 'operation missing spaceId' }
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space })
        const response = await fetch(`${host}/operations`, options)
        if (response.ok) {
          console.log('🛬 operations ok')
          cache.clearQueueBuffer()
        } else {
          throw Error(response.statusText)
        }
        if (context.rootState.notifyServerCouldNotSave) {
          context.commit('notifyServerCouldNotSave', false, { root: true })
          context.commit('addNotification', { message: 'Reconnected to server', type: 'success' }, { root: true })
        }
      } catch (error) {
        console.error('🚒 processQueueOperations', error, body)
        context.commit('notifyServerCouldNotSave', true, { root: true })
      }
    },

    // Meta

    getStatus: async (context) => {
      try {
        const response = await fetch(`${host}/`)
        return normalizeResponse(response)
      } catch (error) {
        console.log('🚒 getStatus', error)
        return false
      }
    },
    getDate: async (context) => {
      try {
        const response = await fetch(`${host}/meta/date`)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getDate', error })
      }
    },
    getCountries: async (context) => {
      try {
        const response = await fetch(`${host}/meta/countries`)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getCountries', error })
      }
    },
    getNewStuff: async (context) => {
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ shouldRequestRemote: true, isOnline })) { return }
      const isSpacePage = context.rootGetters.isSpacePage
      if (!isSpacePage) { return }
      try {
        const response = await fetch(`${host}/meta/new-stuff`)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getNewStuff', error })
      }
    },

    // Session Token (sign up spam mitigation)

    createSessionToken: async (context, token) => {
      const body = { token }
      const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
      return fetch(`${host}/session-token/create`, options)
    },

    // Sign Up or In

    signUp: async (context, { email, password, currentUser, sessionToken }) => {
      const body = currentUser
      body.email = email
      body.password = password
      body.sessionToken = sessionToken
      const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
      return fetch(`${host}/user/sign-up`, options)
    },
    signIn: async (context, { email, password }) => {
      const body = {
        email: email,
        password: password
      }
      const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
      return fetch(`${host}/user/sign-in`, options)
    },
    resetPassword: async (context, email) => {
      const body = { email }
      const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
      return fetch(`${host}/user/reset-password`, options)
    },
    updatePassword: async (context, { password, apiKey }) => {
      const body = { password, apiKey }
      const options = await context.dispatch('requestOptions', { body, method: 'PATCH', apiKey, space: context.rootState.currentSpace })
      return fetch(`${host}/user/update-password`, options)
    },
    updateEmail: async (context, email) => {
      const body = { email }
      const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
      return fetch(`${host}/user/update-email`, options)
    },

    // User

    getUser: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user`, options)
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
        const response = await fetch(`${host}/user/ai-images?limit=${limit}`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getUserAIImages', error })
      }
    },
    getUserFavorites: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user/favorites`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getUserFavorites', error })
      }
    },
    getUserSpaces: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user/spaces`, options)
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
        const response = await fetch(`${host}/user/removed-spaces`, options)
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
        const response = await fetch(`${host}/user/inbox-space`, options)
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
        const response = await fetch(`${host}/user/spaces-notification-unsubscribed`, options)
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
        const response = await fetch(`${host}/space/${space.id}/notification-resubscribe?userId=${user.id}`, options)
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
        const response = await fetch(`${host}/user/permanent`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'deleteUserPermanent', error })
      }
    },
    getPublicUser: async (context, user) => {
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user/public/${user.id}`, options)
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
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${host}/user/public/multiple?userIds=${userIds}`, options))
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
        const response = await fetch(`${host}/user/public/explore-spaces/${user.id}`, options)
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
        const response = await fetch(`${host}/user/favorites`, options)
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
        console.log('🛬 getting new spaces')
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${host}/space/explore-spaces`, options))
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getExploreSpaces', error })
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
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${host}/space/live-spaces`, options))
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
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${host}/space/${space.id}`, options))
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getSpace', error })
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
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${host}/item/multiple`, options))
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
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${host}/space/${space.id}`, options))
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'getSpaceAnonymously', error })
      }
    },
    getInboxSpace: async (context) => {
      try {
        console.log('🛬 getting inbox space')
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(consts.defaultTimeout, fetch(`${host}/space/inbox`, options))
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
        const response = await fetch(`${host}/space/multiple`, options)
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
        const response = await fetch(`${host}/space`, options)
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
        const response = await fetch(`${host}/space/preview-image`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createSpacePreviewImage', error, shouldNotNotifyUser: false })
      }
    },
    updateSpace: async (context, space) => {
      try {
        const body = space
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space })
        const response = await fetch(`${host}/space`, options)
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
        const response = await fetch(`${host}/space/${space.id}/removed-cards`, options)
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
        const response = await fetch(`${host}/space/${space.id}/collaborator-key`, options)
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
        const response = await fetch(`${host}/space/collaborator`, options)
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
        const response = await fetch(`${host}/space/collaborator`, options)
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
        const response = await fetch(`${host}/space/restore/${space.id}`, options)
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
        const response = await fetch(`${host}/space/email-invites/${body.spaceId}`, options)
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
        const response = await fetch(`${host}/card/by-link-to-space/${spaceId}`, options)
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
        const response = await fetch(`${host}/card/multiple`, options)
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
        const response = await fetch(`${host}/card/multiple`, options)
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
        const response = await fetch(`${host}/card`, options)
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
        const response = await fetch(`${host}/card/to-inbox`, options)
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
        const response = await fetch(`${host}/card/search`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'search', error })
      }
    },

    // ConnectionType

    updateConnectionTypes: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      const isOnline = context.rootState.isOnline
      if (!shouldRequest({ apiKey, isOnline })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/connection-type/multiple`, options)
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
        const response = await fetch(`${host}/connection-type/multiple`, options)
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
        const response = await fetch(`${host}/connection/multiple`, options)
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
        const response = await fetch(`${host}/connection/multiple`, options)
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
        const response = await fetch(`${host}/box/multiple`, options)
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
        const response = await fetch(`${host}/card/by-tag-name/${name}`, options)
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
        const response = await fetch(`${host}/user/tags${params}`, options)
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
    //     const response = await fetch(`${host}/tags/color`, options)
    //     return normalizeResponse(response)
    //   } catch (error) {
    //     console.error('🚒 updateUserTagsColor', error)
    //   }
    // },

    // Billing Stripe

    checkoutUrl: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/billing/stripe/checkout-url`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'subscriptionUrl', error })
      }
    },
    subscriptionUrl: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/billing/stripe/subscription-url`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'subscriptionUrl', error })
      }
    },
    customerPortalUrl: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/billing/stripe/customer-portal-url`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'customerPortalUrl', error })
      }
    },
    donationUrl: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/billing/stripe/donation-url`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'donationUrl', error })
      }
    },

    // Upload

    createPresignedPost: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/upload/presigned-post`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createPresignedPost', error })
      }
    },
    createMultiplePresignedPosts: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/upload/presigned-post/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        context.dispatch('handleServerError', { name: 'createMultiplePresignedPosts', error })
      }
    },
    pdf: async (context) => {
      const spaceId = context.rootState.currentSpace.id
      try {
        const options = await context.dispatch('requestOptions', { method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/space/pdf/${spaceId}`, options)
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
        const response = await fetch(`${host}/notification`, options)
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
        const response = await fetch(`${host}/user/update-arena-access-token`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒 updateArenaAccessToken', error)
        context.commit('triggerArenaAuthenticationError', null, { root: true })
        context.commit('isAuthenticatingWithArena', false, { root: true })
      }
    },
    urlPreview: async (context, url) => {
      try {
        const apiKey = consts.iframelyApiKey
        const host = 'https://iframe.ly/api/iframely'
        const response = await fetch(`${host}/?url=${encodeURIComponent(url)}&api_key=${apiKey}&autoplay=1`)
        if (response.status !== 200) {
          throw new Error(response.status)
        }
        const data = await normalizeResponse(response)
        return { url, data, response, host }
      } catch (error) {
        context.dispatch('handleServerError', { name: 'urlPreview', error })
      }
    },
    weather: async (context) => {
      const showWeather = context.rootState.currentUser.showWeather
      const weatherLocation = context.rootState.currentUser.weatherLocation
      const weatherUnitIsCelcius = context.rootState.currentUser.weatherUnitIsCelcius
      if (!showWeather) { return }
      try {
        // http://docs.pirateweather.net/en/latest/API
        const apiKey = 'qM8rme33sr7AtpNB8l0xLa8itqjRk5Bi9HeQcecH'
        let url = `https://api.pirateweather.net/forecast/${apiKey}/${weatherLocation}?exclude=daily,minutely,alerts`
        if (weatherUnitIsCelcius) {
          url = url + '&units=ca'
        }
        const response = await fetch(url)
        const data = await response.json()
        let { currently, hourly } = data
        hourly = hourly.data.slice(0, 12)
        const emojis = {
          'clear-day': '🌻',
          'clear-night': '🌌',
          'rain': '☔️',
          'snow': '☃️',
          'sleet': '☃️',
          'wind': '🌻',
          'fog': '🌻',
          'cloudy': '🌻',
          'partly-cloudy-day': '🌻',
          'partly-cloudy-night': '🌌'
        }
        const emoji = emojis[currently.icon]
        let isRainToday
        hourly.forEach(hour => {
          if (hour.icon === 'rain') {
            isRainToday = true
          }
        })
        const temperature = Math.round(currently.apparentTemperature)
        let weather = `\n\n${emoji} ${currently.summary} ${temperature}°`
        if (isRainToday) {
          weather = weather + '\n\n☔️ Rain today'
        }
        return weather
      } catch (error) {
        context.dispatch('handleServerError', { name: 'weather', error })
      }
    },
    journalDailyPrompt: async (context) => {
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/journal-daily-prompt`, options)
        const data = await normalizeResponse(response)
        let name = data.name
        return name
      } catch (error) {
        console.error('🚒 journalDailyPrompt', error)
      }
    },
    createAIImage: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/services/ai-image`, options)
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
        const response = await fetch(`${host}/services/community-backgrounds`, options)
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
        const response = await fetch(`${host}/space/download-all`, options)
        return response.blob()
      } catch (error) {
        context.dispatch('handleServerError', { name: 'downloadAllSpaces', error })
      }
    }

  }
}

export default self
