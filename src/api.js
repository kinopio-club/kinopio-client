// https://www.notion.so/kinopio/API-docs

// refactor options format

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
    const options = this.options({ body, method: 'PATCH' })
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
    const options = this.options({ body, method: 'PATCH' })
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
    const options = this.options({ body, method: 'PATCH' })
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
    const options = this.options({ body, method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/card`, options))
  },
  // make this atomic w key/value instead?
  // if needs whole card update => replaceCard?
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

  // Space

  async getSpace (spaceId) {
    const options = this.options({ method: 'GET' })
    const response = await utils.timeout(5000, fetch(`${host}/space/${spaceId}`, options))
    const normalizedResponse = await this.normalizeResponse(response)
    return normalizedResponse
  },

  async saveSpace (body) {
    const options = this.options({ body, method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/space`, options))
  },
  async saveAllSpaces (apiKey) {
    try {
      const body = cache.getAllSpaces()
      const options = this.options({ body, apiKey, method: 'PATCH' })
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
    console.log('in', request)
    cache.saveQueue(queue)
    this.processQueue()
  },
  request () {
    const queue = this.queue()
    const request = queue.shift()
    console.log('out', request)
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
        console.log('completed', request)
      } catch (error) {
        console.error(error)
        queue.push(request)
        console.log('err re-in', request)
        cache.saveQueue(queue)
        queueIsRunning = false
        break
      }
      queue = this.queue()
    } while (queue.length > 0)
    queueIsRunning = false
  },
  async processRequest (request) {
    console.log('🚗', request.name, request.body)
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
    console.log('🚎', options)
    const headers = new Headers({ 'Content-Type': 'application/json' })
    const apiKey = options.apiKey || cache.user().apiKey
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
