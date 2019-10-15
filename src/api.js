// https://www.notion.so/kinopio/API-docs

import _ from 'lodash'

import cache from '@/cache.js'
import utils from '@/utils.js'

let host = 'https://api.kinopio.club'
if (process.env.NODE_ENV === 'development') {
  host = 'http://kinopio.local:3000'
}
let queueIsRunning = false

setInterval(() => {
  api.processQueue()
}, 60 * 1000)

const api = {
  options (body, options) {
    const headers = new Headers({ 'Content-Type': 'application/json' })
    let method = 'POST'
    let apiKey = cache.user().apiKey
    if (options) {
      method = options.method || method
      apiKey = options.apiKey || apiKey
    }
    if (apiKey) {
      headers.append('Authorization', apiKey)
    }
    return {
      method: method,
      headers,
      body: JSON.stringify(body)
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
  },

  // Sign In or Up

  async signUp (email, password, currentUser) {
    const body = currentUser
    body.email = email
    body.password = password
    const options = this.options(body)
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
    const options = this.options(body)
    try {
      const response = await fetch(`${host}/user/sign-in`, options)
      const normalizedResponse = await this.normalizeResponse(response)
      return normalizedResponse
    } catch (error) {
      console.error(error)
    }
  },

  async resetPassword (email) {
    const body = {
      email
    }
    const options = this.options(body)
    try {
      const response = await fetch(`${host}/user/reset-password`, options)
      const normalizedResponse = await this.normalizeResponse(response)
      return normalizedResponse
    } catch (error) {
      console.error(error)
    }
  },

  // User

  async removeUserPermanently () {
    try {
      const options = this.options(undefined, { method: 'DELETE' })
      await fetch(`${host}/user/permanent`, options)
    } catch (error) {
      console.error(error)
    }
  },

  async getCurrentUser () {
    try {
      const options = this.options(undefined, { method: 'GET' })
      const response = await fetch(`${host}/user`, options)
      const normalizedResponse = await this.normalizeResponse(response)
      return normalizedResponse
    } catch (error) {
      console.error(error)
    }
  },

  // Card

  // api.addToQueue('restoreCard', cardId)
  // api.addToQueue('removeCard', cardId)

  // api.addToQueue('removeCardPermanently', cardId)

  // Space

  async saveSpace (space) {
    const options = this.options(space)
    return utils.timeout(5000, fetch(`${host}/space`, options))
  },

  async removeSpace (space) {
    const options = this.options(space, { method: 'DELETE' })
    return utils.timeout(5000, fetch(`${host}/space/${space.id}`, options))
  },

  async saveAllSpaces (apiKey) {
    try {
      const spaces = cache.getAllSpaces()
      const options = this.options(spaces, { apiKey })
      const response = await fetch(`${host}/space/multiple`, options)
      const normalizedResponse = await this.normalizeResponse(response)
      return normalizedResponse
    } catch (error) {
      console.error(error)
    }
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
    cache.saveQueue(queue)
    this.processQueue()
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

  // processQueue stops if a queue request fails
  // retries every minute
  // retries when a request is added to the queue
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
      } catch (error) {
        console.error(error)
        queue.push(request)
        cache.saveQueue(queue)
        queueIsRunning = false
        break
      }
      queue = this.queue()
    } while (queue.length > 0)
    queueIsRunning = false
  },

  async processRequest (request) {
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
  }

}

export default api
