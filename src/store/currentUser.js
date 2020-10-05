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
    isUpgraded: false,
    filterShowUsers: false,
    filterShowDateUpdated: false,
    filterShowAbsoluteDates: false,
    journalQuestions: [
      {
        id: '1a',
        // userId
        name: "What's my mood?"
      },
      {
        id: '2b',
        // userid
        name: 'Did I eat well?'
      }
    ]
  },
  getters: {
    isCurrentUser: (state) => (user) => {
      return Boolean(state.id === user.id)
    },
    isSignedIn: (state) => {
      return Boolean(state.apiKey)
    },
    cardsCreatedIsOverLimit: (state) => {
      const cardsCreatedLimit = 150
      if (state.isUpgraded) { return }
      if (state.cardsCreatedCount >= cardsCreatedLimit) { return true }
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
      utils.typeCheck({ value: users, type: 'array', origin: 'favoriteUsers' })
      state.favoriteUsers = users
      cache.updateUser('favoriteUsers', users)
    },
    favoriteSpaces: (state, spaces) => {
      utils.typeCheck({ value: spaces, type: 'array', origin: 'favoriteSpaces' })
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
    cardsCreatedCount: (state, count) => {
      utils.typeCheck({ value: count, type: 'number', origin: 'cardsCreatedCount' })
      state.cardsCreatedCount = count
      cache.updateUser('cardsCreatedCount', count)
    },
    isUpgraded: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'isUpgraded' })
      state.isUpgraded = value
      cache.updateUser('isUpgraded', value)
    },
    filterShowUsers: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'filterShowUsers' })
      state.filterShowUsers = value
      cache.updateUser('filterShowUsers', value)
    },
    filterShowDateUpdated: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'filterShowDateUpdated' })
      state.filterShowDateUpdated = value
      cache.updateUser('filterShowDateUpdated', value)
    },
    filterShowAbsoluteDates: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'filterShowAbsoluteDates' })
      state.filterShowAbsoluteDates = value
      cache.updateUser('filterShowAbsoluteDates', value)
    },
    updateJournalQuestion: (state, { questionId, name }) => {
      const questions = state.journalQuestions.map(question => {
        if (question.id === questionId) {
          question.name = name
        }
        return question
      })
      state.journalQuestions = questions
      cache.updateUser('journalQuestions', questions)
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
    cardsCreatedCount: (context, { shouldIncrement }) => {
      let count
      if (shouldIncrement) {
        count = context.state.cardsCreatedCount + 1
      } else {
        count = context.state.cardsCreatedCount - 1
      }
      count = Math.max(count, 0)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          cardsCreatedCount: count
        } }, { root: true })
      context.commit('cardsCreatedCount', count)
    },
    cardsCreatedCountUpdateBy: (context, { delta, shouldIncrement }) => {
      let count
      if (shouldIncrement) {
        count = context.state.cardsCreatedCount + delta
      } else {
        count = context.state.cardsCreatedCount - delta
      }
      count = Math.max(count, 0)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          cardsCreatedCount: count
        } }, { root: true })
      context.commit('cardsCreatedCount', count)
    },
    isUpgraded: (context, value) => {
      context.commit('isUpgraded', value)
      context.commit('notifyCardsCreatedIsOverLimit', false, { root: true })
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
      let user = utils.clone(context.state)
      user.userId = user.id
      context.commit('currentSpace/updateUser', user, { root: true })
      context.commit('currentSpace/updateCollaborator', user, { root: true })
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
      const hasRestoredFavorites = context.rootState.hasRestoredFavorites
      if (hasRestoredFavorites) { return }
      if (!context.getters.isSignedIn) { return }
      let favorites = {
        favoriteUsers: [],
        favoriteSpaces: []
      }
      favorites = await context.dispatch('api/getUserFavorites', null, { root: true }) || favorites
      context.commit('favoriteUsers', favorites.favoriteUsers)
      context.commit('favoriteSpaces', favorites.favoriteSpaces)
      context.commit('hasRestoredFavorites', true, { root: true })
    },
    addFavorite: (context, { type, item }) => {
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
    },
    toggleFilterShowUsers: (context, value) => {
      context.commit('filterShowUsers', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          filterShowUsers: value
        } }, { root: true })
    },
    toggleFilterShowDateUpdated: (context, value) => {
      context.commit('filterShowDateUpdated', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          filterShowDateUpdated: value
        } }, { root: true })
    },
    toggleFilterShowAbsoluteDates: (context, value) => {
      context.commit('filterShowAbsoluteDates', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          filterShowAbsoluteDates: value
        } }, { root: true })
    },
    clearUserFilters: (context) => {
      context.dispatch('toggleFilterShowUsers', false)
      context.dispatch('toggleFilterShowDateUpdated', false)
      context.dispatch('toggleFilterShowAbsoluteDates', false)
    },
    updateJournalQuestion: (context, { questionId, name }) => {
      utils.typeCheck({ value: name, type: 'string', origin: 'updateQuestion' })
      utils.typeCheck({ value: questionId, type: 'string', origin: 'updateQuestion' })
      // TODO update api
      context.commit('updateJournalQuestion', { questionId, name })
    }
  }
}
