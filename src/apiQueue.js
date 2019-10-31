import _ from 'lodash'

import api from '@/api.js'
import cache from '@/cache.js'
import utils from '@/utils.js'

window.onload = () => {
  self.process()
  // setInterval(() => {
  //   self.process()
  // }, 5 * 1000) // 5 seconds
}

const processQueue = _.debounce(async () => {
  self.process()
}, 500, {
  leading: true
})

const self = {

  async add (name, body) {
    // const userIsContributor = cache.space(space.id).contributorKey or key stored in user
    body = utils.clone(body)
    const userIsSignedIn = cache.user().apiKey
    if (!userIsSignedIn) { return }
    let queue = cache.queue()
    const request = {
      name,
      body
    }
    queue.push(request)
    cache.saveQueue(queue)
    processQueue()
  },

  squash (queue) {
    let squashed = []
    queue.forEach(request => {
      const isSquashed = squashed.find(item => {
        return item.name === request.name && item.body.id === request.body.id
      })
      if (isSquashed) { return }
      const matches = queue.filter(item => {
        return item.name === request.name && item.body.id === request.body.id
      })
      const reduced = matches.reduce((accumulator, currentValue) => _.merge(accumulator, currentValue))
      reduced.name = request.name
      squashed.push(reduced)
    })
    return squashed
  },

  async process () {
    if (!window.navigator.onLine) { return }
    const queue = cache.queue()
    const squashed = this.squash(queue)
    cache.clearQueue()
    await api.processQueue(squashed)
  }

}

export default self
