import randomColor from 'randomcolor'
import nanoid from 'nanoid'

import utils from '@/utils.js'
import cache from '@/cache.js'

export default {
  namespaced: true,
  state: {
    id: nanoid(),
    lastSpaceId: '',
    color: randomColor({ luminosity: 'light' }),
    name: undefined,
    defaultConnectionTypeId: '',
    lastReadNewStuffId: undefined,
    prefersDarkTheme: false,
    apiKey: '',
    arenaAccessToken: '',
    favoriteUsers: [],
    favoriteSpaces: [],
    cardsCreatedCount: 0,
    isUpgraded: false
  },
  getters: {
    isCurrentUser: (state) => (user) => {
      return Boolean(state.id === user.id)
    },
    isSignedIn: (state) => {
      return Boolean(state.apiKey)
    },
    canEditSpace: (state, getters, rootState) => (space) => {
      space = space || rootState.currentSpace
      const spaceIsOpen = space.privacy === 'open'
      const currentUserIsSignedIn = getters.isSignedIn
      const canEditOpenSpace = spaceIsOpen && currentUserIsSignedIn
      const isSpaceMember = getters.isSpaceMember(space)
      return canEditOpenSpace || isSpaceMember
    },
    cardIsCreatedByCurrentUser: (state, getters, rootState) => (card) => {
      return state.id === card.userId
    },
    connectionIsCreatedByCurrentUser: (state, getters, rootState) => (connection) => {
      return state.id === connection.userId
    },
    isSpaceMember: (state, getters, rootState) => (space) => {
      space = space || rootState.currentSpace
      const isSpaceUser = getters.isSpaceUser(space)
      const isSpaceCollaborator = getters.isSpaceCollaborator(space)
      return isSpaceUser || isSpaceCollaborator
    },
    isSpaceUser: (state, getters, rootState) => (space) => {
      let userIsInSpace
      if (space.users) {
        userIsInSpace = Boolean(space.users.find(user => {
          return user.id === state.id
        }))
      } else {
        userIsInSpace = space.userId === state.id
      }
      return userIsInSpace
    },
    isSpaceCollaborator: (state, getters, rootState) => (space) => {
      space = space || rootState.currentSpace
      if (space.collaborators) {
        return Boolean(space.collaborators.find(collaborator => {
          return collaborator.id === state.id
        }))
      }
    },
    spaceUserPermission: (state, getters, rootState) => (space) => {
      space = space || rootState.currentSpace
      const isSpaceUser = getters.isSpaceUser(space)
      const isSpaceCollaborator = getters.isSpaceCollaborator(space)
      const spaceHasNoUsers = !space.users.length
      if (isSpaceUser || spaceHasNoUsers) {
        return 'user'
      } else if (isSpaceCollaborator) {
        return 'collaborator'
      } else {
        return 'spectator'
      }
    },
    isInvitedButCannotEditSpace: (state, getters, rootState) => (space) => {
      space = space || rootState.currentSpace
      const currentUserIsSignedIn = getters.isSignedIn
      const isInvitedToSpace = Boolean(cache.invitedSpaces().find(invitedSpace => invitedSpace.id === space.id))
      return !currentUserIsSignedIn && isInvitedToSpace
    }
  },
  mutations: {
    color: (state, newColor) => {
      state.color = newColor
      cache.updateUser('color', newColor)
    },
    name: (state, newName) => {
      state.name = newName
      cache.updateUser('name', newName)
    },
    lastSpaceId: (state, spaceId) => {
      state.lastSpaceId = spaceId
      cache.updateUser('lastSpaceId', spaceId)
    },
    resetLastSpaceId: (state) => {
      const spaces = cache.getAllSpaces()
      const lastSpace = spaces[1]
      if (lastSpace) {
        state.lastSpaceId = lastSpace.id
      } else {
        state.lastSpaceId = ''
      }
      cache.updateUser('lastSpaceId', state.lastSpaceId)
    },
    lastReadNewStuffId: (state, newStuffId) => {
      state.lastReadNewStuffId = newStuffId
      cache.updateUser('lastReadNewStuffId', newStuffId)
    },
    defaultConnectionTypeId: (state, typeId) => {
      state.defaultConnectionTypeId = typeId
      cache.updateUser('defaultConnectionTypeId', typeId)
    },
    apiKey: (state, apiKey) => {
      state.apiKey = apiKey
      cache.updateUser('apiKey', apiKey)
    },
    favoriteUsers: (state, users) => {
      utils.typeCheck(users, 'array')
      state.favoriteUsers = users
      cache.updateUser('favoriteUsers', users)
    },
    favoriteSpaces: (state, spaces) => {
      utils.typeCheck(spaces, 'array')
      state.favoriteSpaces = spaces
      cache.updateUser('favoriteSpaces', spaces)
    },
    restoreUser: (state, user) => {
      Object.keys(user).forEach(item => {
        state[item] = user[item]
      })
    },
    updateUser: (state, user) => {
      Object.keys(state).forEach(item => {
        if (user[item]) {
          state[item] = user[item]
        }
      })
      cache.saveUser(user)
    },
    // Aug 2019 migration
    updateBetaUserId: (state, newId) => {
      if (state.id === '1') {
        const newId = nanoid()
        state.id = newId
        cache.updateUser('id', newId)
      }
      // Oct 2019 migration
      if (!state.apiKey) {
        state.apiKey = ''
      }
    },
    arenaAccessToken: (state, token) => {
      state.arenaAccessToken = token
      cache.updateUser('arenaAccessToken', token)
    },
    cardsCreatedCount: (state, { increment }) => {
      if (state.isUpgraded) { return }
      if (increment) {
        state.cardsCreatedCount = Math.max(state.cardsCreatedCount + 1, 0)
      } else {
        state.cardsCreatedCount = Math.max(state.cardsCreatedCount - 1, 0)
      }
      cache.updateUser('cardsCreatedCount', state.cardsCreatedCount)
      console.log('🥬 card count', state.cardsCreatedCount)
    }
  },
  actions: {
    init: (context) => {
      const cachedUser = cache.user()
      if (utils.objectHasKeys(cachedUser)) {
        console.log('🌸 Restore user from cache', cachedUser.id)
        context.commit('restoreUser', cachedUser)
        context.commit('updateBetaUserId')
        context.dispatch('restoreRemoteUser', cachedUser)
      } else {
        console.log('🌸 Create new user')
        context.dispatch('createNewUser')
      }
    },
    createNewUser: (context) => {
      cache.saveUser(context.state)
    },
    broadcastUpdate: (context, updates) => {
      const space = context.rootState.currentSpace
      const spaceUserPermission = utils.capitalizeFirstLetter(context.getters.spaceUserPermission(space)) // User, Collaborator, Spectator
      const type = `update${spaceUserPermission}`
      const userId = context.state.id
      context.commit('broadcast/updateUser', { id: space.id, updates, type, userId }, { root: true })
    },
    name: (context, newName) => {
      context.commit('name', newName)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          name: newName
        } }, { root: true })
      context.dispatch('broadcastUpdate', { name: newName })
    },
    color: (context, newColor) => {
      context.commit('color', newColor)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          color: newColor
        } }, { root: true })
      context.dispatch('broadcastUpdate', { color: newColor })
    },
    lastSpaceId: (context, spaceId) => {
      context.commit('notifySpaceNotFound', false, { root: true })
      context.commit('lastSpaceId', spaceId)
      cache.updateUser('lastSpaceId', spaceId)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          lastSpaceId: spaceId
        } }, { root: true })
    },
    lastReadNewStuffId: (context, newStuffId) => {
      context.commit('lastReadNewStuffId', newStuffId)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          lastReadNewStuffId: newStuffId
        } }, { root: true })
    },
    defaultConnectionTypeId: (context, typeId) => {
      context.commit('defaultConnectionTypeId', typeId)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          defaultConnectionTypeId: typeId
        } }, { root: true })
    },
    restoreRemoteUser: async (context, cachedUser) => {
      if (!context.getters.isSignedIn) { return }
      const remoteUser = await context.dispatch('api/getUser', null, { root: true })
      if (!remoteUser) { return }
      remoteUser.updatedAt = utils.normalizeToUnixTime(remoteUser.updatedAt)
      if (remoteUser.updatedAt > cachedUser.cacheDate) { console.log('🌸 Restore user from remote', remoteUser) }
      context.commit('updateUser', remoteUser)
    },
    restoreUserFavorites: async (context) => {
      if (!context.getters.isSignedIn) { return }
      let favorites = {
        favoriteUsers: [],
        favoriteSpaces: []
      }
      favorites = await context.dispatch('api/getUserFavorites', null, { root: true }) || favorites
      context.commit('favoriteUsers', favorites.favoriteUsers)
      context.commit('favoriteSpaces', favorites.favoriteSpaces)
    },
    addFavorite: (context, { type, item }) => {
      context.commit('notifyAccessFavorites', true, { root: true })
      if (type === 'user') {
        let favorites = utils.clone(context.state.favoriteUsers)
        let favorite = {
          id: item.id,
          name: item.name,
          color: item.color
        }
        favorites.push(favorite)
        context.commit('favoriteUsers', favorites)
      } else if (type === 'space') {
        let favorites = utils.clone(context.state.favoriteSpaces)
        let favorite = {
          id: item.id,
          name: item.name,
          privacy: item.privacy,
          showInExplore: item.showInExplore,
          users: item.users
        }
        favorites.push(favorite)
        context.commit('favoriteSpaces', favorites)
      }
      context.dispatch('api/addToQueue', { name: 'addOrRemoveFavorite',
        body: { type, id: item.id }
      }, { root: true })
    },
    removeFavorite: (context, { type, item }) => {
      context.commit('notifyAccessFavorites', false, { root: true })
      if (type === 'user') {
        let favorites = utils.clone(context.state.favoriteUsers)
        favorites = favorites.filter(favorite => {
          return favorite.id !== item.id
        })
        context.commit('favoriteUsers', favorites)
      } else if (type === 'space') {
        let favorites = utils.clone(context.state.favoriteSpaces)
        favorites = favorites.filter(favorite => {
          return favorite.id !== item.id
        })
        context.commit('favoriteSpaces', favorites)
      }
      context.dispatch('api/addToQueue', { name: 'addOrRemoveFavorite',
        body: { type, id: item.id }
      }, { root: true })
    },
    confirmEmail: (context) => {
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          emailIsVerified: true
        }
      }, { root: true })
    },
    arenaAccessToken: (context, token) => {
      context.commit('arenaAccessToken', token)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          arenaAccessToken: token
        }
      }, { root: true })
    },
    updateArenaAccessToken: async (context, arenaReturnedCode) => {
      console.log('updateArenaAccessToken')
      context.commit('importArenaChannelIsVisible', true, { root: true })
      context.commit('isAuthenticatingWithArena', true, { root: true })
      const response = await context.dispatch('api/updateArenaAccessToken', arenaReturnedCode, { root: true })
      context.commit('arenaAccessToken', response.arenaAccessToken)
      context.commit('importArenaChannelIsVisible', true, { root: true })
      context.commit('isAuthenticatingWithArena', false, { root: true })
    }
  }
}
