import _ from 'lodash'

import api from '@/api.js'
import cache from '@/cache.js'
import utils from '@/utils.js'

window.onload = () => {
  self.process()
  setInterval(() => {
    self.process()
  }, 20 * 1000) // 20 seconds
}

const processQueue = _.debounce(async () => {
  self.process()
}, 1000)

const self = {

  queue () {
    return cache.queue()
  },

  async add (name, body) {
    // const userIsContributor = cache.space(space.id).contributorKey or key stored in user
    body = utils.clone(body)
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

  async process () {
    if (!window.navigator.onLine) { return }
    this.squash()
    let queue = this.queue()
    if (!queue.length) { return }
    do {
      try {
        queue = this.queue()
        const request = queue[0]
        await this.processRequest(request)
        queue.shift()
        cache.saveQueue(queue)
      } catch (error) {
        console.error('🚒 retry', error)
        break
      }
      queue = this.queue()
    } while (queue.length > 0)
  },

  async processRequest (request) {
    console.log('🚎 Processing request', request)
    const response = await api[request.name](request.body)
    const normalized = await api.normalizeResponse(response)
    return normalized
  }
}

export default self
