// https://www.notion.so/kinopio/API-docs

import nanoid from 'nanoid'

import cache from '@/cache.js'

let queue = cache.queue() // []
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
  // TODO unused yet (use for card etc. mutations)
  async addToQueue (name) {
    const request = {
      id: nanoid(),
      name,
      isActive: false
    }
    queue.push(request)
    cache.saveQueue(queue)
    await this.processQueue()
  },

  processQueue () {
    const maxConcurrency = 3
    queue = queue.map(request => {
      const activeRequests = queue.filter(request => request.isActive === true).length
      const shouldProcess = activeRequests < maxConcurrency
      if (shouldProcess) {
        request.isActive = true
        this[request.name](request)
      }
      return request
    })
    cache.saveQueue(queue)
  },

  queueError (requestId) {
    const index = queue.findIndex(request => request.id === requestId)
    if (index >= 0) {
      queue[index].isActive = false
      cache.saveQueue(queue)
    }
  }

}
