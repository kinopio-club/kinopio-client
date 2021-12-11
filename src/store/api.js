import cache from '@/cache.js'
import utils from '@/utils.js'

import debounce from 'lodash-es/debounce'
import merge from 'lodash-es/merge'
import nanoid from 'nanoid'

let host = 'https://kinopio-server.herokuapp.com'
if (import.meta.env.MODE === 'development') {
  host = 'http://kinopio.local:3000'
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

const shouldRequest = ({ shouldRequestRemote, apiKey }) => {
  const isOnline = window.navigator.onLine
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
  const data = await response.json()
  if (success.includes(response.status)) {
    return data
  } else {
    throw { response, status: response.status }
  }
}

const normalizeSpaceToRemote = (space) => {
  if (!space.removedCards) { return }
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
      headers.append('User-Id', context.rootState.currentUser.id)
      return {
        method: options.method,
        headers,
        body: JSON.stringify(options.body)
      }
    },

    // Queue

    addToQueue: (context, { name, body }) => {
      body = utils.clone(body)
      body.spaceId = context.rootState.currentSpace.id
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
      const queue = cache.queue()
      const queueBuffer = cache.queueBuffer()
      if (!shouldRequest({ apiKey }) || !queue.length) { return }
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
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
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
        console.error('🚒', error, body)
        context.commit('notifyServerCouldNotSave', true, { root: true })
      }
    },

    // Sign In or Up

    signUp: async (context, { email, password, currentUser }) => {
      const body = currentUser
      body.email = email
      body.password = password
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
      const body = { password }
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
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    getUserFavorites: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user/favorites`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    getUserSpaces: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user/spaces`, options)
        const currentUser = context.rootState.currentUser
        let spaces = await normalizeResponse(response)
        return utils.AddCurrentUserIsCollaboratorToSpaces(spaces, currentUser)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    getUserRemovedSpaces: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user/removed-spaces`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    getSpacesNotificationUnsubscribed: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user/spaces-notification-unsubscribed`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    spaceNotificationResubscribe: async (context, space) => {
      const apiKey = context.rootState.currentUser.apiKey
      const user = context.rootState.currentUser
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/space/${space.id}/notification-resubscribe?userId=${user.id}`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    removeUserPermanent: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'DELETE', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user/permanent`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    getPublicUser: async (context, user) => {
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user/public/${user.id}`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    getPublicUsers: async (context, userIds) => {
      const max = 60
      try {
        userIds = userIds.slice(0, max)
        userIds = userIds.join(',')
        console.log('🛬🛬 getting remote public users', userIds)
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(40000, fetch(`${host}/user/public/multiple?userIds=${userIds}`, options))
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    updateUserFavorites: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user/favorites`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },

    // Space

    getExploreSpaces: async (context) => {
      try {
        console.log('🛬 getting new spaces')
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(40000, fetch(`${host}/space/explore-spaces`, options))
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    getLiveSpaces: async (context) => {
      try {
        console.log('🛬 getting live spaces')
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(40000, fetch(`${host}/space/live-spaces`, options))
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    getSpace: async (context, { space, shouldRequestRemote }) => {
      try {
        const apiKey = context.rootState.currentUser.apiKey
        if (!shouldRequest({ shouldRequestRemote, apiKey })) { return }
        console.log('🛬 getting remote space', space.id)
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(40000, fetch(`${host}/space/${space.id}`, options))
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    getSpaces: async (context, { spaceIds, shouldRequestRemote }) => {
      const max = 60
      try {
        const apiKey = context.rootState.currentUser.apiKey
        if (!shouldRequest({ shouldRequestRemote, apiKey })) { return }
        spaceIds = spaceIds.slice(0, max)
        console.log('🛬🛬 getting remote spaces', spaceIds)
        if (!spaceIds.length) { return }
        spaceIds = spaceIds.join(',')
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await utils.timeout(40000, fetch(`${host}/space/multiple?spaceIds=${spaceIds}`, options))
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    getSpaceAnonymously: async (context, space) => {
      const isOffline = !window.navigator.onLine
      if (isOffline) { return }
      const invite = cache.invitedSpaces().find(invitedSpace => invitedSpace.id === space.id) || {}
      space.collaboratorKey = space.collaboratorKey || invite.collaboratorKey
      try {
        console.log('🛬 getting remote space anonymously', space.id, space.collaboratorKey)
        const options = await context.dispatch('requestOptions', { method: 'GET', space: space })
        const response = await utils.timeout(40000, fetch(`${host}/space/${space.id}`, options))
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    createSpaces: async (context) => {
      try {
        let spaces = cache.getAllSpaces()
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
        console.error('🚒', error)
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
        console.error('🚒', error)
      }
    },
    getSpaceRemovedCards: async (context, space) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/space/${space.id}/removed-cards`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    getSpaceCollaboratorKey: async (context, space) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/space/${space.id}/collaborator-key`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    addSpaceCollaborator: async (context, { spaceId, collaboratorKey }) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      const userId = context.rootState.currentUser.id
      try {
        const body = { userId, spaceId }
        const space = { collaboratorKey: collaboratorKey }
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space })
        const response = await fetch(`${host}/space/collaborator`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    removeSpaceCollaborator: async (context, { space, user }) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const body = {
          spaceId: space.id,
          userId: user.id
        }
        const options = await context.dispatch('requestOptions', { body, method: 'DELETE', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/space/collaborator`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    restoreRemovedSpace: async (context, space) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/space/restore/${space.id}`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },

    // Card

    getCardsWithLinkToSpaceId: async (context, spaceId) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/card/by-link-to-space/${spaceId}`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    updateCards: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/card/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    createCards: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/card/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },

    // ConnectionType

    updateConnectionTypes: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/connection-type/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    createConnectionTypes: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/connection-type/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },

    // Connection

    updateConnections: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'PATCH', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/connection/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    createConnections: async (context, body) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/connection/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },

    // Tag

    getCardsWithTag: async (context, name) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      name = encodeURI(name)
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/card/by-tag-name/${name}`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    getUserTags: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/user/tags`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
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
    //     console.error('🚒', error)
    //   }
    // },

    // Billing

    createCustomer: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/billing/create-customer`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    createSubscription: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/billing/create-subscription`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    updateSubscription: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/billing/update-subscription`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    cancelSubscription: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/billing/cancel-subscription`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    subscriptionInfo: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/billing/retrieve-subscription-info`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },

    // Upload

    createPresignedPost: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/upload/presigned-post`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },
    createMultiplePresignedPosts: async (context, body) => {
      try {
        const options = await context.dispatch('requestOptions', { body, method: 'POST', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/upload/presigned-post/multiple`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
      }
    },

    // Notifications

    getNotifications: async (context) => {
      const apiKey = context.rootState.currentUser.apiKey
      if (!shouldRequest({ apiKey })) { return }
      try {
        const options = await context.dispatch('requestOptions', { method: 'GET', space: context.rootState.currentSpace })
        const response = await fetch(`${host}/notification`, options)
        return normalizeResponse(response)
      } catch (error) {
        console.error('🚒', error)
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
        console.error('🚒', error)
        context.commit('triggerArenaAuthenticationError', null, { root: true })
        context.commit('isAuthenticatingWithArena', false, { root: true })
      }
    },
    urlPreview: async (context, url) => {
      try {
        const apiKey = '0788beaa34f65adc0fe7ac'
        const response = await fetch(`https://iframe.ly/api/iframely/?api_key=${apiKey}&url=${encodeURIComponent(url)}`)
        if (response.status !== 200) {
          throw new Error(response.status)
        }
        const data = await normalizeResponse(response)
        return { url, data, response }
      } catch (error) {
        console.error('🚒', error)
      }
    }

  }
}

export default self
