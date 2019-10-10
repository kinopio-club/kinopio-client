// local storage cache interface for currentUser and spaces

export default {
  storeLocal (key, value) {
    try {
      window.localStorage[key] = JSON.stringify(value)
    } catch (error) {
      console.warn('Could not save to localStorage. (localStorage is disabled in private Safari windows)')
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
    } catch (error) {}
  },
  removeAll () {
    window.localStorage.clear()
  },

  // user

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

  // space

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

  // removed spaces

  removedSpace (spaceId) {
    return this.getLocal(`space-${spaceId}`) || {}
  },
  removeSpace (spaceId) {
    this.updateSpace('removeDate', Date.now(), spaceId)
    const spaceKey = `space-${spaceId}`
    const space = this.getLocal(spaceKey)
    this.storeLocal(`removed-${spaceKey}`, space)
    this.removeLocal(spaceKey)
  },
  removeRemovedSpace (spaceId) {
    const spaceKey = `removed-space-${spaceId}`
    this.removeLocal(spaceKey)
  },
  restoreSpace (spaceId) {
    const spaceKey = `removed-space-${spaceId}`
    const space = this.getLocal(spaceKey)
    this.storeLocal(`space-${spaceId}`, space)
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

  // api queue

  queue () {
    return this.getLocal('queue') || []
  },
  saveQueue (queue) {
    this.storeLocal('queue', queue)
  }

}
