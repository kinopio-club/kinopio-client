// local storage cache interface for currentUser and spaces

import utils from '@/utils.js'

export default {
  namespaced: true,
  state: {},
  mutations: {},
  actions: {
    storeLocal: (context, { key, value }) => {
      try {
        window.localStorage[key] = JSON.stringify(value)
      } catch (error) {
        console.warn('Could not save to localStorage')
      }
    },
    getLocal: (context, key) => {
      try {
        return JSON.parse(window.localStorage[key])
      } catch (error) {}
    },
    removeLocal: (context, key) => {
      try {
        window.localStorage.removeItem(key)
      } catch (error) {}
    },
    removeAll: (context) => {
      window.localStorage.clear()
    },

    // User

    user: (context) => {
      return this.getLocal('user') || {}
    },
    updateUser: (context, { key, value }) => {
      let user = this.user()
      user[key] = value
      this.storeLocal('user', user)
    },
    saveUser: (context, user) => {
      this.storeLocal('user', user)
    },

    // Space

    space: (context, spaceId) => {
      return this.getLocal(`space-${spaceId}`) || {}
    },
    getAllSpaces: (context) => {
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
    updateSpace: (context, { key, value, spaceId }) => {
      let space = this.space(spaceId)
      space[key] = value
      space.cacheDate = Date.now()
      this.storeLocal(`space-${spaceId}`, space)
    },
    // todo update callees: params format changed for spaceId
    addToSpace: (context, { cards, connections, connectionTypes, spaceId }) => {
      let space = this.space(spaceId)
      cards.forEach(card => space.cards.push(card))
      connections.forEach(connection => space.connections.push(connection))
      connectionTypes.forEach(connectionType => space.connectionTypes.push(connectionType))
      this.storeLocal(`space-${spaceId}`, space)
    },
    // Added aug 2019, can safely remove this in aug 2020
    updateBetaSpaceId: (context, newId) => {
      const updatedSpace = this.space('1')
      updatedSpace.id = newId
      this.storeLocal(`space-${newId}`, updatedSpace)
      this.removeLocal('space-1')
    },
    saveSpace: (context, space) => {
      space.cacheDate = Date.now()
      this.storeLocal(`space-${space.id}`, space)
    },
    updateIdsInAllSpaces: (context) => {
      let spaces = this.getAllSpaces()
      spaces.forEach(space => {
        this.updateIdsInSpace(space)
      })
    },
    updateIdsInSpace: (context, space) => {
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
    addSpaces: (context, spaces) => {
      spaces.forEach(space => {
        space.cacheDate = utils.normalizeToUnixTime(space.updatedAt)
        this.storeLocal(`space-${space.id}`, space)
      })
    },

    // Removed Spaces

    removeSpace: (context, space) => {
      this.updateSpace('removeDate', Date.now(), space.id)
      const spaceKey = `space-${space.id}`
      space = this.getLocal(spaceKey)
      this.storeLocal(`removed-${spaceKey}`, space)
      this.removeLocal(spaceKey)
    },
    removeSpacePermanent: (context, space) => {
      const spaceKey = `removed-space-${space.id}`
      this.removeLocal(spaceKey)
    },
    restoreSpace: (context, space) => {
      const spaceKey = `removed-space-${space.id}`
      space = this.getLocal(spaceKey)
      if (!space) { return }
      this.storeLocal(`space-${space.id}`, space)
      this.removeLocal(spaceKey)
    },
    getAllRemovedSpaces: (context) => {
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

    queue: (context) => {
      return this.getLocal('queue') || []
    },
    saveQueue: (context, queue) => {
      this.storeLocal('queue', queue)
    },
    clearQueue: (context) => {
      this.storeLocal('queue', [])
    }

  }
}
