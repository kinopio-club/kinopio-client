import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { useConnectionStore } from '@/stores/useConnectionStore'

import store from '@/store/store.js' // TEMP Import Vuex store

import utils from '@/utils.js'
import consts from '@/consts.js'
import cache from '@/cache.js'
import postMessage from '@/postMessage.js'

import randomColor from 'randomcolor'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid' // polyfill for self.crypto.randomUUID(), for legacy todesktop support, 2014
import uniqBy from 'lodash-es/uniqBy'

export const useUserStore = defineStore('users', {
  state: () => ({
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
    hiddenSpaces: [],
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
    defaultConnectionControlPoint: consts.straightLineConnectionPathControlPoint,
    downgradeAt: null,
    shouldUseStickyCards: true,
    shouldIncreaseUIContrast: false,
    shouldPauseConnectionDirections: false,
    shouldInvertZoom: false,
    lastUsedImagePickerService: '',
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
  }),

  getters: {
    getUserAllState: (state) => {
      return { ...state }
    },
    getUserIsSignedIn: (state) => {
      return Boolean(state.apiKey)
    },
    getUserIsCurrentUser: (state) => {
      return (user) => Boolean(state.id === user.id)
    },
    getUserCardsCreatedIsOverLimit: (state) => {
      const cardsCreatedLimit = consts.cardsCreatedLimit
      if (state.isUpgraded) { return }
      if (state.cardsCreatedCount >= cardsCreatedLimit) { return true }
    },
    getShouldPreventCardsCreatedCountUpdate: (state) => {
      const isUpgraded = store.getters['currentSpace/spaceCreatorIsUpgraded']
      const isCurrentUser = store.getters['currentSpace/spaceCreatorIsCurrentUser']
      return (isUpgraded && !isCurrentUser)
    },
    getUserTotalItemFadingFiltersActive: (state) => {
      let userFilters = 0
      if (state.filterUnchecked) {
        userFilters += 1
      }
      const tagNames = store.state.filteredTagNames
      const connections = store.state.filteredConnectionTypeIds
      const frames = store.state.filteredFrameIds
      const boxes = store.state.filteredBoxIds
      return userFilters + tagNames.length + connections.length + frames.length + boxes.length
    },
    getUserIsUnableToEditUnlessSignedIn: (state) => {
      const space = store.state.currentSpace
      const spaceIsOpen = space.privacy === 'open'
      const isSignedIn = Boolean(state.apiKey)
      return !isSignedIn && spaceIsOpen
    },
    getUserIsSpaceCreator: (state) => {
      const space = store.state.currentSpace
      return space.userId === state.id
    },
    getUserIsSpaceCollaborator: (state) => {
      const space = store.state.currentSpace
      if (space.collaborators) {
        return Boolean(space.collaborators.find(collaborator => {
          return collaborator.id === this.id
        }))
      }
    },
    getUserTagByName: (state) => {
      return (name) => state.tags.find(tag => tag.name === name)
    },
    getUserDrawingColor: (state) => {
      return state.drawingColor || state.color
    }

    // tagByName: (state, getters) => (name) => {
    //   return
    // },

    // cannotEditUnlessSignedIn: (state, getters, rootState) => (space) => {
    //   space = space || rootState.currentSpace
    //   const spaceIsOpen = space.privacy === 'open'
    //   const currentUserIsSignedIn = getters.isSignedIn
    //   return !currentUserIsSignedIn && spaceIsOpen
    // },
    // connectionIsCreatedByCurrentUser: (state, getters, rootState) => (connection) => {
    //   return state.id === connection.userId
    // },
    // isSpaceUser: (state, getters, rootState) => (space) => {
    //   let userIsInSpace = Boolean(space.users?.find(user => {
    //     return user.id === state.id
    //   }))
    //   userIsInSpace = userIsInSpace || space.userId === state.id
    //   return userIsInSpace
    // },
    // isReadOnlyInvitedToSpace: (state, getters, rootState) => (space) => {
    //   return rootState.spaceReadOnlyKey.spaceId === space.id
    // },
    // shouldPreventCardsCreatedCountUpdate: (state, getters, rootState, rootGetters) => {
    //   const spaceCreatorIsUpgraded = rootGetters['currentSpace/spaceCreatorIsUpgraded']
    //   const spaceCreatorIsCurrentUser = rootGetters['currentSpace/spaceCreatorIsCurrentUser']
    //   if (spaceCreatorIsUpgraded && !spaceCreatorIsCurrentUser) {
    //     return true
    //   }
    // },

    // // Billing

    // subscriptionIsApple: (state) => {
    //   return state.appleSubscriptionIsActive
    // },

    // // user tags

    // // drawing

  },

  actions: {

    // TODO refactor these into standard getters if space always = store.state.currentSpace
    // const spaceStore = useSpaceStore()
    getUserIsSpaceUser (space) {
      space = space || store.state.currentSpace
      let userIsInSpace = Boolean(space.users?.find(user => {
        return user.id === this.id
      }))
      userIsInSpace = userIsInSpace || space.userId === this.id
      return userIsInSpace
    },
    getUserSpacePermission (space) {
      space = space || store.state.currentSpace
      const isSpaceUser = this.getUserIsSpaceUser(space)
      const isSpaceCollaborator = this.getUserIsSpaceCollaborator
      const spaceHasNoUsers = !space.users.length
      if (isSpaceUser || spaceHasNoUsers) {
        return 'user'
      } else if (isSpaceCollaborator) {
        return 'collaborator'
      } else {
        return 'spectator'
      }
    },
    getUserIsSpaceMember (space) {
      space = space || store.state.currentSpace
      const isSpaceUser = this.getUserIsSpaceUser(space)
      const isSpaceCollaborator = this.getUserIsSpaceCollaborator
      const isGroupMember = store.getters['groups/currentUserIsCurrentSpaceGroupUser']
      return Boolean(isSpaceUser || isSpaceCollaborator || isGroupMember)
    },
    getUserCanEditSpace (space) {
      space = space || store.state.currentSpace
      const spaceIsOpen = space.privacy === 'open'
      const currentUserIsSignedIn = this.getUserIsSignedIn
      const canEditOpenSpace = spaceIsOpen && currentUserIsSignedIn
      const isSpaceMember = this.getUserIsSpaceMember(space)
      return canEditOpenSpace || isSpaceMember
    },

    getUserCanEditBox (box) {
      const isSpaceMember = this.getUserIsSpaceMember()
      if (isSpaceMember) { return true }
      const canEditSpace = this.getUserCanEditSpace()
      const createdBox = this.getUserIsBoxCreator(box)
      if (canEditSpace && createdBox) { return true }
      return false
    },
    getUserIsBoxCreator (box) {
      const isCreatedByUser = this.id === box.userId
      const isNoUser = !box.userId
      return isCreatedByUser || isNoUser
    },
    getUserIsCardCreator (card) {
      if (!card) { return }
      const isCreatedByUser = this.id === card.userId
      const isUpdatedByUser = this.id === card.nameUpdatedByUserId
      const isNoUser = !card.userId && !card.nameUpdatedByUserId
      return isCreatedByUser || isUpdatedByUser || isNoUser
    },
    getUserCanEditCard (card) {
      const isSpaceMember = this.getUserIsSpaceMember()
      if (isSpaceMember) { return true }
      const canEditSpace = this.getUserCanEditSpace()
      const getUserIsCardCreator = this.getUserIsCardCreator(card)
      if (canEditSpace && getUserIsCardCreator) { return true }
      return false
    },
    getUserTotalFiltersActive () {
      let userFilters = this.totalItemFadingFiltersActive
      if (this.filterShowUsers) {
        userFilters += 1
      }
      if (this.filterShowDateUpdated) {
        userFilters += 1
      }
      if (this.filterComments) {
        userFilters += 1
      }
      return userFilters
    },

    getIsUserCommentOnly () {
      const canEditSpace = this.getUserCanEditSpace()
      const isSpaceMember = this.getUserIsSpaceMember()
      return canEditSpace && !isSpaceMember
    },

    // TODO refactor to getter after store -> rootStore

    getUserIsReadOnlyInvitedToSpace (space) {
      // space always currentspace?
      return store.state.spaceReadOnlyKey.spaceId === space.id
    },
    getItemIsCreatedByUser (connection) {
      return this.id === connection.userId
    },

    // init

    async updateUserState (user) {
      if (utils.userIsUpgraded(user)) {
        user.isUpgraded = true
      } else {
        user.isUpgraded = false
      }
      if (user.apiKey) {
        postMessage.send({ name: 'setApiKey', value: user.apiKey })
      }
      await cache.saveUser(user)
      Object.keys(user).forEach(item => {
        this[item] = user[item]
      })
    },
    async createNewUser () {
      this.themeIsSystem = true
      this.appleAppAccountToken = uuidv4()
      const allState = { ...this.$state }
      cache.saveUser(allState)
    },
    async restoreRemoteUser () {
      if (!this.getUserIsSignedIn) { return }
      const user = await store.dispatch('api/getUser', null, { root: true })
      if (!user) { return }
      user.updatedAt = utils.unixTime(user.updatedAt)
      console.info('🌸 Initialize user from remote', user)
      this.updateUserState(user)
    },
    async restoreUserAssociatedData () {
      try {
        store.commit('isLoadingFavorites', true, { root: true })
        if (!this.getUserIsSignedIn) {
          store.commit('isLoadingFavorites', false, { root: true })
          return
        }
        const [favoriteSpaces, favoriteUsers, favoriteColors, hiddenSpaces, tags, groups] = await Promise.all([
          store.dispatch('api/getUserFavoriteSpaces', null, { root: true }),
          store.dispatch('api/getUserFavoriteUsers', null, { root: true }),
          store.dispatch('api/getUserFavoriteColors', null, { root: true }),
          store.dispatch('api/getUserHiddenSpaces', null, { root: true }),
          store.dispatch('api/getUserTags', null, { root: true }),
          store.dispatch('api/getUserGroups', null, { root: true })
        ])
        if (favoriteUsers) {
          this.favoriteUsers = favoriteUsers
        }
        if (favoriteSpaces) {
          this.favoriteSpaces = favoriteSpaces
        }
        if (favoriteColors) {
          this.favoriteColors = favoriteColors
        }
        if (hiddenSpaces) {
          this.hiddenSpaces = hiddenSpaces
        }
        if (tags) {
          const newTags = uniqBy(tags, 'name')
          this.tags = newTags
        }
        if (groups) {
          store.commit('groups/restore', groups, { root: true })
        }
        store.commit('isLoadingFavorites', false, { root: true })
      } catch (error) {
        console.error('🚒 restoreUserAssociatedData', error)
      }
    },
    checkIfShouldJoinGroup () {
      if (!store.state.groupToJoinOnLoad) { return }
      if (this.getUserIsSignedIn) {
        store.dispatch('groups/joinGroup', null, { root: true })
      } else {
        store.commit('notifySignUpToJoinGroup', true, { root: true })
      }
    },
    async initializeUser () {
      const cachedUser = await cache.user()
      if (utils.objectHasKeys(cachedUser)) {
        console.info('🌸 Initialize user from cache', cachedUser.id)
        this.updateUserState(cachedUser)
        store.dispatch('themes/restore', null, { root: true })
        await this.restoreRemoteUser(cachedUser)
        await this.restoreUserAssociatedData()
      } else {
        console.info('🌸 Create new user')
        store.dispatch('createNewUser')
      }
      store.dispatch('themes/restore', null, { root: true })
      store.commit('triggerUserIsLoaded', null, { root: true })
      this.checkIfShouldJoinGroup()
      console.log('🍍', { ...this.$state })
    },

    // update

    broadcastUpdate (updates) {
      const space = store.state.currentSpace
      const spacePermission = utils.capitalizeFirstLetter(this.getUserSpacePermission(space)) // User, Collaborator, Spectator
      const type = `update${spacePermission}`
      store.commit('broadcast/updateUser', { id: space.id, updates, type, userId: this.id }, { root: true })
      const user = { ...this.$state }
      user.userId = user.id
      store.commit('currentSpace/updateUser', user, { root: true })
      store.commit('currentSpace/updateCollaborator', user, { root: true })
    },

    async updateUser (update) {
      const keys = Object.keys(update)
      for (const key of keys) {
        this[key] = update[key]
        await cache.updateUser(key, update[key])
        this.broadcastUpdate({ [key]: update[key] })
      }
      await store.dispatch('api/addToQueue', { name: 'updateUser', body: update }, { root: true })
    },

    // favorites

    async updateUserFavoriteSpace (space, shouldAdd) {
      if (shouldAdd) {
        this.favoriteSpaces.push(space)
        store.dispatch('userNotifications/addFavoriteSpace', space, { root: true })
      } else {
        this.favoriteSpaces = this.favoriteSpaces.filter(favoriteSpace => {
          return favoriteSpace.id !== space.id
        })
        store.dispatch('userNotifications/removeFavoriteSpace', space, { root: true })
      }
      const body = { spaceId: space.id, value: shouldAdd }
      await store.dispatch('api/addToQueue', { name: 'updateFavoriteSpace', body, spaceId: space.id }, { root: true })
    },
    async updateUserFavoriteUser (user, shouldAdd) {
      if (shouldAdd) {
        this.favoriteUsers.push(user)
        store.dispatch('userNotifications/addFavoriteUser', user, { root: true })
      } else {
        this.favoriteUsers = this.favoriteUsers.filter(favoriteUser => {
          return favoriteUser.id !== user.id
        })
        store.dispatch('userNotifications/removeFavoriteUser', user, { root: true })
      }
      const body = { favoriteUserId: user.id, value: shouldAdd }
      await store.dispatch('api/addToQueue', { name: 'updateFavoriteUser', body }, { root: true })
    },
    async updateUserFavoriteColor (color, shouldAdd) {
      color = color.color
      if (shouldAdd) {
        this.favoriteColors.push(color)
      } else {
        this.favoriteColors = this.favoriteColors.filter(favoriteColor => {
          return favoriteColor !== color
        })
      }
      const body = { color, value: shouldAdd }
      await store.dispatch('api/addToQueue', { name: 'updateFavoriteColor', body }, { root: true })
    },

    async updateUserFavoriteSpaceIsEdited (space) {
      this.favoriteSpaces = this.favoriteSpaces.map(favoriteSpace => {
        if (favoriteSpace.id === space.id) {
          favoriteSpace.isEdited = false
        }
        return space
      })
      await cache.updateUser('favoriteSpaces', this.favoriteSpaces)
    },

    // keyboard shortcuts

    addToDisabledKeyboardShortcuts (value) {
      this.disabledKeyboardShortcuts.push(value)
      cache.updateUser('disabledKeyboardShortcuts', value)
    },
    removeFromDisabledKeyboardShortcuts (value) {
      this.disabledKeyboardShortcuts = this.disabledKeyboardShortcuts.filter(shortcutName => value !== shortcutName)
      cache.updateUser('disabledKeyboardShortcuts', value)
    },

    // last space id

    async clearUserLastSpaceId () {
      const spaces = await cache.getAllSpaces()
      const lastSpace = spaces[1]
      if (lastSpace) {
        this.updateUser({ lastSpace: lastSpace.id })
      } else {
        this.updateUser({ lastSpace: '' })
      }
    },

    // card limit

    async updateUserCardsCreatedCount (cards, shouldDecrement) {
      cards = cards.filter(card => !card.isCreatedThroughPublicApi)
      cards = cards.filter(card => this.getUserIsCurrentUser({ id: card.userId }))
      let delta = cards.length
      if (shouldDecrement) {
        delta = -delta
      }
      const count = this.cardsCreatedCount + delta
      // update raw vanity count
      this.cardsCreatedCountRaw = count
      await store.dispatch('api/addToQueue', { name: 'updateUserCardsCreatedCountRaw', body: { delta } }, { root: true })
      // update count
      if (this.getShouldPreventCardsCreatedCountUpdate) { return }
      this.cardsCreatedCount = count
      await store.dispatch('api/addToQueue', { name: 'updateUserCardsCreatedCount', body: { delta } }, { root: true })
    },
    getUserCardsCreatedWillBeOverLimit (count) {
      if (this.isUpgraded) { return }
      if (this.cardsCreatedCount + count >= consts.cardsCreatedLimit) { return true }
    },

    // inbox

    async getInboxSpace () {
      let space = await cache.getInboxSpace()
      if (!space) {
        try {
          space = await store.dispatch('api/getUserInboxSpace', null, { root: true })
        } catch (error) {
          console.warn('🚑 inboxSpace', error)
        }
      }
      return space
    },

    // email

    async updateUserEmailIsVerified () {
      await store.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: {
          emailIsVerified: true
        }
      }, { root: true })
    },

    // are.na

    async updateUserArenaAccessToken (arenaReturnedCode) {
      console.info('updateArenaAccessToken')
      store.commit('importArenaChannelIsVisible', true, { root: true })
      store.commit('isAuthenticatingWithArena', true, { root: true })
      const { arenaAccessToken } = await store.dispatch('api/updateArenaAccessToken', arenaReturnedCode, { root: true })
      this.arenaAccessToken = arenaAccessToken
      store.commit('importArenaChannelIsVisible', true, { root: true })
      store.commit('isAuthenticatingWithArena', false, { root: true })
      await store.dispatch('api/addToQueue', {
        name: 'updateUser',
        body: { arenaAccessToken }
      }, { root: true })
    },

    // drawing

    cycleDrawingBrushSize () {
      const prevValue = this.drawingBrushSize
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
      this.drawingBrushSize = value
    },

    // notify

    notifyReadOnly (position) {
      const canEditSpace = this.getUserCanEditSpace()
      if (canEditSpace) { return }
      const cannotEdit = this.getUserIsUnableToEditUnlessSignedIn
      const notificationWithPosition = document.querySelector('.notifications-with-position .item')
      if (cannotEdit) {
        store.commit('addNotificationWithPosition', { message: 'Sign in to Edit', position, type: 'info', layer: 'space', icon: 'cancel' }, { root: true })
      } else {
        store.commit('addNotificationWithPosition', { message: 'Space is Read Only', position, type: 'info', layer: 'space', icon: 'cancel' }, { root: true })
      }
    },

    // hidden spaces

    async updateUserHiddenSpace (spaceId, isHidden) {
      const space = { id: spaceId }
      if (isHidden) {
        this.hiddenSpaces.push(space)
      } else {
        this.hiddenSpaces = this.hiddenSpaces.filter(space => {
          return space?.id !== spaceId
        })
      }
      await store.dispatch('api/addToQueue', {
        name: 'updateSpaceIsHidden',
        body: {
          spaceId,
          isHidden
        }
      }, { root: true })
    }

  }
})
