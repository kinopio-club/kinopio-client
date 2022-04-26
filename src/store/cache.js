// import debounce from 'lodash-es/debounce'

import utils from '@/utils.js'

// const updateErrorMessage = '🚑 could not updateSpace cache because cachedSpace does not exist (ignore if space is read-only or open)'
// let showDebugMessages = false

export default {
  namespaced: true,
  // state: {
  //   ids: [],
  //   connections: {},
  //   typeIds: [],
  //   types: {}
  // },
  mutations: {
    // clear: (state) => {
    //   state.ids = []
    //   state.connections = {}
    //   state.typeIds = []
    //   state.types = {}
    // },
  },
  actions: {

    // updateSpaceId: (context, spaceId) => {
    //   currentSpaceId = spaceId
    // },

  },
  getters: {
    getLocal: (state) => (key) => {
      try {
        return JSON.parse(window.localStorage[key])
      } catch (error) {}
    },

    // Spaces

    space: (state, getters) => (spaceId) => {
      return getters.getLocal(`space-${spaceId}`) || {}
    },
    allSpaces: (state, getters) => {
      const keys = Object.keys(window.localStorage)
      const spaceKeys = keys.filter(key => key.startsWith('space-'))
      const spaces = spaceKeys.map(key => {
        return getters.getLocal(key)
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
    allRemovedSpaces: (state, getters) => {
      const keys = Object.keys(window.localStorage)
      const spaceKeys = keys.filter(key => key.startsWith('removed-space-'))
      const spaces = spaceKeys.map(key => {
        return getters.getLocal(key)
      })
      const sortedSpaces = spaces.sort((a, b) => {
        return b.removeDate - a.removeDate
      })
      return sortedSpaces
    },

    // User

    user: (state, getters) => {
      return getters.getLocal('user') || {}
    },

    // Tags

    cardsByTagName: (state, getters) => (name) => {
      let spaces = getters.allSpaces
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
    tagByName: (state, getters) => (name) => {
      let spaces = getters.allSpaces
      let tags = []
      spaces.forEach(space => {
        if (!utils.arrayHasItems(space.tags)) { return }
        tags = tags.concat(space.tags)
      })
      const tag = tags.find(tag => tag.name === name)
      return tag
    },
    allTags: (state, getters) => {
      const spaces = getters.allSpaces
      let tags = []
      spaces.forEach(space => {
        if (utils.arrayHasItems(space.tags)) {
          space.tags.forEach(tag => tags.push(tag))
        }
      })
      tags.reverse()
      return tags
    },

    // API Queue

    queue: (state, getters) => {
      return getters.getLocal('queue') || []
    },
    queueBuffer: (state, getters) => {
      return getters.getLocal('queueBuffer') || []
    },

    // Invited Spaces

    invitedSpaces: (state, getters) => {
      return getters.getLocal('invitedSpaces') || []
    }
  }
}
