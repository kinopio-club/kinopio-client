// local storage cache interface for currentUser and spaces

import debounce from 'lodash-es/debounce'

import utils from '@/utils.js'

export default {
  storeLocal (key, value) {
    try {
      window.localStorage[key] = JSON.stringify(value)
    } catch (error) {
      console.warn('🚑 storeLocal could not save to localStorage', error)
      this.pruneLocal()
    }
  },
  pruneLocal () {
    if (this.user().apiKey) {
      const currentSpaceId = utils.spaceIdFromUrl()
      const keys = Object.keys(window.localStorage)
      let spaceKeys = keys.filter(key => key.startsWith('space-') || key.startsWith('removed-space-'))
      spaceKeys = spaceKeys.filter(key => key !== `space-${currentSpaceId}`)
      spaceKeys.forEach(key => {
        this.removeLocal(key)
      })
      console.log('🐇 pruned localStorage spaces', spaceKeys)
    } else {
      const element = document.getElementById('notify-local-storage-is-full')
      element.classList.remove('hidden')
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
    console.log('🚑 localStorage cleared')
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
    if (!utils.objectHasKeys(space)) {
      console.warn('🚑 could not updateSpace cache because cachedSpace does not exist (ignore if read-only or open)')
      return
    }
    const normalizeKeys = ['cards', 'connections', 'connectionTypes']
    if (normalizeKeys.includes(key)) {
      value = utils.denormalizeItems(value)
    }
    space[key] = value
    space.cacheDate = Date.now()
    this.storeLocal(`space-${spaceId}`, space)
  },
  updateSpaceCardsDebounced: debounce(function (cards, spaceId) {
    cards = utils.denormalizeItems(cards)
    let space = this.space(spaceId)
    if (!utils.objectHasKeys(space)) {
      console.warn('🚑 could not updateSpace cache because cachedSpace does not exist (ignore if read-only or open)')
      return
    }
    cards = utils.denormalizeItems(cards)
    space.cards = cards
    space.cacheDate = Date.now()
    this.storeLocal(`space-${spaceId}`, space)
  }, 200),
  updateSpaceConnectionsDebounced: debounce(function (connections, spaceId) {
    connections = utils.denormalizeItems(connections)
    let space = this.space(spaceId)
    if (!utils.objectHasKeys(space)) {
      console.warn('🚑 could not updateSpace cache because cachedSpace does not exist (ignore if read-only or open)')
      return
    }
    space.connections = connections
    space.cacheDate = Date.now()
    this.storeLocal(`space-${spaceId}`, space)
  }, 200),
  addToSpace ({ cards, connections, connectionTypes }, spaceId) {
    let space = this.space(spaceId)
    cards.forEach(card => space.cards.push(card))
    connections.forEach(connection => space.connections.push(connection))
    connectionTypes.forEach(connectionType => space.connectionTypes.push(connectionType))
    this.storeLocal(`space-${spaceId}`, space)
  },
  saveSpace (space) {
    space.cacheDate = Date.now()
    this.storeLocal(`space-${space.id}`, space)
  },
  updateIdsInSpace (space, nullCardUsers) {
    const items = {
      cards: space.cards,
      connectionTypes: space.connectionTypes,
      connections: space.connections,
      tags: space.tags
    }
    const uniqueItems = utils.uniqueSpaceItems(items, nullCardUsers)
    space.cards = uniqueItems.cards.map(card => {
      card.spaceId = space.id
      return card
    })
    space.connectionTypes = uniqueItems.connectionTypes
    space.connections = uniqueItems.connections
    space.tags = uniqueItems.tags.map(tag => {
      tag.spaceId = space.id
      return tag
    })
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

  // Tags

  allCardsByTagName (name) {
    let spaces = this.getAllSpaces()
    let cards = [] // card name, id, spaceid
    spaces.forEach(space => {
      if (!space.tags) { return }
      const tags = space.tags.filter(tag => tag.name === name)
      if (!utils.arrayHasItems(tags)) { return }
      const cardIds = tags.map(tag => tag.cardId)
      space.cards.forEach(card => {
        if (cardIds.includes(card.id)) {
          card.spaceName = space.name
          cards.push(card)
        }
      })
    })
    return cards
  },
  tagByName (name) {
    let spaces = this.getAllSpaces()
    let tags = []
    spaces.forEach(space => {
      if (!utils.arrayHasItems(space.tags)) { return }
      tags = tags.concat(space.tags)
    })
    const tag = tags.find(tag => tag.name === name)
    return tag
  },
  allTags () {
    const spaces = this.getAllSpaces()
    let tags = []
    spaces.forEach(space => {
      if (utils.arrayHasItems(space.tags)) {
        space.tags.forEach(tag => tags.push(tag))
      }
    })
    tags.reverse()
    return tags
  },
  updateTagColorInAllSpaces (tag) {
    const spaces = this.getAllSpaces()
    spaces.forEach(space => {
      if (!space.tags) { return }
      const newSpaceTags = space.tags.map(spaceTag => {
        if (spaceTag.name === tag.name) {
          spaceTag.color = tag.color
        }
        return spaceTag
      })
      this.updateSpace('tags', newSpaceTags, space.id)
    })
  },
  removeTagsByNameInAllSpaces (tag) {
    const spaces = this.getAllSpaces()
    spaces.forEach(space => {
      if (!space.tags) { return }
      const newSpaceTags = space.tags.filter(spaceTag => spaceTag.name !== tag.name)
      this.updateSpace('tags', newSpaceTags, space.id)
    })
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

  // Billing

  saveStripeIds (stripeIds) {
    this.storeLocal('stripeIds', stripeIds)
  }
  // stripeIds () {
  //   return this.getLocal('stripeIds')
  // },

}
