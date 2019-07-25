// local storage cache interface for currentUser and spaces
import _ from 'lodash'

const debouncedSaveSpace = _.debounce((space) => {
  cache.storeLocal(`space-${space.id}`, space)
}, 500)

const debouncedUpdateUser = _.debounce((key, value) => {
  let user = cache.user()
  user[key] = value
  cache.storeLocal('user', user)
}, 200, { leading: true })

const cache = {
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
    debouncedUpdateUser(key, value)
  },
  saveUser (user) {
    cache.storeLocal('user', user)
  },

  // space
  space (spaceId) {
    return this.getLocal(`space-${spaceId}`) || {}
  },
  getSpace (key, spaceId) {
    return this.space(spaceId)[key]
  },
  // updateSpace (key, value, spaceId) {
  //   let space = this.space(spaceId)
  //   space[key] = value
  //   this.storeLocal(`space-${spaceId}`, space)
  // },
  saveSpace (space) {
    debouncedSaveSpace(space)
  }
}

export default cache
