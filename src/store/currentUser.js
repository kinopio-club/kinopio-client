import utils from '@/utils.js'
import cache from '@/cache.js'
import promptPacks from '@/data/promptPacks.json'

import randomColor from 'randomcolor'
import nanoid from 'nanoid'

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
    filterUnchecked: false,
    journalPrompts: [],
    newSpacesAreBlank: false,
    shouldHideCardTips: false,
    shouldEmailNotifications: true,
    shouldEmailBulletin: true,
    shouldShowMoreAlignOptions: false
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
    email: (state, newEmail) => {
      state.email = newEmail
      cache.updateUser('email', newEmail)
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
    updateFavoriteSpaceIsEdited: (state, spaceId) => {
      utils.typeCheck({ value: spaceId, type: 'string', origin: 'updateFavoriteSpaceIsEdited' })
      const spaces = state.favoriteSpaces.map(space => {
        if (space.id === spaceId) {
          space.isEdited = false
        }
        return space
      })
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
    filterUnchecked: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'filterUnchecked' })
      state.filterUnchecked = value
      cache.updateUser('filterUnchecked', value)
    },
    addJournalPrompt: (state, newPrompt) => {
      let prompts = utils.clone(state.journalPrompts) || []
      prompts.push(newPrompt)
      state.journalPrompts = prompts
      cache.updateUser('journalPrompts', prompts)
    },
    removeJournalPrompt: (state, removePrompt) => {
      let prompts = utils.clone(state.journalPrompts) || []
      prompts = prompts.filter(prompt => {
        return prompt.id !== removePrompt.id
      })
      state.journalPrompts = prompts
      cache.updateUser('journalPrompts', prompts)
    },
    updateJournalPrompt: (state, updatedPrompt) => {
      let prompts = state.journalPrompts.map(prompt => {
        if (prompt.id === updatedPrompt.id) {
          prompt = updatedPrompt
        }
        return prompt
      })
      state.journalPrompts = prompts
      cache.updateUser('journalPrompts', prompts)
    },
    newSpacesAreBlank: (state, value) => {
      state.newSpacesAreBlank = value
      cache.updateUser('newSpacesAreBlank', value)
    },
    shouldHideCardTips: (state, value) => {
      state.shouldHideCardTips = value
      cache.updateUser('shouldHideCardTips', value)
    },
    shouldEmailNotifications: (state, value) => {
      state.shouldEmailNotifications = value
      cache.updateUser('shouldEmailNotifications', value)
    },
    shouldEmailBulletin: (state, value) => {
      state.shouldEmailBulletin = value
      cache.updateUser('shouldEmailBulletin', value)
    },
    shouldShowMoreAlignOptions: (state, value) => {
      state.shouldShowMoreAlignOptions = value
      cache.updateUser('shouldShowMoreAlignOptions', value)
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
      const spaceUserIsUpgraded = context.rootGetters['currentSpace/spaceUserIsUpgraded']
      if (spaceUserIsUpgraded) { return }
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
    createNewUserJournalPrompts: (context) => {
      if (utils.arrayHasItems(context.state.journalPrompts)) { return }
      let prompts = [
        { name: 'How am I feeling?' },
        { name: 'What do I have to do today?' },
        { name: 'Everyday', packId: '1' }
      ]
      prompts = prompts.map(prompt => {
        prompt.id = nanoid()
        prompt.userId = context.state.id
        return prompt
      })
      prompts.forEach(prompt => {
        context.dispatch('addJournalPrompt', prompt)
      })
    },
    createNewUser: (context) => {
      cache.saveUser(context.state)
      context.dispatch('createNewUserJournalPrompts')
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
      console.log('🌸 Restore user from remote', remoteUser)
      context.commit('updateUser', remoteUser)
      context.dispatch('createNewUserJournalPrompts')
      if (remoteUser.stripeSubscriptionId) {
        context.commit('isUpgraded', true)
      }
      const remoteTags = await context.dispatch('api/getUserTags', null, { root: true }) || []
      context.commit('otherTags', remoteTags, { root: true })
    },
    restoreUserFavorites: async (context) => {
      if (!context.getters.isSignedIn) {
        context.commit('hasRestoredFavorites', true, { root: true })
        return
      }
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
    toggleFilterUnchecked: (context, value) => {
      context.commit('filterUnchecked', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          filterUnchecked: value
        } }, { root: true })
    },
    clearUserFilters: (context) => {
      context.dispatch('toggleFilterShowUsers', false)
      context.dispatch('toggleFilterShowDateUpdated', false)
      context.dispatch('toggleFilterShowAbsoluteDates', false)
      context.dispatch('toggleFilterUnchecked', false)
    },
    addJournalPrompt: (context, prompt) => {
      utils.typeCheck({ value: prompt, type: 'object', origin: 'addJournalPrompt' })
      context.dispatch('api/addToQueue', { name: 'addJournalPrompt', body: prompt }, { root: true })
      context.commit('addJournalPrompt', prompt)
    },
    removeJournalPrompt: (context, prompt) => {
      utils.typeCheck({ value: prompt, type: 'object', origin: 'removeJournalPrompt' })
      context.dispatch('api/addToQueue', { name: 'removeJournalPrompt', body: prompt }, { root: true })
      context.commit('removeJournalPrompt', prompt)
    },
    updateJournalPrompt: (context, prompt) => {
      utils.typeCheck({ value: prompt, type: 'object', origin: 'updateJournalPrompt' })
      context.dispatch('api/addToQueue', { name: 'updateJournalPrompt', body: prompt }, { root: true })
      context.commit('updateJournalPrompt', prompt)
    },
    newSpacesAreBlank: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'newSpacesAreBlank' })
      context.commit('newSpacesAreBlank', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          newSpacesAreBlank: value
        } }, { root: true })
    },
    shouldHideCardTips: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldHideCardTips' })
      context.commit('shouldHideCardTips', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldHideCardTips: value
        } }, { root: true })
    },
    shouldEmailNotifications: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldEmailNotifications' })
      context.commit('shouldEmailNotifications', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldEmailNotifications: value
        } }, { root: true })
    },
    shouldEmailBulletin: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldEmailBulletin' })
      context.commit('shouldEmailBulletin', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldEmailBulletin: value
        } }, { root: true })
    },
    shouldShowMoreAlignOptions: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldShowMoreAlignOptions' })
      context.commit('shouldShowMoreAlignOptions', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldShowMoreAlignOptions: value
        } }, { root: true })
    }
  },
  getters: {
    isCurrentUser: (state) => (user) => {
      return Boolean(state.id === user.id)
    },
    isSignedIn: (state) => {
      return Boolean(state.apiKey)
    },
    cardsCreatedIsOverLimit: (state, getters, rootState) => {
      const cardsCreatedLimit = rootState.cardsCreatedLimit
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
      const isCreatedByUser = state.id === card.userId
      const isUpdatedByUser = state.id === card.nameUpdatedByUserId
      const isNoUser = !card.userId && !card.nameUpdatedByUserId
      return isCreatedByUser || isUpdatedByUser || isNoUser
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
    },
    packById: (state, getters) => (packId) => {
      packId = packId.toString()
      return promptPacks.find(pack => pack.packId === packId)
    }
  }
}
