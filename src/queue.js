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
  squash () {
    let queue = this.queue()
    let squashed = []
    queue.forEach(request => {
      const isSquashed = squashed.find(item => item.name === request.name && item.body.id === request.body.id)
      if (isSquashed) { return }
      const matches = queue.filter(item => item.name === request.name && item.body.id === request.body.id)
      const reduced = matches.reduce((accumulator, currentValue) => _.merge(accumulator, currentValue))
      reduced.name = request.name
      squashed.push(reduced)
    })
    cache.saveQueue(squashed)
  },
  next () {
    const queue = this.queue()
    const request = queue.shift()
    cache.saveQueue(queue)
    return request
  },
  async process () {
    if (!window.navigator.onLine) { return }
    self.squash()
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
    console.log('🚎 Processing request', request.name, request.body)
    const response = await api[request.name](request.body)
    const normalizedResponse = await api.normalizeResponse(response)
    return normalizedResponse
  }
}

export default self
