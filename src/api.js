// https://www.notion.so/kinopio/API-docs

import _ from 'lodash'

import cache from '@/cache.js'
import utils from '@/utils.js'

let host = 'https://api.kinopio.club'
if (process.env.NODE_ENV === 'development') {
  host = 'http://kinopio.local:3000'
}
let queueIsRunning = false

window.onload = () => {
  api.processQueue()
  setInterval(() => {
    api.processQueue()
  }, 60 * 1000) // 60 seconds
}

const api = {

  // Sign In or Up

  async signUp (email, password, currentUser) {
    const body = currentUser
    body.email = email
    body.password = password
    const options = this.options({ body, method: 'POST' })
    try {
      const response = await fetch(`${host}/user/sign-up`, options)
      const normalizedResponse = await this.normalizeResponse(response)
      return normalizedResponse
    } catch (error) {
      console.error(error)
    }
  },
  async signIn (email, password) {
    const body = {
      email: email,
      password: password
    }
    const options = this.options({ body, method: 'POST' })
    try {
      const response = await fetch(`${host}/user/sign-in`, options)
      const normalizedResponse = await this.normalizeResponse(response)
      return normalizedResponse
    } catch (error) {
      console.error(error)
    }
  },
  async resetPassword (email) {
    const body = { email }
    const options = this.options({ body, method: 'POST' })
    try {
      const response = await fetch(`${host}/user/reset-password`, options)
      const normalizedResponse = await this.normalizeResponse(response)
      return normalizedResponse
    } catch (error) {
      console.error(error)
    }
  },

  // User

  async updateUser (body) {
    const options = this.options({ body, method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/user`, options))
  },
  async removeUserPermanently () {
    const userIsSignedIn = cache.user().apiKey
    if (!userIsSignedIn) { return }
    try {
      const options = this.options({ method: 'DELETE' })
      await fetch(`${host}/user/permanent`, options)
    } catch (error) {
      console.error(error)
    }
  },
  async getUser () {
    try {
      const options = this.options({ method: 'GET' })
      const response = await fetch(`${host}/user`, options)
      const normalizedResponse = await this.normalizeResponse(response)
      return normalizedResponse
    } catch (error) {
      console.error(error)
    }
  },

  // Card

  async createCard (body) {
    const options = this.options({ body, method: 'POST' })
    return utils.timeout(5000, fetch(`${host}/card`, options))
  },
  async updateCard (card) {
    const body = card
    const options = this.options({ body, method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/card/${card.id}`, options))
  },
  async restoreCard (cardId) {
    const options = this.options({ method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/card/${cardId}/restore`, options))
  },
  async removeCard (cardId) {
    const options = this.options({ method: 'DELETE' })
    return utils.timeout(5000, fetch(`${host}/card/${cardId}`, options))
  },
  async removeCardPermanently (cardId) {
    const options = this.options({ method: 'DELETE' })
    return utils.timeout(5000, fetch(`${host}/card/${cardId}/permanent`, options))
  },

  // Connection

  async updateConnection (connection) {
    const body = connection
    const options = this.options({ body, method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/connection/${connection.id}`, options))
  },
  // async removeConnections (body) {
  //   console.log('🚨',body)
  //   const options = this.options({ body, method: 'DELETE' })
  //   return utils.timeout(5000, fetch(`${host}/connection/multiple`, options))
  // },

  // Connection Type

  async updateConnectionType (connectionType) {
    const body = connectionType
    const options = this.options({ body, method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/connection-type/${connectionType.id}`, options))
  },

  // Space

  async updateSpace (space) {
    const userIsSignedIn = cache.user().apiKey
    // const userIsContributor = cache.space(space.id).contributorKey
    if (!userIsSignedIn) { return } // (!userIsSignedIn && !userIsContributor)
    console.log('🌙updateSpace', space)
    const body = space
    const options = this.options({ body, method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/card/${space.spaceId}`, options))
  },
  async getSpace (spaceId) {
    // TODO support getting other people's spaces later
    const userIsSignedIn = cache.user().apiKey
    if (!userIsSignedIn) { return }
    console.log('🌙 Getting remote space', spaceId)
    const options = this.options({ method: 'GET' })
    const response = await utils.timeout(5000, fetch(`${host}/space/${spaceId}`, options))
    const normalizedResponse = await this.normalizeResponse(response)
    return normalizedResponse
  },
  async createSpace (body) {
    const options = this.options({ body, method: 'POST' })
    return utils.timeout(5000, fetch(`${host}/space`, options))
  },
  async saveSpaces (apiKey) {
    try {
      const body = cache.getAllSpaces()
      const options = this.options({ body, apiKey, method: 'POST' })
      const response = await fetch(`${host}/space/multiple`, options)
      const normalizedResponse = await this.normalizeResponse(response)
      return normalizedResponse
    } catch (error) {
      console.error(error)
    }
  },
  async removeSpace (spaceId) {
    const options = this.options({ method: 'DELETE' })
    return utils.timeout(5000, fetch(`${host}/space/${spaceId}`, options))
  },
  async removeSpacePermanently (spaceId) {
    const options = this.options({ method: 'DELETE' })
    return utils.timeout(5000, fetch(`${host}/space/${spaceId}/permanent`, options))
  },

  // Queue

  async addToQueue (name, body) {
    const userIsSignedIn = cache.user().apiKey
    if (!userIsSignedIn) { return }
    const queue = this.queue()
    const request = {
      name,
      body
    }
    queue.push(request)
    console.log('🎡 Add to request queue', request)
    // consolidate
    // if updateCard , ids are the same,

    // other approach is to only add things to the api queue on stop interactions, when their done/blurred
    cache.saveQueue(queue)
    _.debounce(_.wrap(this.processQueue()), 300)
  },
  request () {
    const queue = this.queue()
    const request = queue.shift()
    cache.saveQueue(queue)
    return request
  },
  queue () {
    let queue = cache.queue()
    queue = queue.filter(request => !_.isNil(request))
    cache.saveQueue(queue)
    return queue
  },
  async processQueue () {
    console.log('this should be debounced')
    if (queueIsRunning) { return }
    if (!window.navigator.onLine) { return }
    let queue = this.queue()
    if (!queue.length) { return }
    queueIsRunning = true
    let request
    do {
      try {
        request = this.request()
        await this.processRequest(request)
        console.log('✅ completed', request)
      } catch (error) {
        queue.push(request)
        console.error(error)
        console.log('🔁 Request error. Add back into queue to retry', request)
        cache.saveQueue(queue)
        queueIsRunning = false
        break
      }
      queue = this.queue()
    } while (queue.length > 0)
    queueIsRunning = false
  },
  async processRequest (request) {
    console.log('🚎 Processing request', request.name, request.body)
    const response = await this[request.name](request.body)
    const normalizedResponse = await this.normalizeResponse(response)
    return normalizedResponse
  },
  queueError (requestId) {
    const queue = this.queue()
    const index = queue.findIndex(request => request.id === requestId)
    if (index >= 0) {
      queue[index].isActive = false
      cache.saveQueue(queue)
    }
  },

  // Request helpers

  options (options) {
    const headers = new Headers({ 'Content-Type': 'application/json' })
    // const contributorKey = cache.space(options.spaceId).contributorKey
    const apiKey = options.apiKey || cache.user().apiKey // || contributorKey
    if (apiKey) {
      headers.append('Authorization', apiKey)
    }
    return {
      method: options.method,
      headers,
      body: JSON.stringify(options.body)
    }
  },
  async normalizeResponse (response) {
    const success = [200, 201, 202, 204]
    if (success.includes(response.status)) {
      const data = await response.json()
      return data
    } else {
      const data = await response.json()
      let error = {
        status: response.status,
        statusText: response.statusText,
        error: true
      }
      if (data.errors) {
        error.message = data.errors[0].message
        error.type = data.errors[0].type
      }
      return error
    }
  }

}

export default api
