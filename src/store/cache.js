// local storage cache interface for currentUser and spaces

import utils from '@/utils.js'

const localSpaceKey = (id) => {
  return `space-${id}`
}

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
      const user = context.dispatch('getLocal', 'user')
      return user || {}
    },
    updateUser: (context, { key, value }) => {
      let user = context.dispatch('user')
      user[key] = value
      context.dispatch('saveUser', user)
    },
    saveUser: (context, user) => {
      context.dispatch('storeLocal', { key: 'user', value: user })
    },

    // Space

    space: (context, spaceId) => {
      const space = context.dispatch('getLocal', localSpaceKey(spaceId))
      return space || {}
    },
    getAllSpaces: (context) => {
      const keys = Object.keys(window.localStorage)
      const spaceKeys = keys.filter(key => key.startsWith('space-'))
      const spaces = spaceKeys.map(key => {
        return context.dispatch('getLocal', key)
      })
      const spacesWithNames = spaces.map(space => {
        space.name = space.name || localSpaceKey(space.id)
        return space
      })
      const sortedSpaces = spacesWithNames.sort((a, b) => {
        return b.cacheDate - a.cacheDate
      })
      return sortedSpaces
    },
    updateSpace: (context, { key, value, spaceId }) => {
      let space = context.dispatch('space', spaceId)
      space[key] = value
      space.cacheDate = Date.now()
      context.dispatch('storeLocal', {
        key: localSpaceKey(spaceId),
        value: space
      })
    },
    // todo update callees: params format changed for spaceId
    addToSpace: (context, { cards, connections, connectionTypes, spaceId }) => {
      let space = context.dispatch('space', spaceId)
      cards.forEach(card => space.cards.push(card))
      connections.forEach(connection => space.connections.push(connection))
      connectionTypes.forEach(connectionType => space.connectionTypes.push(connectionType))
      context.dispatch('storeLocal', {
        key: localSpaceKey(spaceId),
        value: space
      })
    },
    // Added aug 2019, can safely remove this in aug 2020
    updateBetaSpaceId: (context, newId) => {
      const updatedSpace = context.dispatch('space', '1')
      updatedSpace.id = newId
      context.dispatch('storeLocal', {
        key: localSpaceKey(newId),
        value: updatedSpace
      })
      context.dispatch('removeLocal', 'space-1')
    },
    saveSpace: (context, space) => {
      space.cacheDate = Date.now()
      context.dispatch('storeLocal', {
        key: localSpaceKey(space.id),
        value: space
      })
    },
    updateIdsInAllSpaces: (context) => {
      let spaces = context.dispatch('getAllSpaces')
      spaces.forEach(space => {
        context.dispatch('updateIdsInSpace', space)
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
      context.dispatch('storeLocal', {
        key: localSpaceKey(space.id),
        value: space
      })

      return space
    },
    addSpaces: (context, spaces) => {
      spaces.forEach(space => {
        space.cacheDate = utils.normalizeToUnixTime(space.updatedAt)
        context.dispatch('storeLocal', {
          key: localSpaceKey(space.id),
          value: space
        })
      })
    },

    // Removed Spaces

    removeSpace: (context, space) => {
      context.dispatch('updateSpace', {
        key: 'removeDate',
        value: Date.now(),
        spaceId: space.id
      })
      const spaceKey = localSpaceKey(space.id)
      space = context.dispatch('getLocal', spaceKey)
      context.dispatch('storeLocal', {
        key: `removed-${spaceKey}`,
        value: space
      })
      context.dispatch('removeLocal', spaceKey)
    },
    removeSpacePermanent: (context, space) => {
      const spaceKey = `removed-space-${space.id}`
      context.dispatch('removeLocal', spaceKey)
    },
    restoreSpace: (context, space) => {
      const spaceKey = `removed-space-${space.id}`
      space = context.dispatch('getLocal', spaceKey)
      if (!space) { return }
      context.dispatch('storeLocal', {
        key: localSpaceKey(space.id),
        value: space
      })
      context.dispatch('removeLocal', spaceKey)
    },
    getAllRemovedSpaces: (context) => {
      const keys = Object.keys(window.localStorage)
      const spaceKeys = keys.filter(key => key.startsWith('removed-space-'))
      const spaces = spaceKeys.map(key => {
        return context.dispatch('getLocal', key)
      })
      const sortedSpaces = spaces.sort((a, b) => {
        return b.removeDate - a.removeDate
      })
      return sortedSpaces
    },

    // API Queue

    queue: (context) => {
      const queue = context.dispatch('getLocal', 'queue')
      return queue || []
    },
    saveQueue: (context, queue) => {
      context.dispatch('storeLocal', {
        key: 'queue',
        value: queue
      })
    },
    clearQueue: (context) => {
      context.dispatch('storeLocal', {
        key: 'queue',
        value: []
      })
    }

  }
}
