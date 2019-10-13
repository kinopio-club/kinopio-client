// https://www.notion.so/kinopio/API-docs

import nanoid from 'nanoid'

import cache from '@/cache.js'

let host = 'https://api.kinopio.club'
if (process.env.NODE_ENV === 'development') {
  host = 'http://kinopio.local:3000'
}

export default {
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

  // Space

  async saveSpace (space) {
    console.log('🍄', space)
    try {
      const options = this.options(space)
      const response = await fetch(`${host}/space`, options)
      const normalizedResponse = await this.normalizeResponse(response)
      return normalizedResponse
    } catch (error) {
      console.error(error)
    }
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
    let queue = cache.queue()
    const request = {
      id: nanoid(),
      isActive: false,
      name,
      body
    }
    queue.push(request)
    cache.saveQueue(queue)
    this.processQueue() // TODO debounce 1000?
  },

  processQueue () {
    const maxConcurrency = 3
    let queue = cache.queue()
    console.log('🌙', queue)
    queue = queue.map(async request => {
      const activeRequests = cache.queue().filter(req => req.isActive === true).length
      console.log('activeRequests', activeRequests, request)
      if (activeRequests < maxConcurrency) { // might not be running in parallel cuz asnyc https://stackoverflow.com/questions/42489918/async-await-inside-arraymap
        request.isActive = true
        const response = await this[request.name](request.body)
        // const normalizedResponse = await this.normalizeResponse(response)
        console.warn('remove request w id from queue if response 200', request, response)
      }
      return request
    })
    cache.saveQueue(queue)
  },

  queueError (requestId) {
    const queue = cache.queue()
    const index = queue.findIndex(request => request.id === requestId)
    if (index >= 0) {
      queue[index].isActive = false
      cache.saveQueue(queue)
    }
  }

}
