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

  getUser () {
    return this.getLocal('user') || {}
  },

  getUserProperty (key) {
    return this.getUser()[key]
  },

  updateUserProperties (key, value) {
    let prefs = this.getUser()
    prefs[key] = value
    this.storeLocal('user', prefs)
  }
}
