// https://www.notion.so/kinopio/API-docs

import cache from '@/cache.js'
import utils from '@/utils.js'

let host = 'https://api.kinopio.club'
if (process.env.NODE_ENV === 'development') {
  host = 'http://kinopio.local:3000'
}

const shouldRequest = () => {
  const isOnline = window.navigator.onLine
  const userIsSignedIn = cache.user().apiKey
  if (isOnline && userIsSignedIn) {
    return true
  }
}

const requestOptions = (options) => {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  // const contributorKey = cache.space(options.spaceId).contributorKey
  const apiKey = cache.user().apiKey // || contributorKey
  if (apiKey) {
    headers.append('Authorization', apiKey)
  }
  return {
    method: options.method,
    headers,
    body: JSON.stringify(options.body)
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

// const addBackToQueue = (requests) => {
//   requests.reverse()
//   requests.forEach(request => {
//     let queue = cache.queue()
//     queue.unshift(request)
//     cache.saveQueue(queue)
//   })
//   console.log(cache.queue())
// }

export default {

  // Sign In or Up

  async signUp (email, password, currentUser) {
    const body = currentUser
    body.email = email
    body.password = password
    const options = requestOptions({ body, method: 'POST' })
    return fetch(`${host}/user/sign-up`, options)
  },
  async signIn (email, password) {
    const body = {
      email: email,
      password: password
    }
    const options = requestOptions({ body, method: 'POST' })
    return fetch(`${host}/user/sign-in`, options)
  },
  async resetPassword (email) {
    const body = { email }
    const options = requestOptions({ body, method: 'POST' })
    return fetch(`${host}/user/reset-password`, options)
  },

  // Operations

  async processQueue (body) {
    const options = requestOptions({ body, method: 'POST' })
    try {
      console.log(`🛫 sending operations`, body)
      await fetch(`${host}/operations`, options)
    } catch (error) {
      console.error('🚒', error, body)
      // if (error.message === 'timeout') {
      //   addBackToQueue(body)
      // }
    }
  },

  // User

  async getUser () {
    if (!shouldRequest()) { return }
    try {
      const options = requestOptions({ method: 'GET' })
      const response = await fetch(`${host}/user`, options)
      return normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },
  async getUserSpaces () {
    if (!shouldRequest()) { return }
    try {
      const options = requestOptions({ method: 'GET' })
      const response = await fetch(`${host}/user/spaces`, options)
      return normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },
  async getUserRemovedSpaces () {
    if (!shouldRequest()) { return }
    try {
      const options = requestOptions({ method: 'GET' })
      const response = await fetch(`${host}/user/removed-spaces`, options)
      return normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },
  async removeUserPermanent () {
    if (!shouldRequest()) { return }
    try {
      const options = requestOptions({ method: 'DELETE' })
      const response = await fetch(`${host}/user/permanent`, options)
      return normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },

  // Space

  async getSpace (space) {
    try {
      if (!shouldRequest()) { return }
      console.log('🛬 getting remote space', space.id)
      const options = requestOptions({ method: 'GET' })
      const response = await utils.timeout(5000, fetch(`${host}/space/${space.id}`, options))
      return normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },
  async createSpaces () {
    try {
      let spaces = cache.getAllSpaces()
      spaces = spaces.map(space => normalizeSpaceToRemote(space))
      let removedSpaces = cache.getAllRemovedSpaces()
      removedSpaces = removedSpaces.map(space => {
        space.isRemoved = true
        space.removedByUserId = cache.user().id
        return space
      })
      removedSpaces.forEach(space => spaces.push(space))
      spaces.map(space => {
        utils.migrationEnsureRemovedCards(space)
        return space
      })
      const body = spaces
      const options = requestOptions({ body, method: 'POST' })
      const response = await fetch(`${host}/space/multiple`, options)
      return normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },
  async getSpaceRemovedCards (space) {
    if (!shouldRequest()) { return }
    try {
      const options = requestOptions({ method: 'GET' })
      const response = await fetch(`${host}/space/${space.id}/removed-cards`, options)
      return normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  }

}
