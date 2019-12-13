// 🐈 https://www.notion.so/kinopio/API-docs

// apiQueue.add('createSpace', space)
// dispatch('api/addToQueue' {name, body})

// api.getblah
// dispatch('api/getblah')

import debounce from 'lodash-es/debounce'
import merge from 'lodash-es/merge'

// import api from '@/api.js'
import cache from '@/cache.js'
import utils from '@/utils.js'

let host = 'https://api.kinopio.club'
if (process.env.NODE_ENV === 'development') {
  host = 'http://kinopio.local:3000'
}

window.onload = () => {
  console.log('🍆🍆window onload call api.process')
  self.actions.processQueueOperations()
}

const processQueue = debounce(async () => {
  self.actions.processQueueOperations()
}, 500, {
  leading: true
})

const squashQueue = (queue) => {
  let squashed = []
  queue.forEach(request => {
    // check if request has already been squashed
    const isSquashed = squashed.find(item => {
      return item.name === request.name && item.body.id === request.body.id
    })
    if (isSquashed) { return }
    // merge queue items with the same operation name and matching entity id
    const matches = queue.filter(item => {
      return item.name === request.name && item.body.id === request.body.id
    })
    const reduced = matches.reduce((accumulator, currentValue) => merge(accumulator, currentValue))
    reduced.name = request.name
    squashed.push(reduced)
  })
  return squashed
}

// const shouldRequest = () => {
//   const isOnline = window.navigator.onLine
//   const userIsSignedIn = cache.user().apiKey
//   if (isOnline && userIsSignedIn) {
//     return true
//   }
// }

const requestOptions = (options) => {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const apiKey = options.apiKey || cache.user().apiKey // || contributorKey
  if (apiKey) {
    headers.append('Authorization', apiKey)
  }
  return {
    method: options.method,
    headers,
    body: JSON.stringify(options.body)
  }
}

// const normalizeResponse = async (response) => {
//   const success = [200, 201, 202, 204]
//   const data = await response.json()
//   if (success.includes(response.status)) {
//     return data
//   } else {
//     throw { response, status: response.status }
//   }
// }

// const normalizeSpaceToRemote = (space) => {
//   if (!space.removedCards) { return }
//   space.removedCards.forEach(card => {
//     card.isRemoved = true
//     space.cards.push(card)
//   })
//   return space
// }

const self = {
  namespaced: true,
  state: {},
  mutations: {},
  actions: {

    // Queue

    addToQueue: (context, { name, body }) => {
      body = utils.clone(body)
      body.spaceId = context.rootState.currentSpace.id
      const userIsSignedIn = context.rootGetters['currentUser/isSignedIn']
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

    requeue: (context, items) => {
      items.forEach(item => {
        let queue = cache.queue()
        queue.push(item)
        cache.saveQueue(queue)
      })
      console.log('🚑 requeue', cache.queue())
    },

    processQueueOperations: async (context) => {
      if (!window.navigator.onLine) { return }
      const queue = cache.queue()
      const body = squashQueue(queue)
      cache.clearQueue()
      try {
        const options = requestOptions({ body, method: 'POST' })
        console.log(`🛫 sending operations`, body)
        await fetch(`${host}/operations`, options)
      } catch (error) {
        console.error('🚒', error, body)
        this.requeue(body)
      }
    }

    // Sign In or Up

  }

}

export default self
