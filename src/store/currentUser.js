import utils from '@/utils.js'
import cache from '@/cache.js'
import consts from '@/consts.js'
import postMessage from '@/postMessage.js'

import randomColor from 'randomcolor'
import { nanoid } from 'nanoid'
import { nextTick } from 'vue'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid' // polyfill for self.crypto.randomUUID(), for legacy todesktop support
import uniqBy from 'lodash-es/uniqBy'

const initialState = {
  id: nanoid(),
  lastSpaceId: '',
  color: randomColor({ luminosity: 'light' }),
  name: undefined,
  description: undefined,
  website: undefined,
  apiKey: '',
  arenaAccessToken: '',
  favoriteUsers: [],
  favoriteSpaces: [],
  favoriteColors: [],
  cardsCreatedCount: 0,
  cardsCreatedCountRaw: 0,
  isUpgraded: false,
  isModerator: false,
  filterShowUsers: false,
  filterShowDateUpdated: false,
  filterShowAbsoluteDates: false,
  filterUnchecked: false,
  filterComments: false,
  shouldHideTutorialCards: false,
  shouldHideDateCards: false,
  shouldEmailNotifications: true,
  shouldEmailBulletin: true,
  shouldEmailWeeklyReview: true,
  shouldShowMoreAlignOptions: false,
  shouldUseLastConnectionType: true,
  shouldShowItemActions: false,
  shouldShowMultipleSelectedLineActions: false,
  shouldShowMultipleSelectedBoxActions: false,
  shouldDisableRightClickToPan: false,
  shouldShowCurrentSpaceTags: false,
  showInExploreUpdatedAt: null, // date
  defaultSpaceBackground: undefined,
  defaultSpaceBackgroundGradient: undefined,
  defaultSpaceBackgroundTint: undefined,
  defaultCardBackgroundColor: undefined,
  defaultConnectionControlPoint: 'q00,00', // null, 'q00,00'
  downgradeAt: null,
  shouldUseStickyCards: true,
  shouldIncreaseUIContrast: false,
  shouldPauseConnectionDirections: false,
  shouldInvertZoom: false,
  lastUsedImagePickerService: '',
  AIImages: [],
  theme: null,
  themeIsSystem: false,
  outsideSpaceBackgroundIsStatic: false,
  shouldDisableHapticFeedback: false,
  appleAppAccountToken: null,
  appleSubscriptionIsActive: null,
  studentDiscountIsAvailable: false,
  lastSidebarSection: '',
  prevInviteEmails: '',
  prevHeaderFontId: 0,
  cardSettingsDefaultCharacterLimit: consts.defaultCharacterLimit,
  cardSettingsShiftEnterShouldAddChildCard: true,
  cardSettingsMaxCardWidth: consts.normalCardMaxWidth,
  prevSettingsSection: null,
  disabledKeyboardShortcuts: ['newSpace'],

  // space filters

  dialogSpaceFilterByGroup: {},
  dialogSpaceFilterByUser: {},
  dialogSpaceFilterShowHidden: false,
  dialogSpaceFilterSortBy: null, // null, updatedAt, createdAt, alphabetical
  dialogSpaceFilterByTemplates: false,

  // user tags

  tags: [],

  // drawing

  drawingBrushSize: 'm',
  drawingColor: undefined
}

export default {
  namespaced: true,
  state: utils.clone(initialState),
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
      state.lastSpaceId = spaceId
      cache.updateUser('lastSpaceId', spaceId)
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
      Object.keys(user).forEach(key => {
        state[key] = user[key]
      })
      if (utils.userIsUpgraded(user)) {
        state.isUpgraded = true
      }
      if (user.apiKey) {
        postMessage.send({ name: 'setApiKey', value: user.apiKey })
      }
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
    cardsCreatedCountRaw: (state, count) => {
      utils.typeCheck({ value: count, type: 'number' })
      state.cardsCreatedCountRaw = count
      cache.updateUser('cardsCreatedCountRaw', count)
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
    shouldHideTutorialCards: (state, value) => {
      state.shouldHideTutorialCards = value
      cache.updateUser('shouldHideTutorialCards', value)
    },
    shouldHideDateCards: (state, value) => {
      state.shouldHideDateCards = value
      cache.updateUser('shouldHideDateCards', value)
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
    shouldShowMultipleSelectedLineActions: (state, value) => {
      state.shouldShowMultipleSelectedLineActions = value
      cache.updateUser('shouldShowMultipleSelectedLineActions', value)
    },
    shouldShowMultipleSelectedBoxActions: (state, value) => {
      state.shouldShowMultipleSelectedBoxActions = value
      cache.updateUser('shouldShowMultipleSelectedBoxActions', value)
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
    dialogSpaceFilterByUser: (state, value) => {
      utils.typeCheck({ value, type: 'object' })
      state.dialogSpaceFilterByUser = value
      value = utils.clone(value)
      cache.updateUser('dialogSpaceFilterByUser', value)
    },
    dialogSpaceFilterShowHidden: (state, value) => {
      state.dialogSpaceFilterShowHidden = value
      cache.updateUser('dialogSpaceFilterShowHidden', value)
    },
    dialogSpaceFilterByTemplates: (state, value) => {
      state.dialogSpaceFilterByTemplates = value
      cache.updateUser('dialogSpaceFilterByTemplates', value)
    },
    dialogSpaceFilterByGroup: (state, value) => {
      utils.typeCheck({ value, type: 'object' })
      state.dialogSpaceFilterByGroup = value
      value = utils.clone(value)
      cache.updateUser('dialogSpaceFilterByGroup', value)
    },
    dialogSpaceFilterSortBy: (state, value) => {
      state.dialogSpaceFilterSortBy = value
      cache.updateUser('dialogSpaceFilterSortBy', value)
    },
    defaultSpaceBackground: (state, value) => {
      state.defaultSpaceBackground = value
      cache.updateUser('defaultSpaceBackground', value)
    },
    defaultSpaceBackgroundGradient: (state, value) => {
      state.defaultSpaceBackgroundGradient = value
      cache.updateUser('defaultSpaceBackgroundGradient', value)
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
    outsideSpaceBackgroundIsStatic: (state, value) => {
      state.outsideSpaceBackgroundIsStatic = value
      cache.updateUser('outsideSpaceBackgroundIsStatic', value)
    },
    shouldDisableHapticFeedback: (state, value) => {
      state.shouldDisableHapticFeedback = value
      cache.updateUser('shouldDisableHapticFeedback', value)
    },
    shouldUseStickyCards: (state, value) => {
      state.shouldUseStickyCards = value
      cache.updateUser('shouldUseStickyCards', value)
    },
    shouldIncreaseUIContrast: (state, value) => {
      state.shouldIncreaseUIContrast = value
      cache.updateUser('shouldIncreaseUIContrast', value)
    },
    shouldPauseConnectionDirections: (state, value) => {
      state.shouldPauseConnectionDirections = value
      cache.updateUser('shouldPauseConnectionDirections', value)
    },
    shouldInvertZoom: (state, value) => {
      state.shouldInvertZoom = value
      cache.updateUser('shouldInvertZoom', value)
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
    appleSubscriptionIsActive: (state, value) => {
      state.appleSubscriptionIsActive = value
    },
    updateAppleAppAccountToken: (state) => {
      state.appleAppAccountToken = uuidv4()
    },
    lastSidebarSection: (state, value) => {
      state.lastSidebarSection = value
    },
    prevInviteEmails: (state, value) => {
      state.prevInviteEmails = value
    },
    prevHeaderFontId: (state, value) => {
      state.prevHeaderFontId = value
    },
    cardSettingsDefaultCharacterLimit: (state, value) => {
      utils.typeCheck({ value, type: 'number' })
      state.cardSettingsDefaultCharacterLimit = value
    },
    cardSettingsShiftEnterShouldAddChildCard: (state, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      state.cardSettingsShiftEnterShouldAddChildCard = value
    },
    cardSettingsMaxCardWidth: (state, value) => {
      utils.typeCheck({ value, type: 'number' })
      state.cardSettingsMaxCardWidth = value
    },
    prevSettingsSection: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.prevSettingsSection = value
    },
    addToDisabledKeyboardShortcuts: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.disabledKeyboardShortcuts.push(value)
      cache.updateUser('disabledKeyboardShortcuts', value)
    },
    removeFromDisabledKeyboardShortcuts: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.disabledKeyboardShortcuts = state.disabledKeyboardShortcuts.filter(shortcutName => value !== shortcutName)
      cache.updateUser('disabledKeyboardShortcuts', value)
    },
    tags: (state, value) => {
      utils.typeCheck({ value, type: 'array' })
      state.tags = value
    },
    drawingColor: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.drawingColor = value
      cache.updateUser('drawingColor', value)
    },
    drawingBrushSize: (state, value) => {
      utils.typeCheck({ value, type: 'string' })
      state.drawingBrushSize = value
      cache.updateUser('drawingBrushSize', value)
    }
  },
  actions: {
    init: async (context) => {
      const cachedUser = await cache.user()
      if (utils.objectHasKeys(cachedUser)) {
        console.info('🌸 Restore user from cache', cachedUser.id)
        context.commit('restoreUser', cachedUser)
        context.dispatch('themes/restore', null, { root: true })
        await context.dispatch('restoreRemoteUser', cachedUser)
        await context.dispatch('restoreUserFavorites')
      } else {
        console.info('🌸 Create new user')
        context.dispatch('createNewUser')
      }
      context.dispatch('themes/restore', null, { root: true })
      context.commit('triggerUserIsLoaded', null, { root: true })
      context.dispatch('checkIfShouldJoinGroup')
    },
    checkIfShouldJoinGroup: (context) => {
      if (!context.rootState.groupToJoinOnLoad) { return }
      const currentUserIsSignedIn = context.getters.isSignedIn
      if (currentUserIsSignedIn) {
        context.dispatch('groups/joinGroup', null, { root: true })
      } else {
        context.commit('notifySignUpToJoinGroup', true, { root: true })
      }
    },
    update: async (context, updates) => {
      const keys = Object.keys(updates)
      keys.forEach(key => {
        context.commit(key, updates[key])
        context.dispatch('broadcastUpdate', { [key]: updates[key] })
      })
      await context.dispatch('api/addToQueue', { name: 'updateUser', body: updates }, { root: true })
    },
    cardsCreatedCountUpdateBy: async (context, { cards, shouldDecrement }) => {
      cards = cards.filter(card => !card.isCreatedThroughPublicApi)
      cards = cards.filter(card => card.userId === context.state.id)
      let delta = cards.length
      if (shouldDecrement) {
        delta = -delta
      }
      const count = context.state.cardsCreatedCount + delta
      // update raw vanity count
      context.commit('cardsCreatedCountRaw', count)
      await context.dispatch('api/addToQueue', { name: 'updateUserCardsCreatedCountRaw', body: { delta } }, { root: true })
      // update count
      if (context.getters.shouldPreventCardsCreatedCountUpdate) { return }
      await context.dispatch('api/addToQueue', { name: 'updateUserCardsCreatedCount', body: { delta } }, { root: true })
      context.commit('cardsCreatedCount', count)
    },
    isUpgraded: (context, value) => {
      context.commit('isUpgraded', value)
      context.commit('notifyCardsCreatedIsOverLimit', false, { root: true })
    },
    createNewUser: (context) => {
      context.commit('themeIsSystem', true)
      context.commit('updateAppleAppAccountToken')
      cache.saveUser(context.state)
    },
    broadcastUpdate: (context, updates) => {
      const space = context.rootState.currentSpace
      const spaceUserPermission = utils.capitalizeFirstLetter(context.getters.spaceUserPermission(space)) // User, Collaborator, Spectator
      const type = `update${spaceUserPermission}`
      const userId = context.state.id
      context.commit('broadcast/updateUser', { id: space.id, updates, type, userId }, { root: true })
      const user = utils.clone(context.state)
      user.userId = user.id
      context.commit('currentSpace/updateUser', user, { root: true })
      context.commit('currentSpace/updateCollaborator', user, { root: true })
    },
    lastSpaceId: async (context, spaceId) => {
      context.commit('lastSpaceId', spaceId)
      await cache.updateUser('lastSpaceId', spaceId)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          lastSpaceId: spaceId
        }
      }, { root: true })
    },
    resetLastSpaceId: async (context) => {
      const spaces = await cache.getAllSpaces()
      const lastSpace = spaces[1]
      if (lastSpace) {
        context.dispatch('lastSpaceId', lastSpace.id)
      } else {
        context.dispatch('lastSpaceId', '')
      }
    },
    restoreRemoteUser: async (context, cachedUser) => {
      if (!context.getters.isSignedIn) { return }
      const remoteUser = await context.dispatch('api/getUser', null, { root: true })
      if (!remoteUser) { return }
      remoteUser.AIImages = await context.dispatch('api/getUserAIImages', null, { root: true }) || []
      remoteUser.updatedAt = utils.unixTime(remoteUser.updatedAt)
      console.info('🌸 Restore user from remote', remoteUser)
      await cache.saveUser(remoteUser)
      context.commit('updateUser', remoteUser)
      if (utils.userIsUpgraded(remoteUser)) {
        context.commit('isUpgraded', true)
      } else {
        context.commit('isUpgraded', false)
      }
      const remoteTags = await context.dispatch('api/getUserTags', null, { root: true }) || []
      context.dispatch('tags', remoteTags)
      context.dispatch('groups/restore', remoteUser.groups, { root: true })
      if (context.rootState.shouldNotifyIsJoiningGroup) {
        context.commit('notifyIsJoiningGroup', true, { root: true })
      }
    },
    restoreUserFavorites: async (context) => {
      try {
        context.commit('isLoadingFavorites', true, { root: true })
        if (!context.getters.isSignedIn) {
          context.commit('isLoadingFavorites', false, { root: true })
          return
        }
        const [favoriteSpaces, favoriteUsers, favoriteColors] = await Promise.all([
          context.dispatch('api/getUserFavoriteSpaces', null, { root: true }),
          context.dispatch('api/getUserFavoriteUsers', null, { root: true }),
          context.dispatch('api/getUserFavoriteColors', null, { root: true })
        ])
        if (favoriteUsers) {
          context.commit('favoriteUsers', favoriteUsers)
        }
        if (favoriteSpaces) {
          context.commit('favoriteSpaces', favoriteSpaces)
        }
        if (favoriteColors) {
          context.commit('favoriteColors', favoriteColors)
        }
        context.commit('isLoadingFavorites', false, { root: true })
      } catch (error) {
        console.error('🚒 restoreUserFavorites', error)
      }
    },
    updateFavoriteSpace: async (context, { space, value }) => {
      let favoriteSpaces = utils.clone(context.state.favoriteSpaces)
      // add space
      if (value) {
        space = utils.clone(space)
        favoriteSpaces.push(space)
        context.dispatch('userNotifications/addFavoriteSpace', space, { root: true })
      // remove space
      } else {
        favoriteSpaces = favoriteSpaces.filter(favoriteSpace => {
          return favoriteSpace.id !== space.id
        })
        context.dispatch('userNotifications/removeFavoriteSpace', space, { root: true })
      }
      context.commit('favoriteSpaces', favoriteSpaces)
      const body = { spaceId: space.id, value }
      await context.dispatch('api/addToQueue', { name: 'updateFavoriteSpace', body, spaceId: space.id }, { root: true })
    },
    updateFavoriteUser: async (context, { user, value }) => {
      let favoriteUsers = utils.clone(context.state.favoriteUsers)
      // add user
      if (value) {
        favoriteUsers.push(user)
        context.dispatch('userNotifications/addFavoriteUser', user, { root: true })
      // remove user
      } else {
        favoriteUsers = favoriteUsers.filter(favoriteUser => {
          return favoriteUser.id !== user.id
        })
        context.dispatch('userNotifications/removeFavoriteUser', user, { root: true })
      }
      context.commit('favoriteUsers', favoriteUsers)
      const body = { favoriteUserId: user.id, value }
      await context.dispatch('api/addToQueue', { name: 'updateFavoriteUser', body }, { root: true })
    },
    updateFavoriteColor: async (context, { color, value }) => {
      color = color.color
      let favoriteColors = utils.clone(context.state.favoriteColors)
      if (value) {
        favoriteColors.push(color)
      } else {
        favoriteColors = favoriteColors.filter(favoriteColor => {
          return favoriteColor !== color
        })
      }
      context.commit('favoriteColors', favoriteColors)
      const body = { color, value }
      await context.dispatch('api/addToQueue', { name: 'updateFavoriteColor', body }, { root: true })
    },
    confirmEmail: async (context) => {
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          emailIsVerified: true
        }
      }, { root: true })
    },
    arenaAccessToken: async (context, token) => {
      context.commit('arenaAccessToken', token)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          arenaAccessToken: token
        }
      }, { root: true })
    },
    updateArenaAccessToken: async (context, arenaReturnedCode) => {
      console.info('updateArenaAccessToken')
      context.commit('importArenaChannelIsVisible', true, { root: true })
      context.commit('isAuthenticatingWithArena', true, { root: true })
      const response = await context.dispatch('api/updateArenaAccessToken', arenaReturnedCode, { root: true })
      context.commit('arenaAccessToken', response.arenaAccessToken)
      context.commit('importArenaChannelIsVisible', true, { root: true })
      context.commit('isAuthenticatingWithArena', false, { root: true })
    },
    toggleFilterShowUsers: async (context, value) => {
      context.commit('filterShowUsers', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          filterShowUsers: value
        }
      }, { root: true })
    },
    toggleFilterShowDateUpdated: async (context, value) => {
      context.commit('filterShowDateUpdated', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          filterShowDateUpdated: value
        }
      }, { root: true })
    },
    toggleFilterShowAbsoluteDates: async (context, value) => {
      context.commit('filterShowAbsoluteDates', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          filterShowAbsoluteDates: value
        }
      }, { root: true })
    },
    toggleFilterUnchecked: async (context, value) => {
      context.commit('filterUnchecked', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          filterUnchecked: value
        }
      }, { root: true })
    },
    toggleFilterComments: async (context, value) => {
      context.commit('filterComments', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          filterComments: value
        }
      }, { root: true })
    },
    clearUserFilters: (context) => {
      context.dispatch('toggleFilterShowUsers', false)
      context.dispatch('toggleFilterShowDateUpdated', false)
      context.dispatch('toggleFilterShowAbsoluteDates', false)
      context.dispatch('toggleFilterUnchecked', false)
      context.dispatch('toggleFilterComments', false)
    },
    shouldHideTutorialCards: async (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldHideTutorialCards', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          shouldHideTutorialCards: value
        }
      }, { root: true })
    },
    shouldHideDateCards: async (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldHideDateCards', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          shouldHideDateCards: value
        }
      }, { root: true })
    },
    shouldEmailNotifications: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldEmailNotifications', value)
      context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          shouldEmailNotifications: value
        }
      }, { root: true })
    },
    shouldEmailBulletin: (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldEmailBulletin', value)
      context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          shouldEmailBulletin: value
        }
      }, { root: true })
    },
    shouldEmailWeeklyReview: async (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldEmailWeeklyReview', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          shouldEmailWeeklyReview: value
        }
      }, { root: true })
    },
    shouldShowMoreAlignOptions: async (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldShowMoreAlignOptions', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          shouldShowMoreAlignOptions: value
        }
      }, { root: true })
    },
    shouldShowItemActions: async (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldShowItemActions', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          shouldShowItemActions: value
        }
      }, { root: true })
    },
    shouldShowMultipleSelectedLineActions: async (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldShowMultipleSelectedLineActions', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          shouldShowMultipleSelectedLineActions: value
        }
      }, { root: true })
    },
    shouldShowMultipleSelectedBoxActions: async (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldShowMultipleSelectedBoxActions', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          shouldShowMultipleSelectedBoxActions: value
        }
      }, { root: true })
    },
    showInExploreUpdatedAt: async (context, value) => {
      utils.typeCheck({ value, type: 'string' })
      context.commit('showInExploreUpdatedAt', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          showInExploreUpdatedAt: value
        }
      }, { root: true })
    },
    shouldDisableRightClickToPan: async (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldDisableRightClickToPan', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          shouldDisableRightClickToPan: value
        }
      }, { root: true })
    },
    shouldUseLastConnectionType: async (context, value) => {
      utils.typeCheck({ value, type: 'boolean' })
      context.commit('shouldUseLastConnectionType', value)
      await context.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          shouldUseLastConnectionType: value
        }
      }, { root: true })
    },
    inboxSpace: async (context) => {
      let space = await cache.getInboxSpace()
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
    tags: async (context, tags) => {
      tags = uniqBy(tags, 'name')
      context.commit('tags', tags)
    },
    cycleDrawingBrushSize: (context) => {
      const prevValue = context.state.drawingBrushSize
      let value
      if (prevValue === 's') {
        value = 'm'
      }
      if (prevValue === 'm') {
        value = 'l'
      }
      if (prevValue === 'l') {
        value = 's'
      }
      context.commit('drawingBrushSize', value)
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
    canEditSpace: (state, getters, rootState, rootGetters) => (space) => {
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
      if (!card) { return }
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
      const canEditSpace = getters.canEditSpace()
      const cardIsCreatedByCurrentUser = getters.cardIsCreatedByCurrentUser(card)
      if (canEditSpace && cardIsCreatedByCurrentUser) { return true }
      return false
    },
    canOnlyComment: (state, getters, rootState, rootGetters) => () => {
      const canEditSpace = getters.canEditSpace()
      const isSpaceMember = getters.isSpaceMember()
      return canEditSpace && !isSpaceMember
    },
    canEditBox: (state, getters, rootState, rootGetters) => (box) => {
      const isSpaceMember = getters.isSpaceMember()
      if (isSpaceMember) { return true }
      const canEditSpace = getters.canEditSpace()
      const boxIsCreatedByCurrentUser = getters.boxIsCreatedByCurrentUser(box)
      if (canEditSpace && boxIsCreatedByCurrentUser) { return true }
      return false
    },
    connectionIsCreatedByCurrentUser: (state, getters, rootState) => (connection) => {
      return state.id === connection.userId
    },
    isSpaceMember: (state, getters, rootState, rootGetters) => (space) => {
      // a member is a user, collaborator, or group member
      space = space || rootState.currentSpace
      const isSpaceUser = getters.isSpaceUser(space)
      const isSpaceCollaborator = getters.isSpaceCollaborator(space)
      const isGroupMember = rootGetters['groups/currentUserIsCurrentSpaceGroupUser']
      return Boolean(isSpaceUser || isSpaceCollaborator || isGroupMember)
    },
    isSpaceUser: (state, getters, rootState) => (space) => {
      let userIsInSpace = Boolean(space.users?.find(user => {
        return user.id === state.id
      }))
      userIsInSpace = userIsInSpace || space.userId === state.id
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
    isSpaceCreator: (state, getters, rootState) => (space) => {
      space = space || rootState.currentSpace
      return space.userId === state.id
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
    isReadOnlyInvitedToSpace: (state, getters, rootState) => (space) => {
      return rootState.spaceReadOnlyKey.spaceId === space.id
    },
    shouldPreventCardsCreatedCountUpdate: (state, getters, rootState, rootGetters) => {
      const spaceCreatorIsUpgraded = rootGetters['currentSpace/spaceCreatorIsUpgraded']
      const spaceCreatorIsCurrentUser = rootGetters['currentSpace/spaceCreatorIsCurrentUser']
      if (spaceCreatorIsUpgraded && !spaceCreatorIsCurrentUser) {
        return true
      }
    },
    totalFiltersActive: (state, getters) => {
      let userFilters = getters.totalItemFadingFiltersActive
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
    totalItemFadingFiltersActive: (state, getters, rootState) => {
      let userFilters = 0
      if (state.filterUnchecked) {
        userFilters += 1
      }
      const tagNames = rootState.filteredTagNames
      const connections = rootState.filteredConnectionTypeIds
      const frames = rootState.filteredFrameIds
      const boxes = rootState.filteredBoxIds
      return userFilters + tagNames.length + connections.length + frames.length + boxes.length
    },

    // AI Images

    AIImagesThisMonth: (state, getters) => {
      if (state.isUpgraded) {
        const currentMonth = dayjs().month()
        const currentYear = dayjs().year()
        return state.AIImages.filter(image => {
          const month = dayjs(image.createdAt).month()
          const year = dayjs(image.createdAt).year()
          const isInCurrentMonth = month === currentMonth
          const isInCurrentYear = year === currentYear
          return isInCurrentMonth && isInCurrentYear
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
    },

    // user tags

    tagByName: (state, getters) => (name) => {
      return state.tags.find(tag => tag.name === name)
    },

    // drawing

    drawingColor: (state) => {
      return state.drawingColor || state.color
    }
  }
}
