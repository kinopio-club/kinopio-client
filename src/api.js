// https://www.notion.so/kinopio/API-docs

import cache from '@/cache.js'
import utils from '@/utils.js'

let host = 'https://api.kinopio.club'
if (process.env.NODE_ENV === 'development') {
  host = 'http://kinopio.local:3000'
}

export default {

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
      return this.normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },

  // Card

  async createCard (body) {
    const options = this.options({ body, method: 'POST' })
    return utils.timeout(5000, fetch(`${host}/card`, options))
  },
  async updateCard (body) {
    const options = this.options({ body, method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/card`, options))
  },
  async restoreCard (body) {
    const options = this.options({ body, method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/card/restore`, options))
  },
  async removeCard (body) {
    const options = this.options({ body, method: 'DELETE' })
    return utils.timeout(5000, fetch(`${host}/card`, options))
  },
  async removeCardPermanently (body) {
    const options = this.options({ body, method: 'DELETE' })
    return utils.timeout(5000, fetch(`${host}/card/permanent`, options))
  },

  // Connection

  async createConnection (body) {
    const options = this.options({ body, method: 'POST' })
    return utils.timeout(5000, fetch(`${host}/connection`, options))
  },
  async updateConnection (body) {
    const options = this.options({ body, method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/connection`, options))
  },
  async removeConnection (body) {
    const options = this.options({ body, method: 'DELETE' })
    return utils.timeout(5000, fetch(`${host}/connection`, options))
  },

  // Connection Type

  async createConnectionType (body) {
    const options = this.options({ body, method: 'POST' })
    return utils.timeout(5000, fetch(`${host}/connection-type`, options))
  },
  async updateConnectionType (body) {
    const options = this.options({ body, method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/connection-type`, options))
  },
  async removeConnectionType (body) {
    const options = this.options({ body, method: 'DELETE' })
    return utils.timeout(5000, fetch(`${host}/connection-type`, options))
  },

  // Space

  async getSpace (spaceId) {
    // TODO support getting other people's spaces later
    const userIsSignedIn = cache.user().apiKey
    if (!userIsSignedIn) { return }
    console.log('🚛 Getting remote space', spaceId)
    const options = this.options({ method: 'GET' })
    const response = await utils.timeout(5000, fetch(`${host}/space/${spaceId}`, options))
    return this.normalizeResponse(response)
  },
  async updateSpace (body) {
    const options = this.options({ body, method: 'PATCH' })
    return utils.timeout(5000, fetch(`${host}/space`, options))
  },
  async createSpace (body) {
    const options = this.options({ body, method: 'POST' })
    return utils.timeout(5000, fetch(`${host}/space`, options))
  },
  async createSpaces (apiKey) {
    try {
      const body = cache.getAllSpaces()
      const options = this.options({ body, apiKey, method: 'POST' })
      const response = await fetch(`${host}/space`, options)
      return this.normalizeResponse(response)
    } catch (error) {
      console.error(error)
    }
  },
  async removeSpace (body) {
    const options = this.options({ body, method: 'DELETE' })
    return utils.timeout(5000, fetch(`${host}/space`, options))
  },
  async removeSpacePermanently (body) {
    const options = this.options({ body, method: 'DELETE' })
    return utils.timeout(5000, fetch(`${host}/space/permanent`, options))
  }

}
