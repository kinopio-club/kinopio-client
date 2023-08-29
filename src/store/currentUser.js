import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'
import postMessage from '@/postMessage.js'

import randomColor from 'randomcolor'
import { nanoid } from 'nanoid'
import { nextTick } from 'vue'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid' // polyfill for self.crypto.randomUUID(), for legacy todesktop support

const initialState = {
  id: nanoid(),
  lastSpaceId: '',
  color: randomColor({ luminosity: 'light' }),
  name: undefined,
  description: undefined,
  website: undefined,
  lastReadNewStuffId: undefined,
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
  shouldCreateJournalsWithDailyPrompt: true,
  newSpacesAreBlank: false,
  shouldEmailNotifications: true,
  shouldEmailBulletin: true,
  shouldEmailWeeklyReview: true,
  shouldShowMoreAlignOptions: false,
  shouldUseLastConnectionType: true,
  shouldShowItemActions: false,
  shouldShowMultipleSelectedItemActions: false,
  shouldDisableRightClickToPan: false,
  shouldShowCurrentSpaceTags: false,
  showInExploreUpdatedAt: null, // date
  dialogSpaceFilters: null, // null, journals, spaces
  dialogSpaceFilterByUser: {},
  dialogSpaceFilterShowHidden: false,
  defaultSpaceBackground: undefined,
  defaultSpaceBackgroundTint: undefined,
  defaultCardBackgroundColor: undefined,
  defaultConnectionControlPoint: null, // null, 'q00,00'
  downgradeAt: null,
  showWeather: false,
  weatherLocation: undefined,
  weatherUnitIsCelcius: false,
  shouldUseStickyCards: true,
  shouldDisableItemJiggle: false,
  shouldPauseConnectionDirections: false,
  lastUsedImagePickerService: '',
  AIImages: [],
  theme: null,
  themeIsSystem: false,
  referredByUserId: '',
  advocateReferrerName: '',
  weather: '',
  journalDailyPrompt: '',
  panSpeedIsFast: false,
  outsideSpaceBackgroundIsStatic: false,
  shouldDisableHapticFeedback: false,
  appleAppAccountToken: null,
  appleSubscriptionIsActive: null,
  studentDiscountIsAvailable: false
}

export default {
  namespaced: true,
  state: utils.clone(initialState),
  mutations: {
    replaceState: (state, newUser) => {
      if (!newUser) { return }
      Object.keys(state).forEach(key => {
        state[key] = newUser[key] || initialState[key]
      })
      postMessage.send({ name: 'setApiKey', value: newUser.apiKey })
      cache.removeLocal('user')
      cache.storeLocal('user', newUser)
    },

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
    favoriteUsers: (state, users) => {
      utils.typeCheck({ value: users, type: 'array' })
      state.favoriteUsers = users
      cache.updateUser('favoriteUsers', users)
    },
    favoriteSpaces: (state, spaces) => {
      utils.typeCheck({ value: spaces, type: 'array' })
      state.favoriteSpaces = spaces
      cache.updateUser('favoriteSpaces', spaces)
    },
    favoriteColors: (state, colors) => {
      utils.typeCheck({ value: colors, type: 'array' })
      state.favoriteColors = colors
      cache.updateUser('favoriteColors', colors)
    },
    updateFavoriteSpaceIsEdited: (state, spaceId) => {
      utils.typeCheck({ value: spaceId, type: 'string' })
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
        if (user.apiKey) {
          postMessage.send({ name: 'setApiKey', value: user.apiKey })
        }
      })
      cache.saveUser(user)
    },
    arenaAccessToken: (state, token) => {
      state.arenaAccessToken = token
      cache.updateUser('arenaAccessToken', token)
    },
    cardsCreatedCount: (state, count) => {
      utils.typeCheck({ value: count, type: 'number' })
      state.cardsCreatedCount = count
      cache.updateUser('cardsCreatedCount', count)
    },
    isUpgraded: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.isUpgraded = value
      cache.updateUser('isUpgraded', value)
    },
    filterShowUsers: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.filterShowUsers = value
      cache.updateUser('filterShowUsers', value)
    },
    filterShowDateUpdated: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.filterShowDateUpdated = value
      cache.updateUser('filterShowDateUpdated', value)
    },
    filterShowAbsoluteDates: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.filterShowAbsoluteDates = value
      cache.updateUser('filterShowAbsoluteDates', value)
    },
    filterUnchecked: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.filterUnchecked = value
      cache.updateUser('filterUnchecked', value)
    },
    filterComments: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
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
    shouldShowItemActions: (state, value) => {
      state.shouldShowItemActions = value
      cache.updateUser('shouldShowItemActions', value)
    },
    shouldShowMultipleSelectedItemActions: (state, value) => {
      state.shouldShowMultipleSelectedItemActions = value
      cache.updateUser('shouldShowMultipleSelectedItemActions', value)
    },
    showInExploreUpdatedAt: (state, value) => {
      state.showInExploreUpdatedAt = value
      cache.updateUser('showInExploreUpdatedAt', value)
    },
    shouldDisableRightClickToPan: (state, value) => {
      state.shouldDisableRightClickToPan = value
      cache.updateUser('shouldDisableRightClickToPan', value)
    },
    shouldShowCurrentSpaceTags: (state, value) => {
      state.shouldShowCurrentSpaceTags = value
      cache.updateUser('shouldShowCurrentSpaceTags', value)
    },
    shouldUseLastConnectionType: (state, value) => {
      state.shouldUseLastConnectionType = value
      cache.updateUser('shouldUseLastConnectionType', value)
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
    defaultCardBackgroundColor: (state, value) => {
      state.defaultCardBackgroundColor = value
      cache.updateUser('defaultCardBackgroundColor', value)
    },
    defaultConnectionControlPoint: (state, value) => {
      state.defaultConnectionControlPoint = value
      cache.updateUser('defaultConnectionControlPoint', value)
    },
    panSpeedIsFast: (state, value) => {
      state.panSpeedIsFast = value
      cache.updateUser('panSpeedIsFast', value)
    },
    outsideSpaceBackgroundIsStatic: (state, value) => {
      state.outsideSpaceBackgroundIsStatic = value
      cache.updateUser('outsideSpaceBackgroundIsStatic', value)
    },
    shouldDisableHapticFeedback: (state, value) => {
      state.shouldDisableHapticFeedback = value
      cache.updateUser('shouldDisableHapticFeedback', value)
    },
    shouldCreateJournalsWithDailyPrompt: (state, value) => {
      state.shouldCreateJournalsWithDailyPrompt = value
      cache.updateUser('shouldCreateJournalsWithDailyPrompt', value)
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
    },
    journalDailyPrompt: (state, value) => {
      state.journalDailyPrompt = value
      cache.updateUser('journalDailyPrompt', value)
    },
    shouldUseStickyCards: (state, value) => {
      state.shouldUseStickyCards = value
      cache.updateUser('shouldUseStickyCards', value)
    },
    shouldDisableItemJiggle: (state, value) => {
      state.shouldDisableItemJiggle = value
      cache.updateUser('shouldDisableItemJiggle', value)
    },
    shouldPauseConnectionDirections: (state, value) => {
      state.shouldPauseConnectionDirections = value
      cache.updateUser('shouldPauseConnectionDirections', value)
    },
    lastUsedImagePickerService: (state, value) => {
      state.lastUsedImagePickerService = value
      cache.updateUser('lastUsedImagePickerService', value)
    },
    AIImages: (state, value) => {
      state.AIImages = value
      cache.updateUser('AIImages', value)
    },
    theme: (state, value) => {
      state.theme = value
      cache.updateUser('theme', value)
    },
    themeIsSystem: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.themeIsSystem = value
      cache.updateUser('themeIsSystem', value)
    },
    referredByUserId: (state, value) => {
      state.referredByUserId = value
      cache.updateUser('referredByUserId', value)
    },
    advocateReferrerName: (state, value) => {
      state.advocateReferrerName = value
      cache.updateUser('advocateReferrerName', value)
    },
    weather: (state, value) => {
      state.weather = value
    },
    appleAppAccountToken: (state, value) => {
      state.weather = value
    },
    appleSubscriptionIsActive: (state, value) => {
      state.appleSubscriptionIsActive = value
    },
    initNewUser: (state) => {
      state.appleAppAccountToken = uuidv4()
    }
  },
  actions: {
    init: async (context) => {
      const cachedUser = cache.user()
      if (utils.objectHasKeys(cachedUser)) {
        console.log('🌸 Restore user from cache', cachedUser.id)
        context.commit('restoreUser', cachedUser)
        context.dispatch('themes/restore', null, { root: true })
        await context.dispatch('restoreRemoteUser', cachedUser)
      } else {
        console.log('🌸 Create new user')
        context.dispatch('createNewUser')
      }
      context.dispatch('themes/restore', null, { root: true })
      context.commit('triggerUserIsLoaded', null, { root: true })
      context.dispatch('updateWeather')
      context.dispatch('updateJournalDailyPrompt')
      // handle referrals
      nextTick(() => {
        nextTick(() => {
          context.dispatch('validateUserReferralUserId')
          context.dispatch('validateFromAdvocateReferralName')
          context.dispatch('validateAdvocateReferralName')
        })
      })
    },
    updateWeather: async (context) => {
      const weather = await context.dispatch('api/weather', null, { root: true })
      if (!weather) { return }
      context.commit('weather', weather)
    },
    updateJournalDailyPrompt: async (context) => {
      const prompt = await context.dispatch('api/journalDailyPrompt', null, { root: true })
      if (!prompt) { return }
      context.commit('journalDailyPrompt', prompt)
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
        { name: 'What do I have to do today?' }
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
      context.commit('themeIsSystem', true)
      context.commit('initNewUser')
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
      remoteUser.AIImages = await context.dispatch('api/getUserAIImages', null, { root: true }) || []
      remoteUser.updatedAt = utils.normalizeToUnixTime(remoteUser.updatedAt)
      console.log('🌸 Restore user from remote', remoteUser)
      context.commit('updateUser', remoteUser)
      if (remoteUser.stripeSubscriptionId || remoteUser.downgradeAt || remoteUser.appleSubscriptionIsActive) {
        context.commit('isUpgraded', true)
      } else {
        context.commit('isUpgraded', false)
      }
      const remoteTags = await context.dispatch('api/getUserTags', null, { root: true }) || []
      context.commit('otherTags', remoteTags, { root: true })
    },
    restoreUserFavorites: async (context) => {
      context.commit('isLoadingFavorites', true, { root: true })
      if (!context.getters.isSignedIn) {
        context.commit('isLoadingFavorites', false, { root: true })
        return
      }
      let favorites = {
        favoriteUsers: [],
        favoriteSpaces: [],
        favoriteColors: []
      }
      favorites = await context.dispatch('api/getUserFavorites', null, { root: true }) || favorites
      context.commit('favoriteUsers', favorites.favoriteUsers)
      context.commit('favoriteSpaces', favorites.favoriteSpaces)
      context.commit('favoriteColors', favorites.favoriteColors)
      context.commit('isLoadingFavorites', false, { root: true })
    },
    addFavorite: (context, { type, item }) => {
      let color, notification
      // user
      if (type === 'user') {
        let favoriteUsers = utils.clone(context.state.favoriteUsers)
        let user = {
          id: item.id,
          name: item.name,
          color: item.color
        }
        favoriteUsers.push(user)
        context.commit('favoriteUsers', favoriteUsers)
        context.dispatch('userNotifications/addFavoriteUser', user, { root: true })
      // space
      } else if (type === 'space') {
        let favoriteSpaces = utils.clone(context.state.favoriteSpaces)
        let space = {
          id: item.id,
          name: item.name,
          privacy: item.privacy,
          showInExplore: item.showInExplore,
          users: item.users
        }
        favoriteSpaces.push(space)
        context.commit('favoriteSpaces', favoriteSpaces)
        context.dispatch('userNotifications/addFavoriteSpace', space, { root: true })
      // color
      } else if (type === 'color') {
        color = item.color
        let favoriteColors = utils.clone(context.state.favoriteColors)
        favoriteColors.push(color)
        context.commit('favoriteColors', favoriteColors)
      }
      // update api
      let body = { type, id: item.id }
      if (color) {
        body.color = color
      }
      context.dispatch('api/addToQueue', { name: 'addOrRemoveFavorite', body }, { root: true })
    },
    removeFavorite: (context, { type, item }) => {
      let color
      // user
      if (type === 'user') {
        let favoriteUsers = utils.clone(context.state.favoriteUsers)
        favoriteUsers = favoriteUsers.filter(favorite => {
          return favorite.id !== item.id
        })
        context.commit('favoriteUsers', favoriteUsers)
        context.dispatch('userNotifications/removeFavoriteUser', item, { root: true })
      // space
      } else if (type === 'space') {
        let favoriteSpaces = utils.clone(context.state.favoriteSpaces)
        favoriteSpaces = favoriteSpaces.filter(space => {
          return space.id !== item.id
        })
        context.commit('favoriteSpaces', favoriteSpaces)
        context.dispatch('userNotifications/removeFavoriteSpace', item, { root: true })
      // color
      } else if (type === 'color') {
        color = item.color
        let favoriteColors = utils.clone(context.state.favoriteColors)
        favoriteColors = favoriteColors.filter(favoriteColor => {
          return favoriteColor !== color
        })
        context.commit('favoriteColors', favoriteColors)
      }
      // update api
      let body = { type, id: item.id }
      if (color) {
        body.color = color
      }
      context.dispatch('api/addToQueue', { name: 'addOrRemoveFavorite', body }, { root: true })
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
      context.dispatch('updatePathsAndPositions')
    },
    toggleFilterShowDateUpdated: (context, value) => {
      context.commit('filterShowDateUpdated', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          filterShowDateUpdated: value
        } }, { root: true })
      context.dispatch('updatePathsAndPositions')
    },
    toggleFilterShowAbsoluteDates: (context, value) => {
      context.commit('filterShowAbsoluteDates', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          filterShowAbsoluteDates: value
        } }, { root: true })
      context.dispatch('updatePathsAndPositions')
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
    updatePathsAndPositions: (context) => {
      nextTick(() => {
        nextTick(() => {
          context.dispatch('currentConnections/correctPaths', {}, { root: true })
          context.commit('triggerUpdateLockedItemButtonsPositions', null, { root: true })
        })
      })
    },
    clearUserFilters: (context) => {
      context.dispatch('toggleFilterShowUsers', false)
      context.dispatch('toggleFilterShowDateUpdated', false)
      context.dispatch('toggleFilterShowAbsoluteDates', false)
      context.dispatch('toggleFilterUnchecked', false)
      context.dispatch('toggleFilterComments', false)
      context.dispatch('updatePathsAndPositions')
    },
    addJournalPrompt: (context, prompt) => {
      utils.typeCheck({ value: prompt, type: 'object' })
      context.dispatch('api/addToQueue', { name: 'addJournalPrompt', body: prompt }, { root: true })
      context.commit('addJournalPrompt', prompt)
    },
    removeJournalPrompt: (context, prompt) => {
      utils.typeCheck({ value: prompt, type: 'object' })
      context.dispatch('api/addToQueue', { name: 'removeJournalPrompt', body: prompt }, { root: true })
      context.commit('removeJournalPrompt', prompt)
    },
    updateJournalPrompt: (context, prompt) => {
      utils.typeCheck({ value: prompt, type: 'object' })
      context.dispatch('api/addToQueue', { name: 'updateJournalPrompt', body: prompt }, { root: true })
      context.commit('updateJournalPrompt', prompt)
    },
    newSpacesAreBlank: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('newSpacesAreBlank', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          newSpacesAreBlank: value
        } }, { root: true })
    },
    shouldEmailNotifications: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldEmailNotifications', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldEmailNotifications: value
        } }, { root: true })
    },
    shouldEmailBulletin: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldEmailBulletin', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldEmailBulletin: value
        } }, { root: true })
    },
    shouldEmailWeeklyReview: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldEmailWeeklyReview', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldEmailWeeklyReview: value
        } }, { root: true })
    },
    shouldShowMoreAlignOptions: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldShowMoreAlignOptions', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldShowMoreAlignOptions: value
        } }, { root: true })
    },
    shouldShowItemActions: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldShowItemActions', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldShowItemActions: value
        } }, { root: true })
    },
    shouldShowMultipleSelectedItemActions: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldShowMultipleSelectedItemActions', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldShowMultipleSelectedItemActions: value
        } }, { root: true })
    },
    showInExploreUpdatedAt: (context, value) => {
      utils.typeCheck({ value, type: 'string' })
      context.commit('showInExploreUpdatedAt', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          showInExploreUpdatedAt: value
        } }, { root: true })
    },
    shouldDisableRightClickToPan: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldDisableRightClickToPan', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldDisableRightClickToPan: value
        } }, { root: true })
    },
    shouldUseLastConnectionType: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldUseLastConnectionType', value)
      context.dispatch('api/addToQueue', { name: 'updateUser',
        body: {
          shouldUseLastConnectionType: value
        } }, { root: true })
    },
    inboxSpace: async (context) => {
      let space = cache.getInboxSpace()
      if (!space) {
        try {
          space = await context.dispatch('api/getUserInboxSpace', null, { root: true })
        } catch (error) {
          console.warn('🚑 inboxSpace', error)
        }
      }
      return space
    },
    notifyReadOnly: (context, position) => {
      const canEditSpace = context.getters.canEditSpace()
      if (canEditSpace) { return }
      const cannotEditUnlessSignedIn = context.getters.cannotEditUnlessSignedIn()
      const notificationWithPosition = document.querySelector('.notifications-with-position .item')
      if (cannotEditUnlessSignedIn) {
        context.commit('addNotificationWithPosition', { message: 'Sign in to Edit', position, type: 'info', layer: 'space', icon: 'cancel' }, { root: true })
      } else {
        context.commit('addNotificationWithPosition', { message: 'Space is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' }, { root: true })
      }
    },

    // referrals

    validateUserReferralUserId: async (context) => {
      const referrerUserId = context.rootState.validateUserReferralUserId
      if (!referrerUserId) { return }
      const referrerUser = await context.dispatch('api/getPublicUser', { id: referrerUserId }, { root: true })
      if (!referrerUser) {
        context.commit('addNotification', { message: 'Invalid referral, referring user not found', isPersistentItem: true, type: 'danger' }, { root: true })
        return
      }
      // check if current user can be referred
      const canBeReferred = context.getters.canBeReferred(referrerUserId)
      if (canBeReferred) {
        context.dispatch('addReferral', referrerUser)
      } else {
        context.commit('addNotification', { message: 'Invalid Referral. You can only be referred once', isPersistentItem: true, type: 'danger' }, { root: true })
      }
      // reset state
      context.commit('validateUserReferralUserId', '', { root: true })
    },
    validateFromAdvocateReferralName: async (context) => {
      try {
        const name = context.rootState.validateFromAdvocateReferralName
        // get referrer
        if (!name) { return }
        const advocateUser = await context.dispatch('api/getAdvocateUsedUser', name, { root: true })
        if (!advocateUser) {
          context.commit('addNotification', { message: 'Invalid referral, referring user not found', isPersistentItem: true, type: 'danger' }, { root: true })
          return
        }
        // check if current user can be referred
        const canBeReferred = context.getters.canBeReferred(advocateUser.id)
        if (canBeReferred) {
          context.dispatch('addReferral', advocateUser)
        } else {
          context.commit('addNotification', { message: 'Invalid Referral. You can only be referred once', isPersistentItem: true, type: 'danger' }, { root: true })
        }
        // reset state
        context.commit('validateFromAdvocateReferralName', '', { root: true })
      } catch (error) {
        console.error('🚒 validateFromAdvocateReferralName', error)
        context.commit('addNotification', { message: 'Invalid referral, valid referrer not found', type: 'danger', isPersistentItem: true }, { root: true })
      }
    },
    validateAdvocateReferralName: async (context) => {
      // handles /for/xyz
      // grant free accounts to press, influencers, and ambassadors. advocateReferralNames can only be used once
      try {
        const name = context.rootState.validateAdvocateReferralName
        if (!name) { return }
        const isAdvocate = await context.dispatch('api/getAdvocateUnused', name, { root: true })
        const isSignedIn = context.getters.isSignedIn
        if (isSignedIn) {
          context.commit('addNotification', { message: 'Only new users can be referred this way, please contact support to manually update your account', type: 'danger', isPersistentItem: true }, { root: true })
        } else if (isAdvocate) {
          context.commit('notifyReferralSuccessReferrerName', true, { root: true })
          // user.advocateReferrerName will be validated and marked as used by the server on sign up
          context.dispatch('update', { advocateReferrerName: name })
        } else {
          context.commit('addNotification', { message: 'Invalid referral, valid referrer not found', type: 'danger', isPersistentItem: true }, { root: true })
        }
        context.commit('validateAdvocateReferralName', '', { root: true })
      } catch (error) {
        console.error('🚒 validateAdvocateReferralName', error)
        context.commit('addNotification', { message: 'Invalid referral, valid referrer not found', type: 'danger', isPersistentItem: true }, { root: true })
      }
    },
    validateUserReferralFromSpaceInvite: async (context) => {
      const isFromSpaceInvite = Boolean(context.rootState.shouldValidateUserReferralFromSpaceInvite)
      if (!isFromSpaceInvite) { return }
      // get referrer
      const spaceMembers = context.rootGetters['currentSpace/members']()
      const referrerId = spaceMembers[0].id
      if (!referrerId) { return }
      const referrer = await context.dispatch('api/getPublicUser', { id: referrerId }, { root: true })
      if (!referrer) {
        context.commit('addNotification', { message: 'Invalid referral, referring user not found', isPersistentItem: true, type: 'danger' }, { root: true })
        return
      }
      // check if current user can be referred by space invite
      const isSignedIn = context.getters.isSignedIn
      const canBeReferred = context.getters.canBeReferred(referrerId) && !isSignedIn
      if (canBeReferred) {
        context.dispatch('addReferral', referrer)
      }
      // reset state
      context.commit('shouldValidateUserReferralFromSpaceInvite', false, { root: true })
    },
    addReferral: async (context, referrer) => {
      try {
        const isSignedIn = context.getters.isSignedIn
        context.dispatch('update', { referredByUserId: referrer.id })
        if (isSignedIn) {
          const referral = await context.dispatch('api/createReferral', {
            userId: referrer.id,
            referredUserId: context.state.id
          }, { root: true })
          console.log('🫧 referral created', referral)
          context.commit('notifyEarnedCredits', true, { root: true })
        } else {
          context.commit('notifyReferralSuccessUser', referrer, { root: true })
        }
      } catch (error) {
        console.error('🚒 addReferral', error)
        context.commit('addNotification', { message: 'Invalid Referral. You can only be referred once', isPersistentItem: true, type: 'danger' }, { root: true })
      }
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
    cannotEditUnlessSignedIn: (state, getters, rootState) => (space) => {
      space = space || rootState.currentSpace
      const spaceIsOpen = space.privacy === 'open'
      const currentUserIsSignedIn = getters.isSignedIn
      return !currentUserIsSignedIn && spaceIsOpen
    },
    cardIsCreatedByCurrentUser: (state, getters, rootState) => (card) => {
      const isCreatedByUser = state.id === card.userId
      const isUpdatedByUser = state.id === card.nameUpdatedByUserId
      const isNoUser = !card.userId && !card.nameUpdatedByUserId
      return isCreatedByUser || isUpdatedByUser || isNoUser
    },
    boxIsCreatedByCurrentUser: (state, getters, rootState) => (box) => {
      const isCreatedByUser = state.id === box.userId
      const isNoUser = !box.userId
      return isCreatedByUser || isNoUser
    },
    canEditCard: (state, getters, rootState, rootGetters) => (card) => {
      const isSpaceMember = getters.isSpaceMember()
      if (isSpaceMember) { return true }
      const canEditSpace = getters.canEditSpace
      const cardIsCreatedByCurrentUser = getters.cardIsCreatedByCurrentUser(card)
      if (canEditSpace && cardIsCreatedByCurrentUser) { return true }
      return false
    },
    canEditBox: (state, getters, rootState, rootGetters) => (box) => {
      const isSpaceMember = getters.isSpaceMember()
      if (isSpaceMember) { return true }
      const canEditSpace = getters.canEditSpace
      const boxIsCreatedByCurrentUser = getters.boxIsCreatedByCurrentUser(box)
      if (canEditSpace && boxIsCreatedByCurrentUser) { return true }
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
    },
    canBeReferred: (state, getters) => (referralUserId) => {
      const isAlreadyReferred = state.referredByUserId
      const isSameUser = referralUserId === state.id
      console.log('🕵️‍♀️ canBeReferred check:', { referralUserId, referredByUserId: isAlreadyReferred, isSameUser, isUpgraded: state.isUpgraded })
      if (isAlreadyReferred) { return }
      if (isSameUser) { return }
      if (state.isUpgraded) { return }
      return true
    },

    // AI Images

    AIImagesThisMonth: (state) => {
      if (state.isUpgraded) {
        const currentMonth = dayjs().month()
        return state.AIImages.filter(image => {
          const month = dayjs(image.createdAt).month()
          return month === currentMonth
        })
      } else {
        return state.AIImages
      }
    },
    AIImagesThisMonthCount: (state, getters) => {
      const images = getters.AIImagesThisMonth
      return Math.floor(images.length / 2)
    },
    AIImagesLimit: (state, getters) => {
      if (state.isUpgraded) {
        return consts.AIImageLimitUpgradedUser
      } else {
        return consts.AIImageLimitFreeUser
      }
    },
    AIImagesIsUnderLimit: (state, getters) => {
      const current = getters.AIImagesThisMonthCount
      const limit = getters.AIImagesLimit
      return current < limit
    },

    // Billing

    subscriptionIsApple: (state) => {
      return state.appleSubscriptionIsActive
    },
    subscriptionIsStripe: (state, getters) => {
      if (getters.subscriptionIsFree) { return }
      return state.stripeSubscriptionId
    },
    subscriptionIsFree: (state) => {
      const strings = ['🌷free', '🌷 free', '🫧free']
      return strings.includes(state.stripeSubscriptionId)
    }
  }
}
