// https://www.notion.so/kinopio/API-docs

import cache from '@/cache.js'
import utils from '@/utils.js'

let host = 'https://api.kinopio.club'
if (process.env.NODE_ENV === 'development') {
  host = 'http://kinopio.local:3000'
}

export default {

  shouldSendRequest () {
    // TODO support getting other people's spaces later
    const isOnline = window.navigator.onLine
    const userIsSignedIn = cache.user().apiKey
    if (isOnline && userIsSignedIn) {
      return true
    }
  },
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
    const data = await response.json()
    if (success.includes(response.status)) {
      return data
    } else {
      throw { response, status: response.status }
    }
  },

  // Sign In or Up

  async signUp (email, password, currentUser) {
    const body = currentUser
    body.email = email
    body.password = password
    const options = this.options({ body, method: 'POST' })
    try {
      const response = await fetch(`${host}/user/sign-up`, options)
      return this.normalizeResponse(response)
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
      return this.normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },
  async resetPassword (email) {
    const body = { email }
    const options = this.options({ body, method: 'POST' })
    try {
      const response = await fetch(`${host}/user/reset-password`, options)
      return this.normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },

  // Operations

  async processQueue (body) {
    const options = this.options({ body, method: 'POST' })
    try {
      console.log(`🚎 sending operations`, body)
      await fetch(`${host}/operations`, options)
    } catch (error) {
      console.error(error)
      // 🚗 for errors, iterate and unshift each one into the queue
    }
  },

  // User

  async getUser () {
    if (!this.shouldSendRequest()) { return }
    try {
      const options = this.options({ method: 'GET' })
      const response = await fetch(`${host}/user`, options)
      return this.normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },
  async getUserSpaces () {
    if (!this.shouldSendRequest()) { return }
    try {
      const options = this.options({ method: 'GET' })
      const response = await fetch(`${host}/user/spaces`, options)
      return this.normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },

  // Space

  async getSpace (spaceId) {
    try {
      if (!this.shouldSendRequest()) { return }
      console.log('🚛 Getting remote space', spaceId)
      const options = this.options({ method: 'GET' })
      const response = await utils.timeout(5000, fetch(`${host}/space/${spaceId}`, options))
      return this.normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },
  async createSpaces (apiKey) {
    try {
      const body = cache.getAllSpaces()
      const options = this.options({ body, apiKey, method: 'POST' })
      const response = await fetch(`${host}/space/multiple`, options)
      return this.normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  }

}
