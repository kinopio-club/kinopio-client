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

  // user

  user () {
    return this.getLocal('user') || {}
  },
  getUser (key) {
    return this.user()[key]
  },
  updateUser (key, value) {
    let user = this.user()
    user[key] = value
    this.storeLocal('user', user)
    this.saveCacheDate()
  },
  saveUser (user) {
    this.storeLocal('user', user)
    this.saveCacheDate()
  },

  // space
  space (spaceId) {
    return this.getLocal(`space-${spaceId}`) || {}
  },
  getSpace (key, spaceId) {
    return this.space(spaceId)[key]
  },
  updateSpace (key, value, spaceId) {
    let space = this.space(spaceId)
    space[key] = value
    this.storeLocal(`space-${spaceId}`, space)
    this.saveCacheDate()
  },
  saveSpace (space) {
    this.storeLocal(`space-${space.id}`, space)
    this.saveCacheDate()
  },

  // cache date
  cacheDate () {
    return this.getLocal('cache-date') || {}
  },
  saveCacheDate () {
    this.storeLocal('cache-date', Date.now())
  }
}
