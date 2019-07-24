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
    let prefs = this.getLocalUser()
    prefs[key] = value
    this.storeLocal('user', prefs)
  }

  // space

  // [have to pass space id to methods]

}
