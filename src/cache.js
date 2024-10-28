// local storage cache interface for currentUser and spaces

import debounce from 'lodash-es/debounce'
// import indexedDb from 'idb-keyval' // { get, set, delMany, clear, keys }

import utils from '@/utils.js'

const updateErrorMessage = '🚑 could not updateSpace cache because cachedSpace does not exist (ignore if space is read-only or open)'
let showDebugMessages = false

export default {
  storeLocal (key, value) {
    try {
      if (typeof value !== 'string') {
        value = JSON.stringify(value)
      }
      if (showDebugMessages) {
        console.log('🏬 storeLocal', key, value)
      }
      window.localStorage.setItem(key, value)
      // indexedDb.set(key, value)
    } catch (error) {
      showDebugMessages = true
      console.error('🚒 storeLocal could not save to localStorage', { key, value, valueType: typeof value }, error)
      this.notifyCouldNotSave()
      this.pruneLocal()
    }
  },
  notifyCouldNotSave () {
    const element = document.getElementById('notify-cache-is-full')
    element.classList.remove('hidden')
  },
  pruneLocal () {
    if (this.user().apiKey) {
      const currentSpaceId = utils.spaceIdFromUrl()
      if (!currentSpaceId) {
        console.error('🚒 prune error could not get currentSpaceId', currentSpaceId)
        this.notifyCouldNotSave()
        return
      }
      const keys = Object.keys(window.localStorage)
      // const keys = await indexedDb.keys()
      let spaceKeys = keys.filter(key => {
        const isSpace = key.startsWith('space-') || key.startsWith('removed-space-')
        return isSpace
      })
      spaceKeys = spaceKeys.filter(key => key !== `space-${currentSpaceId}`)
      // TODO need to prune indexedb?
      console.log('🍾 pruning localStorage spaces', {
        localStorage: window.localStorage,
        length: JSON.stringify(window.localStorage).length,
        currentSpaceId,
        keys,
        spaceKeysToRemove: spaceKeys
      })
      spaceKeys.forEach(key => {
        this.removeLocal(key)
      })
      // indexedDb.delMany(spaceKeys) // replaces forEach above
      console.log('🥂 pruned localStorage spaces', {
        localStorage: window.localStorage,
        length: JSON.stringify(window.localStorage).length,
        currentLocalStorageKeys: Object.keys(window.localStorage)
      })
    }
    this.notifyCouldNotSave()
  },
  getLocal (key) {
    try {
      return JSON.parse(window.localStorage[key])
      // const item = await indexedDB.get(key)
      // return JSON.parse(item)
    } catch (error) {}
  },
  removeLocal (key) {
    try {
      window.localStorage.removeItem(key)
      // indexedDb.del(key)
    } catch (error) {
      console.warn('removeLocal', error)
    }
  },
  removeAll () {
    window.localStorage.clear()
    // indexedDB.clear()
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
    const space = this.getLocal(`space-${spaceId}`) || {}
    space.clients = []
    return space
  },
  getInboxSpace () {
    const keys = Object.keys(window.localStorage)
    // const keys = await indexedDb.keys()
    const spaceKeys = keys.filter(key => key.startsWith('space-'))
    const spaces = spaceKeys.map(key => {
      return this.getLocal(key)
    })
    return spaces.find(space => space.name === 'Inbox')
  },
  getSpaceByName (name) {
    const keys = Object.keys(window.localStorage)
    // const keys = await indexedDb.keys()
    const spaceKeys = keys.filter(key => key.startsWith('space-'))
    const spaces = spaceKeys.map(key => {
      return this.getLocal(key)
    })
    const space = spaces.find(space => space.name === name)
    if (space) {
      space.clients = []
    }
    return space
  },
  getAllSpaces () {
    const keys = Object.keys(window.localStorage)
    // const keys = await indexedDb.keys()
    const spaceKeys = keys.filter(key => key.startsWith('space-'))
    const spaces = spaceKeys.map(key => {
      return this.getLocal(key)
    })
    let spacesWithNames = spaces.map(space => {
      if (!space) { return }
      space.name = space.name || `space-${space.id}`
      return space
    })
    spacesWithNames = spacesWithNames.filter(space => Boolean(space))
    const sortedSpaces = spacesWithNames.sort((a, b) => {
      return b.cacheDate - a.cacheDate
    })
    return sortedSpaces
  },
  updateSpace (key, value, spaceId) {
    let space = this.space(spaceId)
    if (!utils.objectHasKeys(space)) {
      console.warn(updateErrorMessage)
      return
    }
    const normalizeKeys = ['cards', 'connections', 'connectionTypes', 'boxes']
    if (normalizeKeys.includes(key)) {
      value = utils.denormalizeItems(value)
    }
    space[key] = value
    space.clients = []
    space.cacheDate = Date.now()
    this.saveSpace(space)
  },
  updateSpaceCardsDebounced: debounce(function (cards, spaceId) {
    cards = utils.denormalizeItems(cards)
    let space = this.space(spaceId)
    if (!utils.objectHasKeys(space)) {
      console.warn(updateErrorMessage)
      return
    }
    cards = utils.denormalizeItems(cards)
    space.cards = cards
    space.cacheDate = Date.now()
    this.saveSpace(space)
  }, 200),
  updateSpaceConnectionsDebounced: debounce(function (connections, spaceId) {
    connections = utils.denormalizeItems(connections)
    let space = this.space(spaceId)
    if (!utils.objectHasKeys(space)) {
      console.warn(updateErrorMessage)
      return
    }
    space.connections = connections
    space.cacheDate = Date.now()
    this.saveSpace(space)
  }, 200),
  updateSpaceBoxesDebounced: debounce(function (boxes, spaceId) {
    boxes = utils.denormalizeItems(boxes)
    let space = this.space(spaceId)
    if (!utils.objectHasKeys(space)) {
      console.warn(updateErrorMessage)
      return
    }
    boxes = utils.denormalizeItems(boxes)
    space.boxes = boxes
    space.cacheDate = Date.now()
    this.saveSpace(space)
  }, 200),
  addToSpace ({ cards, connections, connectionTypes, boxes }, spaceId) {
    // space items
    let space = this.space(spaceId)
    space.cards = space.cards || []
    space.connections = space.connections || []
    space.connectionTypes = space.connectionTypes || []
    space.boxes = space.boxes || []
    // new items
    cards = cards || []
    connections = connections || []
    connectionTypes = connectionTypes || []
    boxes = boxes || []
    // add new items
    cards.forEach(card => space.cards.push(card))
    connections.forEach(connection => space.connections.push(connection))
    connectionTypes.forEach(connectionType => space.connectionTypes.push(connectionType))
    boxes.forEach(box => space.boxes.push(box))
    this.saveSpace(space)
  },
  saveSpace (space) {
    if (!space.id) {
      console.warn('☎️ error caching space. This is expected if currentUser is read only', space)
      return
    }
    space.cacheDate = Date.now()
    this.storeLocal(`space-${space.id}`, space)
  },
  updateIdsInSpace (space, nullCardUsers) {
    const items = {
      cards: space.cards,
      connectionTypes: space.connectionTypes,
      connections: space.connections,
      tags: space.tags,
      boxes: space.boxes
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
    space.boxes = uniqueItems.boxes
    this.saveSpace(space)
    return space
  },
  addSpaces (spaces) {
    spaces.forEach(space => {
      space.cacheDate = utils.normalizeToUnixTime(space.updatedAt)
      this.saveSpace(space)
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
  deleteSpace (space) {
    this.removeLocal(`removed-space-${space.id}`)
    this.removeLocal(`space-${space.id}`)
  },
  restoreRemovedSpace (space) {
    const spaceKey = `removed-space-${space.id}`
    space = this.getLocal(spaceKey)
    if (!space) { return }
    this.saveSpace(space)
    this.removeLocal(spaceKey)
  },
  getAllRemovedSpaces () {
    const keys = Object.keys(window.localStorage)
    // const keys = await indexedDb.keys()
    const spaceKeys = keys.filter(key => key.startsWith('removed-space-'))
    const spaces = spaceKeys.map(key => {
      return this.getLocal(key)
    })
    let sortedSpaces = spaces.sort((a, b) => {
      return b.removeDate - a.removeDate
    })
    sortedSpaces = sortedSpaces.filter(space => Boolean(space))
    return sortedSpaces
  },

  // Groups

  groups () {
    return this.getLocal('groups') || {}
  },
  saveGroups (groups) {
    this.storeLocal('groups', groups)
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

  // Add Page

  prevAddPageValue () {
    // const value = await indexedDB.get('prevAddPageValue')
    // return value || ''
    return window.localStorage['prevAddPageValue'] || ''
  },
  updatePrevAddPageValue (value) {
    this.storeLocal(`prevAddPageValue`, value)
  },
  clearPrevAddPageValue (value) {
    this.storeLocal(`prevAddPageValue`, '')
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

  // API Sending in Progress Queue
  // queue items are moved here at api.sendQueue

  sendingQueue () {
    return this.getLocal('sendingQueue') || []
  },
  saveSendingQueue (queue) {
    this.storeLocal('sendingQueue', queue)
  },
  clearSendingQueue () {
    this.storeLocal('sendingQueue', [])
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

  // Changelog

  prevChangelogId () {
    // return indexedDB.get('prevChangelogId')
    return window.localStorage['prevChangelogId']
  },
  updatePrevChangelogId (id) {
    this.storeLocal('prevChangelogId', id)
  },
  prevReadChangelogId () {
    // const value = await indexedDB.get('prevReadChangelogId')
    // return value || ''
    return window.localStorage['prevReadChangelogId'] || ''
  },
  updatePrevReadChangelogId (id) {
    this.storeLocal('prevReadChangelogId', id)
  }

}
