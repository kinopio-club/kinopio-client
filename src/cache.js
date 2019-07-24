// local storage cache system for currentUser and spaces

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

  getLocalUser () {
    return this.getLocal('user') || {}
  },

  getUser (key) {
    return this.getLocalUser()[key]
  },

  updateUser (key, value) {
    let user = this.getLocalUser()
    user[key] = value
    this.storeLocal('user', user)
  },

  // space

  getLocalSpace (spaceId) {
    return this.getLocal(`space-${spaceId}`) || {}
  },

  getSpace (key, spaceId) {
    return this.getLocalSpace(spaceId)[key]
  },

  updateSpace (key, value, spaceId) {
    let space = this.getLocalSpace(spaceId)
    space[key] = value
    this.storeLocal(`space-${spaceId}`, space)
  },

  createSpace (space) {
    this.storeLocal(`space-${space.id}`, space)
  }

}
