// https://www.notion.so/kinopio/API-docs

import nanoid from 'nanoid'

import cache from '@/cache.js'

let queue = cache.queue() // []
let host = 'https://api.kinopio.club'
if (process.env.NODE_ENV === 'development') {
  host = 'http://kinopio.local:3000'
}

export default {
  options (body) {
    const headers = new Headers({ 'Content-Type': 'application/json' })
    const apiKey = cache.user().apiKey
    if (apiKey) {
      headers.append('Authorization', apiKey)
    }
    return {
      method: 'POST',
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

  async postSpaces (request) {
    console.log('🌸', request)
    // id findone
    // POST /spaces
    // runs on completion of task with matching task name `this[taskName](response)`

    // after remove item from queue

    // run the request (by taskId) (will run if concurrency is less than threshold)
  },

  // queue items have to do distinct things when they're done
  // so add them to queue, and then have them run a private function here (api.queue ({taskName:uploadAllSpaces})) ,

  // taskName shøuld be based on route

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

    // on request completion, remove it from the request (removeFromQueue), or change the state if fails in a catch

    // check concurrency filter length (>3 things) {return}
    //
  },

  // when ur offline? might not be needed cuz catch will set isActive: false
  // async pause () {
  // isActive: false all
  // }
  // change state
  // cache.saveQueue(queue)
  // },
  // }
  // queue:
  // see npm queue and kinopio space
  // process/draim queue, handles reconnecting (see are.na/airtable/trello api client?)

  handleQueueError (requestId) {
    const index = queue.findIndex(request => request.id === requestId)
    if (index >= 0) {
      queue[index].isActive = false
      cache.saveQueue(queue)
    }
  }

}
