import utils from '@/utils.js'
import cache from '@/cache.js'

import randomColor from 'randomcolor'
import { nanoid } from 'nanoid'

export default {
  namespaced: true,
  state: {
    id: nanoid(),
    lastSpaceId: '',
    prevLastSpaceId: '',
    color: randomColor({ luminosity: 'light' }),
    name: undefined,
    description: undefined,
    website: undefined,
    lastReadNewStuffId: undefined,
    prefersDarkTheme: false,
    apiKey: '',
    arenaAccessToken: '',
    favoriteUsers: [],
    favoriteSpaces: [],
    favoriteColors: [],
    cardsCreatedCount: 0,
    isUpgraded: false,
    isModerator: false,
    isGuideMaker: false,
    filterShowUsers: false,
    filterShowDateUpdated: false,
    filterShowAbsoluteDates: false,
    filterUnchecked: false,
    filterComments: false,
    journalPrompts: [],
    newSpacesAreBlank: false,
    shouldEmailNotifications: true,
    shouldEmailBulletin: true,
    shouldEmailWeeklyReview: true,
    shouldShowMoreAlignOptions: false,
    shouldShowCardCollaborationInfo: false,
    shouldShowCardStyleActions: false,
    shouldShowMultiCardStyleActions: false,
    shouldInvertZoomDirection: false,
    shouldUseLastConnectionType: false,
    shouldOpenLinksInNewTab: false,
    shouldRightMouseButtonPan: false,
    shouldShowCurrentSpaceTags: false,
    showInExploreUpdatedAt: null, // date
    dialogFavoritesFilters: null, // null, 'currentUser', 'otherUsers'
    dialogSpaceFilters: null, // null, journals, spaces
    dialogSpaceFilterByUser: {},
    dialogSpaceFilterShowHidden: false,
    defaultSpaceBackground: undefined,
    defaultSpaceBackgroundTint: undefined,
    defaultAddSpaceId: undefined,
    downgradeAt: null,
    showWeather: false,
    weatherLocation: undefined,
    weatherUnitIsCelcius: false
  },
  mutations: {
    color: (state, value) => {
      state.color = value
      cache.updateUser('color', value)
    },
    name: (state, value) => {
      state.name = value
      cache.updateUser('name', value)
    },
    description: (state, value) => {
      state.description = value
      cache.updateUser('description', value)
    },
    website: (state, value) => {
      state.website = value
      cache.updateUser('website', value)
    },
    email: (state, value) => {
      state.email = value
      cache.updateUser('email', value)
    },
    lastSpaceId: (state, spaceId) => {
      state.prevLastSpaceId = state.lastSpaceId
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
    favoriteColors: (state, spaces) => {
      utils.typeCheck({ value: spaces, type: 'array', origin: 'favoriteColors' })
      state.favoriteColors = spaces
      cache.updateUser('favoriteColors', spaces)
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
    filterComments: (state, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'filterComments' })
      state.filterComments = value
      cache.updateUser('filterComments', value)
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
    shouldEmailNotifications: (state, value) => {
      state.shouldEmailNotifications = value
      cache.updateUser('shouldEmailNotifications', value)
    },
    shouldEmailBulletin: (state, value) => {
      state.shouldEmailBulletin = value
      cache.updateUser('shouldEmailBulletin', value)
    },
    shouldEmailWeeklyReview: (state, value) => {
      state.shouldEmailWeeklyReview = value
      cache.updateUser('shouldEmailWeeklyReview', value)
    },
    shouldShowMoreAlignOptions: (state, value) => {
      state.shouldShowMoreAlignOptions = value
      cache.updateUser('shouldShowMoreAlignOptions', value)
    },
    shouldShowCardCollaborationInfo: (state, value) => {
      state.shouldShowCardCollaborationInfo = value
      cache.updateUser('shouldShowCardCollaborationInfo', value)
    },
    shouldShowCardStyleActions: (state, value) => {
      state.shouldShowCardStyleActions = value
      cache.updateUser('shouldShowCardStyleActions', value)
    },
    shouldShowMultiCardStyleActions: (state, value) => {
      state.shouldShowMultiCardStyleActions = value
      cache.updateUser('shouldShowMultiCardStyleActions', value)
    },
    showInExploreUpdatedAt: (state, value) => {
      state.showInExploreUpdatedAt = value
      cache.updateUser('showInExploreUpdatedAt', value)
    },
    shouldInvertZoomDirection: (state, value) => {
      state.shouldInvertZoomDirection = value
      cache.updateUser('shouldInvertZoomDirection', value)
    },
    shouldOpenLinksInNewTab: (state, value) => {
      state.shouldOpenLinksInNewTab = value
      cache.updateUser('shouldOpenLinksInNewTab', value)
    },
    shouldRightMouseButtonPan: (state, value) => {
      state.shouldRightMouseButtonPan = value
      cache.updateUser('shouldRightMouseButtonPan', value)
    },
    shouldShowCurrentSpaceTags: (state, value) => {
      state.shouldShowCurrentSpaceTags = value
      cache.updateUser('shouldShowCurrentSpaceTags', value)
    },
    shouldUseLastConnectionType: (state, value) => {
      state.shouldUseLastConnectionType = value
      cache.updateUser('shouldUseLastConnectionType', value)
    },
    dialogFavoritesFilters: (state, value) => {
      state.dialogFavoritesFilters = value
      cache.updateUser('dialogFavoritesFilters', value)
    },
    dialogSpaceFilters: (state, value) => {
      state.dialogSpaceFilters = value
      cache.updateUser('dialogSpaceFilters', value)
    },
    dialogSpaceFilterByUser: (state, value) => {
      state.dialogSpaceFilterByUser = value
      cache.updateUser('dialogSpaceFilterByUser', value)
    },
    dialogSpaceFilterShowHidden: (state, value) => {
      state.dialogSpaceFilterShowHidden = value
      cache.updateUser('dialogSpaceFilterShowHidden', value)
    },
    defaultSpaceBackground: (state, value) => {
      state.defaultSpaceBackground = value
      cache.updateUser('defaultSpaceBackground', value)
    },
    defaultSpaceBackgroundTint: (state, value) => {
      state.defaultSpaceBackgroundTint = value
      cache.updateUser('defaultSpaceBackgroundTint', value)
    },
    defaultAddSpaceId: (state, value) => {
      state.defaultAddSpaceId = value
      cache.updateUser('defaultAddSpaceId', value)
    },
    showWeather: (state, value) => {
      state.showWeather = value
      cache.updateUser('showWeather', value)
    },
    weatherLocation: (state, value) => {
      state.weatherLocation = value
      cache.updateUser('weatherLocation', value)
    },
    weatherUnitIsCelcius: (state, value) => {
      state.weatherUnitIsCelcius = value
      cache.updateUser('weatherUnitIsCelcius', value)
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
    update: (context, updates) => {
      const keys = Object.keys(updates)
      keys.forEach(key => {
        context.commit(key, updates[key])
        context.dispatch('broadcastUpdate', { [key]: updates[key] })
      })
      context.dispatch('api/addToQueue', { name: 'updateUser', body: updates }, { root: true })
    },
    cardsCreatedCountUpdateBy: (context, { delta }) => {
      if (context.getters.shouldPreventCardsCreatedCountUpdate) { return }
      const count = context.state.cardsCreatedCount + delta
      context.dispatch('api/addToQueue', { name: 'updateUserCardsCreatedCount', body: { delta } }, { root: true })
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
    lastSpaceId: (context, spaceId) => {
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
    restoreRemoteUser: async (context, cachedUser) => {
      if (!context.getters.isSignedIn) { return }
      const remoteUser = await context.dispatch('api/getUser', null, { root: true })
      if (!remoteUser) { return }
      remoteUser.updatedAt = utils.normalizeToUnixTime(remoteUser.updatedAt)
      console.log('🌸 Restore user from remote', remoteUser)
      context.commit('updateUser', remoteUser)
      if (remoteUser.stripeSubscriptionId || remoteUser.downgradeAt) {
        context.commit('isUpgraded', true)
      } else {
        context.commit('isUpgraded', false)
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
      let color
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
      } else if (type === 'color') {
        color = item.color
        let favorites = utils.clone(context.state.favoriteColors)
        let favorite = color
        favorites.push(favorite)
        context.commit('favoriteColors', favorites)
      }
      let body = { type, id: item.id }
      if (color) {
        body.color = color
      }
      context.dispatch('api/addToQueue', { name: 'addOrRemoveFavorite',
        body
      }, { root: true })
    },
    removeFavorite: (context, { type, item }) => {
      let color
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
      } else if (type === 'color') {
        color = item.color
        let favorites = utils.clone(context.state.favoriteColors)
        favorites = favorites.filter(favoriteColor => {
          return favoriteColor !== color
        })
        context.commit('favoriteColors', favorites)
      }
      let body = { type, id: item.id }
      if (color) {
        body.color = color
      }
      context.dispatch('api/addToQueue', { name: 'addOrRemoveFavorite',
        body
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
    toggleFilterComments: (context, value) => {
      context.commit('filterComments', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          filterComments: value
        } }, { root: true })
    },
    clearUserFilters: (context) => {
      context.dispatch('toggleFilterShowUsers', false)
      context.dispatch('toggleFilterShowDateUpdated', false)
      context.dispatch('toggleFilterShowAbsoluteDates', false)
      context.dispatch('toggleFilterUnchecked', false)
      context.dispatch('toggleFilterComments', false)
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
    shouldEmailWeeklyReview: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldEmailWeeklyReview' })
      context.commit('shouldEmailWeeklyReview', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldEmailWeeklyReview: value
        } }, { root: true })
    },
    shouldShowMoreAlignOptions: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldShowMoreAlignOptions' })
      context.commit('shouldShowMoreAlignOptions', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldShowMoreAlignOptions: value
        } }, { root: true })
    },
    shouldShowCardCollaborationInfo: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldShowCardCollaborationInfo' })
      context.commit('shouldShowCardCollaborationInfo', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldShowCardCollaborationInfo: value
        } }, { root: true })
    },
    shouldShowCardStyleActions: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldShowCardStyleActions' })
      context.commit('shouldShowCardStyleActions', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldShowCardStyleActions: value
        } }, { root: true })
    },
    shouldShowMultiCardStyleActions: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldShowMultiCardStyleActions' })
      context.commit('shouldShowMultiCardStyleActions', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldShowMultiCardStyleActions: value
        } }, { root: true })
    },
    showInExploreUpdatedAt: (context, value) => {
      utils.typeCheck({ value, type: 'string', origin: 'showInExploreUpdatedAt' })
      context.commit('showInExploreUpdatedAt', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          showInExploreUpdatedAt: value
        } }, { root: true })
    },
    shouldInvertZoomDirection: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldInvertZoomDirection' })
      context.commit('shouldInvertZoomDirection', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldInvertZoomDirection: value
        } }, { root: true })
    },
    shouldOpenLinksInNewTab: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldOpenLinksInNewTab' })
      context.commit('shouldOpenLinksInNewTab', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldOpenLinksInNewTab: value
        } }, { root: true })
    },
    shouldRightMouseButtonPan: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldRightMouseButtonPan' })
      context.commit('shouldRightMouseButtonPan', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldRightMouseButtonPan: value
        } }, { root: true })
    },
    shouldUseLastConnectionType: (context, value) => {
      utils.typeCheck({ value, type: 'boolean', origin: 'shouldUseLastConnectionType' })
      context.commit('shouldUseLastConnectionType', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldUseLastConnectionType: value
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
    cardsCreatedWillBeOverLimit: (state, getters, rootState) => (count) => {
      const cardsCreatedLimit = rootState.cardsCreatedLimit
      if (state.isUpgraded) { return }
      if (state.cardsCreatedCount + count >= cardsCreatedLimit) { return true }
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
    canEditCard: (state, getters, rootState, rootGetters) => (card) => {
      const isSpaceMember = getters.isSpaceMember()
      if (isSpaceMember) { return true }
      const canEditSpace = getters.canEditSpace
      const cardIsCreatedByCurrentUser = getters.cardIsCreatedByCurrentUser(card)
      if (canEditSpace && cardIsCreatedByCurrentUser) { return true }
      return false
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
    shouldPreventCardsCreatedCountUpdate: (state, getters, rootState, rootGetters) => {
      const spaceUserIsUpgraded = rootGetters['currentSpace/spaceUserIsUpgraded']
      const spaceUserIsCurrentUser = rootGetters['currentSpace/spaceUserIsCurrentUser']
      if (spaceUserIsUpgraded && !spaceUserIsCurrentUser) {
        return true
      }
    },
    totalFiltersActive: (state, getters) => {
      let userFilters = getters.totalCardFadingFiltersActive
      if (state.filterShowUsers) {
        userFilters += 1
      }
      if (state.filterShowDateUpdated) {
        userFilters += 1
      }
      if (state.filterComments) {
        userFilters += 1
      }
      return userFilters
    },
    totalCardFadingFiltersActive: (state, getters, rootState) => {
      let userFilters = 0
      if (state.filterUnchecked) {
        userFilters += 1
      }
      const tagNames = rootState.filteredTagNames
      const connections = rootState.filteredConnectionTypeIds
      const frames = rootState.filteredFrameIds
      return userFilters + tagNames.length + connections.length + frames.length
    }
  }
}
