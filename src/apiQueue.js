import _ from 'lodash'

import api from '@/api.js'
import cache from '@/cache.js'
import utils from '@/utils.js'

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

  // may not need this anymore if i dont organically hit 429s, even in bulk operations
  // group () {
  //   // dont regroup: skip the grouping if is grouped (item has .upates array already)
  //   const queue = this.queue()
  //   let grouped = []
  //   queue.forEach(request => {
  //     const isGrouped = grouped.find(item => item.name === request.name)
  //     if (isGrouped) {return}
  //     const matches = queue.filter(item => item.name === request.name)
  //     const bodyUpdate = matches.map(item => item.body)
  //     const existingUpdates = matches.map(item => item.updates)
  //     // on first run, body becomes updates. so runnign this again on boot transforms updates to undefined
  //     // if updates come from updates, they nest in another array laywer cuz push
  //     console.log('matches', matches, bodyUpdate, existingUpdates)
  //     let group = {name: request.name}
  //     if (bodyUpdate) {
  //       group.updates = bodyUpdate
  //       grouped.push(group)
  //     } else {
  //       group.updates = existingUpdates
  //     }
  //     console.log('👯‍♀️group item', group) // can be [undefined]
  //   })
  //   cache.saveQueue(grouped)
  // },

  async process () {
    if (!window.navigator.onLine) { return }
    this.squash()
    // this.group()
    let queue = this.queue()
    if (!queue.length) { return }
    do {
      try {
        queue = this.queue()
        const request = queue[0]
        const response = await this.processRequest(request)
        console.log('✅ completed', response) // TODO slim server responses to improve transmission time
        queue.shift()
        cache.saveQueue(queue)
      } catch (error) {
        console.error('🚒', error)
        if (error.status === 404) {
          // TODO temp 404 handling, ideally prevent 404s from ever hapening
          // ,,create the entity,, immediately, then retry the queue.
          // notify the user (Syncing error, edits to this card won't save properly)
          queue.shift()
          cache.saveQueue(queue)
        } else {
          break
        }
      }
      queue = this.queue()
    } while (queue.length > 0)
  },

  async processRequest (request) {
    console.log('🚎 Processing request', request)
    const response = await api[request.name](request.body)
    const normalizedResponse = await api.normalizeResponse(response)
    return normalizedResponse
  }
}

export default self
