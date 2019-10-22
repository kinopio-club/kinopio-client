import _ from 'lodash'

import cache from '@/cache.js'
import api from '@/api.js'

window.onload = () => {
  self.process()
  setInterval(() => {
    self.process()
  }, 60 * 1000) // 60 seconds
}

const processQueue = _.debounce(async () => {
  self.process()
}, 1000)

const self = {

  queue () {
    return cache.queue()
  },

  async add (name, body) {
    const userIsSignedIn = cache.user().apiKey
    if (!userIsSignedIn) { return }
    let queue = this.queue()
    const request = {
      name,
      body
    }
    queue.push(request)
    cache.saveQueue(queue)
    processQueue()
  },

  idsMatch (item, request) {
    let itemId, requestId
    if (item.body) {
      itemId = item.body.id
    } else {
      itemId = item.updates[0].id
    }
    if (request.body) {
      requestId = request.body.id
    } else {
      requestId = request.updates[0].id
    }
    return itemId === requestId
  },

  squash () {
    const queue = this.queue()
    let squashed = []
    queue.forEach(request => {
      const isSquashed = squashed.find(item => {
        return item.name === request.name && this.idsMatch(item, request)
      })
      if (isSquashed) { return }
      const matches = queue.filter(item => {
        return item.name === request.name && this.idsMatch(item, request)
      })
      const reduced = matches.reduce((accumulator, currentValue) => _.merge(accumulator, currentValue))
      reduced.name = request.name
      squashed.push(reduced)
    })
    cache.saveQueue(squashed)
  },

  group () {
    const queue = this.queue()
    let grouped = []
    queue.forEach(request => {
      const isGrouped = grouped.find(item => item.name === request.name)
      if (isGrouped) { return }
      const matches = queue.filter(item => item.name === request.name)
      const updates = matches.map(item => item.body)
      const group = {
        name: request.name,
        updates
      }
      grouped.push(group)
    })
    cache.saveQueue(grouped)
  },

  next () {
    const queue = this.queue()
    const request = queue.shift()
    cache.saveQueue(queue)
    return request
  },

  async process () {
    if (!window.navigator.onLine) { return }
    this.squash()
    this.group()
    let queue = this.queue()
    if (!queue.length) { return }

    let request
    do {
      try {
        request = this.next()
        await this.processRequest(request)
      } catch (error) {
        queue.push(request)
        console.error(error)
        console.log('🔁 Request error. Add back into queue to retry', request)
        cache.saveQueue(queue)
        break
      }
      queue = this.queue()
    } while (queue.length > 0)
  },

  async processRequest (request) {
    if (request.body) {
      request.updates = [request.body]
    }
    console.log('🚎 Processing request', request)
    const response = await api[request.name](request.updates)
    const normalizedResponse = await api.normalizeResponse(response)
    return normalizedResponse
  }
}

export default self
