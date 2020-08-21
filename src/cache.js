// local storage cache interface for currentUser and spaces

import utils from '@/utils.js'

export default {
  storeLocal (key, value) {
    try {
      window.localStorage[key] = JSON.stringify(value)
    } catch (error) {
      console.warn('storeLocal could not save to localStorage')
      if (this.user().apiKey) {
        console.log('🐇 pruning localStorage spaces')
        const currentSpaceId = utils.idFromUrl()
        const keys = Object.keys(window.localStorage)
        let spaceKeys = keys.filter(key => key.startsWith('space-') || key.startsWith('removed-space-'))
        spaceKeys = spaceKeys.filter(key => key !== `space-${currentSpaceId}`)
        spaceKeys.forEach(key => {
          this.removeLocal(key)
        })
      } else {
        const element = document.getElementById('notify-local-storage-is-full')
        element.classList.remove('hidden')
      }
    }
  },
  getLocal (key) {
    try {
      return JSON.parse(window.localStorage[key])
    } catch (error) {}
  },
  removeLocal (key) {
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.warn('removeLocal', error)
    }
  },
  removeAll () {
    window.localStorage.clear()
  },

  // User

  user () {
    return this.getLocal('user') || {}
  },
  updateUser (key, value) {
    let user = this.user()
    user[key] = value
    this.storeLocal('user', user)
  },
  saveUser (user) {
    this.storeLocal('user', user)
  },

  // Space

  space (spaceId) {
    return this.getLocal(`space-${spaceId}`) || {}
  },
  getAllSpaces () {
    const keys = Object.keys(window.localStorage)
    const spaceKeys = keys.filter(key => key.startsWith('space-'))
    const spaces = spaceKeys.map(key => {
      return this.getLocal(key)
    })
    const spacesWithNames = spaces.map(space => {
      space.name = space.name || `space-${space.id}`
      return space
    })
    const sortedSpaces = spacesWithNames.sort((a, b) => {
      return b.cacheDate - a.cacheDate
    })
    return sortedSpaces
  },
  updateSpace (key, value, spaceId) {
    let space = this.space(spaceId)
    space[key] = value
    space.cacheDate = Date.now()
    this.storeLocal(`space-${spaceId}`, space)
  },
  addToSpace ({ cards, connections, connectionTypes }, spaceId) {
    let space = this.space(spaceId)
    cards.forEach(card => space.cards.push(card))
    connections.forEach(connection => space.connections.push(connection))
    connectionTypes.forEach(connectionType => space.connectionTypes.push(connectionType))
    this.storeLocal(`space-${spaceId}`, space)
  },
  // Added aug 2019, can safely remove this in aug 2020
  updateBetaSpaceId (newId) {
    const updatedSpace = this.space('1')
    updatedSpace.id = newId
    this.storeLocal(`space-${newId}`, updatedSpace)
    this.removeLocal('space-1')
  },
  saveSpace (space) {
    space.cacheDate = Date.now()
    this.storeLocal(`space-${space.id}`, space)
  },
  updateIdsInSpace (space) {
    const items = {
      cards: space.cards,
      connectionTypes: space.connectionTypes,
      connections: space.connections
    }
    const uniqueItems = utils.uniqueSpaceItems(items)
    space.cards = uniqueItems.cards
    space.connectionTypes = uniqueItems.connectionTypes
    space.connections = uniqueItems.connections
    this.storeLocal(`space-${space.id}`, space)
    return space
  },
  addSpaces (spaces) {
    spaces.forEach(space => {
      space.cacheDate = utils.normalizeToUnixTime(space.updatedAt)
      this.storeLocal(`space-${space.id}`, space)
    })
  },

  // Removed Spaces

  removeSpace (space) {
    this.updateSpace('removeDate', Date.now(), space.id)
    const spaceKey = `space-${space.id}`
    space = this.getLocal(spaceKey)
    this.storeLocal(`removed-${spaceKey}`, space)
    this.removeLocal(spaceKey)
  },
  removeSpacePermanent (space) {
    this.removeLocal(`removed-space-${space.id}`)
    this.removeLocal(`space-${space.id}`)
  },
  restoreRemovedSpace (space) {
    const spaceKey = `removed-space-${space.id}`
    space = this.getLocal(spaceKey)
    if (!space) { return }
    this.storeLocal(`space-${space.id}`, space)
    this.removeLocal(spaceKey)
  },
  getAllRemovedSpaces () {
    const keys = Object.keys(window.localStorage)
    const spaceKeys = keys.filter(key => key.startsWith('removed-space-'))
    const spaces = spaceKeys.map(key => {
      return this.getLocal(key)
    })
    const sortedSpaces = spaces.sort((a, b) => {
      return b.removeDate - a.removeDate
    })
    return sortedSpaces
  },

  // API Queue

  queue () {
    return this.getLocal('queue') || []
  },
  saveQueue (queue) {
    this.storeLocal('queue', queue)
  },
  clearQueue () {
    this.storeLocal('queue', [])
  },

  // API Queue Buffer

  queueBuffer () {
    return this.getLocal('queueBuffer') || []
  },
  saveQueueBuffer (queue) {
    this.storeLocal('queueBuffer', queue)
  },
  clearQueueBuffer () {
    this.storeLocal('queueBuffer', [])
  },

  // Invited Spaces

  invitedSpaces () {
    return this.getLocal('invitedSpaces') || []
  },
  saveInvitedSpace (space) {
    space = {
      id: space.id,
      name: space.name,
      users: space.users,
      collaboratorKey: space.collaboratorKey,
      updatedAt: space.updatedAt,
      cacheDate: Date.now()
    }
    let invitedSpaces = this.invitedSpaces()
    invitedSpaces = invitedSpaces.filter(invitedSpace => {
      return invitedSpace.id !== space.id
    })
    invitedSpaces.push(space)
    this.storeLocal('invitedSpaces', invitedSpaces)
  },
  removeInvitedSpace (space) {
    let invitedSpaces = this.invitedSpaces()
    invitedSpaces = invitedSpaces.filter(invitedSpace => {
      return invitedSpace.id !== space.id
    })
    this.storeLocal('invitedSpaces', invitedSpaces)
  },

  // billing

  saveStripeIds (stripeIds) {
    this.storeLocal('stripeIds', stripeIds)
  }
  // stripeIds () {
  //   return this.getLocal('stripeIds')
  // }

}
