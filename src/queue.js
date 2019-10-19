import _ from 'lodash'

import cache from '@/cache.js'
import api from '@/api.js'

let queueIsRunning = false

window.onload = () => {
  self.process()
  setInterval(() => {
    self.process()
  }, 60 * 1000) // 60 seconds
}

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
    _.debounce(_.wrap(this.process()), 5000) // 5 seconds
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
    self.squash()
    const queue = this.queue()
    const request = queue.shift()
    cache.saveQueue(queue)
    return request
  },
  async process () {
    if (queueIsRunning) { return }
    if (!window.navigator.onLine) { return }
    let queue = this.queue()
    if (!queue.length) { return }
    queueIsRunning = true
    let request
    do {
      try {
        request = this.next()
        await this.processRequest(request)
        console.log('✅', request)
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
    const response = await api[request.name](request.body)
    const normalizedResponse = await api.normalizeResponse(response)
    return normalizedResponse
  }
}

export default self
